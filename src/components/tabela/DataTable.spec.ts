import { h } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import DataTable from './DataTable.vue'
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
    vi.mocked(http.get).mockResolvedValue({ data: { data: [], page: 1, pageSize: 10, total: 0, totalPages: 1 } })
    const wrapper = mountTable()
    await flushPromises()
    const input = wrapper.get('input[type="search"]')
    expect(input.attributes('aria-label')).toBe('Buscar registros')
    await input.setValue('Inexistente')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(wrapper.text()).toContain('Nenhum resultado para esta busca')
    const clear = wrapper.findAll('button').find(button => button.text() === 'Limpar busca')!
    await clear.trigger('click')
    await vi.advanceTimersByTimeAsync(300)
    await flushPromises()
    expect(wrapper.text()).not.toContain('Nenhum resultado para esta busca')
    expect((input.element as HTMLInputElement).value).toBe('')
  })

  it('não apresenta erro de conexão como ausência de cadastros', async () => {
    vi.mocked(http.get).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(response('AUTORIZADA') as any)
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
