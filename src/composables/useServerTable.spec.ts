import { effectScope, nextTick, reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/utils/axios', () => ({
  default: { get: vi.fn() },
}))

import http from '@/utils/axios'
import { useServerTable } from './useServerTable'

async function flushRequests() {
  await Promise.resolve()
  await Promise.resolve()
  await nextTick()
}

describe('useServerTable', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.mocked(http.get).mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('atualiza em segundo plano preservando busca, paginação, seleção e registros durante a consulta', async () => {
    let finish: (value: any) => void = () => {}
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: {
          data: [{ id: 1, status: 'EMITINDO' }],
          page: 2,
          pageSize: 10,
          total: 20,
          totalPages: 2,
        },
      } as any)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve
          }),
      )
    localStorage.setItem(
      'gestaofacil:datatable:teste-background',
      JSON.stringify({
        version: 1,
        pageIndex: 1,
        pageSize: 10,
        search: 'cliente',
        sorting: [{ id: 'criadoEm', desc: true }],
        columnVisibility: {},
        filters: {},
      }),
    )
    const scope = effectScope()
    const state = scope.run(() => useServerTable('/notas', [], {}, 'teste-background'))!
    await flushRequests()
    state.rowSelection.value = { '1': true }

    const request = state.fetchData({ background: true })
    expect(state.loading.value).toBe(false)
    expect(state.refreshing.value).toBe(true)
    expect(state.data.value).toEqual([{ id: 1, status: 'EMITINDO' }])
    expect(http.get).toHaveBeenLastCalledWith(
      '/notas',
      expect.objectContaining({
        params: expect.objectContaining({
          page: 2,
          search: 'cliente',
          sortBy: 'criadoEm',
          order: 'desc',
        }),
      }),
    )
    finish({
      data: {
        data: [{ id: 1, status: 'AUTORIZADA' }],
        page: 2,
        pageSize: 10,
        total: 20,
        totalPages: 2,
      },
    })
    await request
    expect(state.refreshing.value).toBe(false)
    expect(state.data.value[0].status).toBe('AUTORIZADA')
    expect(state.pageIndex.value).toBe(1)
    expect(state.search.value).toBe('cliente')
    expect(state.rowSelection.value).toEqual({ '1': true })
    scope.stop()
  })

  it('não antecipa a busca em digitação por causa da atualização automática', async () => {
    vi.useFakeTimers()
    vi.mocked(http.get).mockResolvedValue({
      data: { data: [{ id: 1 }], page: 1, pageSize: 10, total: 1, totalPages: 1 },
    } as any)
    const scope = effectScope()
    const state = scope.run(() => useServerTable('/notas', []))!
    await flushRequests()
    state.setSearch('cliente')
    await state.fetchData({ background: true })
    expect(http.get).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(300)
    await flushRequests()
    expect(http.get).toHaveBeenCalledTimes(2)
    scope.stop()
  })

  it('volta à última página válida e a carrega após excluir o único registro da página', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: { data: [], page: 2, pageSize: 20, total: 10, totalPages: 1 },
      } as any)
      .mockResolvedValueOnce({
        data: { data: [{ id: 1 }], page: 1, pageSize: 20, total: 10, totalPages: 1 },
      } as any)

    window.localStorage.setItem(
      'gestaofacil:datatable:teste-recuperacao',
      JSON.stringify({
        version: 1,
        pageIndex: 1,
        pageSize: 20,
        search: '',
        sorting: [],
        columnVisibility: {},
        filters: {},
      }),
    )

    const scope = effectScope()
    const tableState = scope.run(() => useServerTable('/itens', [], {}, 'teste-recuperacao'))!

    await flushRequests()

    expect(http.get).toHaveBeenNthCalledWith(
      1,
      '/itens',
      expect.objectContaining({
        params: expect.objectContaining({ page: 2, pageSize: 20 }),
      }),
    )
    expect(http.get).toHaveBeenNthCalledWith(
      2,
      '/itens',
      expect.objectContaining({
        params: expect.objectContaining({ page: 1, pageSize: 20 }),
      }),
    )
    expect(tableState.pageIndex.value).toBe(0)
    expect(tableState.data.value).toEqual([{ id: 1 }])

    scope.stop()
  })

  it('aguarda uma pausa na digitação antes de buscar novamente', async () => {
    vi.useFakeTimers()
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: { data: [{ id: 1 }], page: 1, pageSize: 10, total: 1, totalPages: 1 },
      } as any)
      .mockResolvedValueOnce({
        data: { data: [{ id: 2 }], page: 1, pageSize: 10, total: 1, totalPages: 1 },
      } as any)

    const scope = effectScope()
    const tableState = scope.run(() => useServerTable('/itens', [], {}, 'teste-busca'))!
    await flushRequests()

    tableState.setSearch('c')
    tableState.setSearch('cliente')
    vi.advanceTimersByTime(299)
    await nextTick()
    expect(http.get).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(1)
    await flushRequests()

    expect(http.get).toHaveBeenCalledTimes(2)
    expect(http.get).toHaveBeenLastCalledWith(
      '/itens',
      expect.objectContaining({
        params: expect.objectContaining({ search: 'cliente' }),
      }),
    )
    expect(tableState.data.value).toEqual([{ id: 2 }])

    scope.stop()
  })

  it('recarrega uma única vez quando o filtro externo é atualizado', async () => {
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: { data: [{ id: 1 }], page: 1, pageSize: 10, total: 1, totalPages: 1 },
      } as any)
      .mockResolvedValueOnce({
        data: { data: [{ id: 2 }], page: 1, pageSize: 10, total: 1, totalPages: 1 },
      } as any)

    const filters = reactive({ status: 'TODOS', update: false })
    const scope = effectScope()
    const tableState = scope.run(() => useServerTable('/itens', [], filters, 'teste-filtro'))!
    await flushRequests()

    filters.status = 'PAGO'
    filters.update = true
    await flushRequests()

    expect(http.get).toHaveBeenCalledTimes(2)
    expect(http.get).toHaveBeenLastCalledWith(
      '/itens',
      expect.objectContaining({
        params: expect.objectContaining({ status: 'PAGO' }),
      }),
    )
    expect(tableState.data.value).toEqual([{ id: 2 }])

    scope.stop()
  })

  it('não permite que um filtro externo sobrescreva o termo pesquisado', async () => {
    vi.useFakeTimers()
    vi.mocked(http.get)
      .mockResolvedValueOnce({
        data: { data: [{ id: 1 }], page: 1, pageSize: 10, total: 1, totalPages: 1 },
      } as any)
      .mockResolvedValueOnce({
        data: { data: [{ id: 2 }], page: 1, pageSize: 10, total: 1, totalPages: 1 },
      } as any)

    const scope = effectScope()
    const tableState = scope.run(() =>
      useServerTable('/itens', [], { search: 'antigo' }, 'teste-busca-prioritaria'),
    )!
    await flushRequests()

    tableState.setSearch('atual')
    vi.advanceTimersByTime(300)
    await flushRequests()

    expect(http.get).toHaveBeenLastCalledWith(
      '/itens',
      expect.objectContaining({
        params: expect.objectContaining({ search: 'atual' }),
      }),
    )

    scope.stop()
  })
})
