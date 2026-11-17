import { h } from 'vue'
import { DOMWrapper, enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DataTable from './DataTable.vue'
import DataTableColumnHeader from './DataTableColumnHeader.vue'
import FiscalStatusBadge from '@/pages/notas-fiscais/FiscalStatusBadge.vue'
import { hasFiscalDocumentsInProgress } from '@/pages/notas-fiscais/fiscalPresentation'
import http from '@/utils/axios'

vi.mock('@/utils/axios', () => ({ default: { get: vi.fn() } }))
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/notas' }) }))
enableAutoUnmount(afterEach)

const response = (status: string) => ({
  data: { data: [{ id: 1, status }], page: 1, pageSize: 10, total: 1, totalPages: 1 },
})
function mountTable() {
  return mount(DataTable, {
    props: {
      api: '/notas',
      columns: [
        {
          accessorKey: 'status',
          cell: ({ row }) => h(FiscalStatusBadge, { status: row.original.status }),
        },
      ],
      autoRefresh: { intervalMs: 5000, when: hasFiscalDocumentsInProgress },
    },
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.mocked(http.get).mockReset()
  localStorage.clear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('Atualização automática da tabela fiscal', () => {
  it('acompanha a emissão sem cobrir os registros e para quando a nota é autorizada', async () => {
    let finish: (value: any) => void = () => {}
    vi.mocked(http.get)
      .mockResolvedValueOnce(response('PENDENTE') as any)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve
          }),
      )
      .mockResolvedValueOnce(response('AUTORIZADA') as any)
    const wrapper = mountTable()
    await flushPromises()
    expect(wrapper.text()).toContain('Registrada')
    await vi.advanceTimersByTimeAsync(5000)
    expect(http.get).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Registrada')
    expect(wrapper.text()).not.toContain('Carregando tabela')

    await vi.advanceTimersByTimeAsync(5000)
    expect(http.get).toHaveBeenCalledTimes(2)
    finish(response('EMITINDO'))
    await flushPromises()
    expect(wrapper.text()).toContain('Emitindo...')
    await vi.advanceTimersByTimeAsync(5000)
    expect(wrapper.text()).toContain('Autorizada')
    await vi.advanceTimersByTimeAsync(15000)
    expect(http.get).toHaveBeenCalledTimes(3)
  })

  it('suspende as consultas com a página oculta e cancela o timer ao sair da tela', async () => {
    vi.mocked(http.get).mockResolvedValue(response('EMITINDO') as any)
    const wrapper = mountTable()
    await flushPromises()
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    await vi.advanceTimersByTimeAsync(5000)
    expect(http.get).toHaveBeenCalledTimes(1)
    visibility.mockReturnValue('visible')
    await vi.advanceTimersByTimeAsync(5000)
    expect(http.get).toHaveBeenCalledTimes(2)
    wrapper.unmount()
    await vi.advanceTimersByTimeAsync(10000)
    expect(http.get).toHaveBeenCalledTimes(2)
  })

  it.each(['EMISSAO_INCERTA', 'REJEITADA', 'CANCELADA', 'PRONTA_PARA_EMISSAO'])(
    'não consulta automaticamente notas com estado %s',
    async (status) => {
      vi.mocked(http.get).mockResolvedValue(response(status) as any)
      mountTable()
      await flushPromises()
      await vi.advanceTimersByTimeAsync(15000)
      expect(http.get).toHaveBeenCalledTimes(1)
    },
  )
})

describe('Busca e recuperação na tabela compartilhada', () => {
  it('distingue busca sem resultado e permite limpar o termo', async () => {
    vi.mocked(http.get).mockResolvedValue({
      data: { data: [], page: 1, pageSize: 10, total: 0, totalPages: 1 },
    })
    const wrapper = mountTable()
    await flushPromises()
    const input = wrapper.get('input[type="search"]')
    expect(input.attributes('aria-label')).toBe('Buscar registros')
    await input.setValue('Inexistente')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(wrapper.text()).toContain('Nenhum resultado para esta busca')
    const clear = wrapper.findAll('button').find((button) => button.text() === 'Limpar busca')!
    await clear.trigger('click')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(wrapper.text()).not.toContain('Nenhum resultado para esta busca')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('não apresenta erro de conexão como ausência de cadastros', async () => {
    vi.mocked(http.get)
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(response('AUTORIZADA') as any)
    const wrapper = mountTable()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Não foi possível carregar')
    expect(wrapper.text()).not.toContain('Nenhum registro encontrado')
    await wrapper.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Autorizada')
  })
})

describe('Ordenação pelo cabeçalho compartilhado', () => {
  beforeEach(() => {
    vi.useRealTimers()
    vi.mocked(http.get).mockResolvedValue({
      data: {
        data: [{ id: 1, nome: 'Ana', valor: 20 }],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      },
    })
  })
  function sortableTable() {
    return mount(DataTable, {
      attachTo: document.body,
      props: {
        api: '/ordenacao',
        columns: [
          {
            accessorKey: 'nome',
            header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Nome' }),
          },
          {
            accessorKey: 'valor',
            header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Valor' }),
          },
          {
            id: 'vencimento',
            header: ({ column }) => h(DataTableColumnHeader, { column, title: 'Vencimento' }),
          },
          { id: 'acoes', header: 'Ações', enableSorting: false },
        ],
      },
    })
  }
  async function choose(wrapper: ReturnType<typeof sortableTable>, title: string, value: string) {
    const trigger = wrapper.get(`button[aria-label^="${title}:"]`)
    await trigger.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    const item =
      document.querySelector(
        `[role="menuitemradio"][data-state][data-reka-collection-item][value="${value}"]`,
      ) ||
      Array.from(document.querySelectorAll('[role="menuitemradio"]')).find((el) =>
        el.textContent?.includes(
          value === 'asc' ? 'Crescente' : value === 'desc' ? 'Decrescente' : 'Remover',
        ),
      )
    expect(item).toBeTruthy()
    await new DOMWrapper(item!).trigger('click')
    await flushPromises()
  }
  it('destaca ASC e DESC com os mesmos registros, marca a opção ativa e permite remover', async () => {
    const wrapper = sortableTable()
    await flushPromises()
    expect(wrapper.get('button[aria-label^="Nome:"]').attributes('data-sort-direction')).toBe(
      'none',
    )
    await choose(wrapper, 'Nome', 'asc')
    const trigger = wrapper.get('button[aria-label^="Nome:"]')
    expect(trigger.classes()).toContain('text-blue-700')
    expect(trigger.attributes('data-sort-direction')).toBe('asc')
    expect(trigger.find('svg.lucide-arrow-up').exists()).toBe(true)
    expect(wrapper.find('th[aria-sort="ascending"]').exists()).toBe(true)
    expect(http.get).toHaveBeenLastCalledWith('/ordenacao', {
      params: expect.objectContaining({ sortBy: 'nome', order: 'asc' }),
    })
    await trigger.trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(
      document.querySelector('[role="menuitemradio"][aria-checked="true"]')?.textContent,
    ).toContain('Crescente')
    const desc = Array.from(document.querySelectorAll('[role="menuitemradio"]')).find((el) =>
      el.textContent?.includes('Decrescente'),
    )!
    await new DOMWrapper(desc).trigger('click')
    await flushPromises()
    expect(trigger.attributes('data-sort-direction')).toBe('desc')
    expect(trigger.find('svg.lucide-arrow-down').exists()).toBe(true)
    expect(wrapper.find('th[aria-sort="descending"]').exists()).toBe(true)
    expect(http.get).toHaveBeenLastCalledWith('/ordenacao', {
      params: expect.objectContaining({ sortBy: 'nome', order: 'desc' }),
    })
    await choose(wrapper, 'Nome', 'none')
    expect(trigger.attributes('data-sort-direction')).toBe('none')
    expect(trigger.classes()).not.toContain('text-blue-700')
    expect(wrapper.find('th[aria-sort]').exists()).toBe(false)
    expect(http.get).toHaveBeenLastCalledWith('/ordenacao', {
      params: expect.objectContaining({ sortBy: 'id', order: 'asc' }),
    })
  })
  it('troca a coluna ativa e restaura a ordenação salva ao reabrir a tabela', async () => {
    const wrapper = sortableTable()
    await flushPromises()
    await choose(wrapper, 'Nome', 'asc')
    await choose(wrapper, 'Valor', 'desc')
    expect(wrapper.get('button[aria-label^="Nome:"]').attributes('data-sort-direction')).toBe(
      'none',
    )
    expect(wrapper.get('button[aria-label^="Valor:"]').attributes('data-sort-direction')).toBe(
      'desc',
    )
    wrapper.unmount()
    const reopened = sortableTable()
    await flushPromises()
    expect(reopened.get('button[aria-label^="Valor:"]').attributes('data-sort-direction')).toBe(
      'desc',
    )
    expect(http.get).toHaveBeenLastCalledWith('/ordenacao', {
      params: expect.objectContaining({ sortBy: 'valor', order: 'desc' }),
    })
    expect(reopened.find('button[aria-label^="Ações:"]').exists()).toBe(false)
  })
  it('mantém a ordenação pela API em colunas relacionais que têm apenas ID', async () => {
    const wrapper = sortableTable()
    await flushPromises()
    await choose(wrapper, 'Vencimento', 'asc')
    expect(wrapper.get('button[aria-label^="Vencimento:"]').attributes('data-sort-direction')).toBe(
      'asc',
    )
    expect(http.get).toHaveBeenLastCalledWith('/ordenacao', {
      params: expect.objectContaining({ sortBy: 'vencimento', order: 'asc' }),
    })
  })
})
