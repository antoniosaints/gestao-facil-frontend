import { defineComponent, h } from 'vue'
import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import FiscalDocumentActions from './FiscalDocumentActions.vue'
import FiscalDocumentDetails from './FiscalDocumentDetails.vue'
import FiscalHistoryTable from './FiscalHistoryTable.vue'
import Documentos from './Documentos.vue'
import Nfse from './Nfse.vue'
import VendaNotasFiscais from '../vendas/modais/VendaNotasFiscais.vue'
import { getColumnsVendas } from '../vendas/Home/columnDef'
import type { FiscalDocument } from '@/repositories/notas-fiscais-repository'

enableAutoUnmount(afterEach)

const mocks = vi.hoisted(() => ({
  ui: {
    active: true,
    usuarioLogged: { permissao: 'admin' },
    hasActiveModule: (_code: string): boolean => true,
  },
  getConfig: vi.fn(),
  emitNfse: vi.fn(),
  getDocument: vi.fn(),
  retryDocument: vi.fn(),
  cancelDocument: vi.fn(),
  downloadDocument: vi.fn(),
  openNotaFiscal: vi.fn(),
  openDetalhes: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}))
vi.mock('@/utils/axios', () => ({
  default: { get: vi.fn().mockResolvedValue({ data: { results: [] } }), post: vi.fn() },
}))
vi.mock('@/stores/ui/uiStore', () => ({ useUiStore: () => mocks.ui }))
vi.mock('@/stores/vendas/useVenda', () => ({
  useVendasStore: () => ({
    openNotaFiscal: mocks.openNotaFiscal,
    openDetalhes: mocks.openDetalhes,
  }),
}))
vi.mock('vue-toastification', () => ({ useToast: () => mocks.toast }))
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useRoute: () => ({ path: '/fiscal' }),
}))
vi.mock('@/repositories/notas-fiscais-repository', () => ({
  NotasFiscaisRepository: {
    getConfig: mocks.getConfig,
    emitNfse: mocks.emitNfse,
    getDocument: mocks.getDocument,
    retryDocument: mocks.retryDocument,
    cancelDocument: mocks.cancelDocument,
    downloadDocument: mocks.downloadDocument,
  },
}))

const modal = {
  props: ['open', 'title'],
  template: '<div v-if="open"><h2>{{ title }}</h2><slot /></div>',
}
const stubs = { ModalView: modal }
const document: FiscalDocument = {
  id: 17,
  tipo: 'NFE',
  status: 'PENDENTE',
  valorTotal: 100,
  criadoEm: '2026-09-29T12:00:00Z',
}
const note = { id: 17, tipo: 'NFE' as const, status: 'PENDENTE', numero: null }
const buttonWithText = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper.findAll('button').find((button) => button.text().includes(label))!

beforeEach(() => {
  vi.clearAllMocks()
  mocks.ui.active = true
  mocks.ui.usuarioLogged.permissao = 'admin'
  mocks.ui.hasActiveModule = () => mocks.ui.active
  mocks.getConfig.mockResolvedValue({
    emissaoNfePronta: true,
    emissaoNfcePronta: true,
    emissaoNfsePronta: true,
    modoEmissaoNfse: 'GERANET',
    codigoServicoPadrao: '0101',
    codigoMunicipioPrestador: '',
  })
  mocks.getDocument.mockResolvedValue({ ...document })
  mocks.retryDocument.mockResolvedValue(document)
  mocks.cancelDocument.mockResolvedValue({ status: 'PROCESSANDO' })
})

describe('Ações fiscais', () => {
  it('reenfileira a nota correta e solicita a atualização do acompanhamento', async () => {
    const wrapper = mount(FiscalDocumentActions, { props: { document }, global: { stubs } })
    await buttonWithText(wrapper, 'Tentar novamente').trigger('click')
    await flushPromises()
    expect(mocks.retryDocument).toHaveBeenCalledWith(17)
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })

  it.each(['RESULTADO_INCERTO', 'EMISSAO_INCERTA', 'REJEITADA', 'EMITINDO', 'CANCELADA'])(
    'não oferece reemissão automática para %s',
    (status) => {
      const wrapper = mount(FiscalDocumentActions, {
        props: { document: { ...document, status } },
        global: { stubs },
      })
      expect(wrapper.text()).not.toContain('Tentar novamente')
    },
  )

  it('não oferece reprocessamento para NFS-e', () => {
    const wrapper = mount(FiscalDocumentActions, {
      props: { document: { ...document, tipo: 'NFSE' } },
      global: { stubs },
    })
    expect(wrapper.text()).not.toContain('Tentar novamente')
  })

  it('gerentes podem baixar arquivos disponíveis, sem reemitir nem cancelar', async () => {
    mocks.ui.usuarioLogged.permissao = 'gerente'
    const wrapper = mount(FiscalDocumentActions, {
      props: { document: { ...document, status: 'AUTORIZADA', xmlDisponivel: true } },
      global: { stubs },
    })
    expect(wrapper.text()).not.toContain('Cancelar nota')
    expect(wrapper.text()).not.toContain('DANFE')
    await buttonWithText(wrapper, 'XML').trigger('click')
    await flushPromises()
    expect(mocks.downloadDocument).toHaveBeenCalledWith(17, 'xml', 'NFE-1-17.xml')
  })

  it('valida a justificativa e atualiza o acompanhamento após cancelar', async () => {
    const wrapper = mount(FiscalDocumentActions, {
      props: { document: { ...document, status: 'AUTORIZADA' } },
      global: { stubs },
    })
    await buttonWithText(wrapper, 'Cancelar nota').trigger('click')
    await wrapper.get('textarea').setValue('curta')
    expect(buttonWithText(wrapper, 'Solicitar cancelamento').attributes('disabled')).toBeDefined()
    await wrapper.get('form').trigger('submit')
    expect(mocks.cancelDocument).not.toHaveBeenCalled()
    await wrapper.get('textarea').setValue('Venda emitida por engano')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.cancelDocument).toHaveBeenCalledWith(17, 'Venda emitida por engano')
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })

  it('evita oferecer outro cancelamento enquanto um evento está processando', () => {
    const wrapper = mount(FiscalDocumentActions, {
      props: {
        document: {
          ...document,
          status: 'AUTORIZADA',
          eventos: [
            { id: 1, tipo: 'CANCELAMENTO', status: 'PROCESSANDO', createdAt: document.criadoEm },
          ],
        },
      },
      global: { stubs },
    })
    expect(wrapper.text()).not.toContain('Cancelar nota')
  })

  it('mostra o erro e não notifica sucesso quando a ação falha', async () => {
    mocks.retryDocument.mockRejectedValueOnce({
      response: { data: { error: { message: 'Nota indisponível' } } },
    })
    const wrapper = mount(FiscalDocumentActions, { props: { document }, global: { stubs } })
    await buttonWithText(wrapper, 'Tentar novamente').trigger('click')
    await flushPromises()
    expect(mocks.toast.error).toHaveBeenCalledWith('Nota indisponível')
    expect(wrapper.emitted('changed')).toBeUndefined()
  })
})

describe('Detalhes fiscais', () => {
  it('ignora uma resposta atrasada da nota anterior', async () => {
    let resolveFirst!: (value: FiscalDocument) => void
    mocks.getDocument.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFirst = resolve
        }),
    )
    mocks.getDocument.mockResolvedValueOnce({
      ...document,
      id: 18,
      numero: '200',
      cliente: { id: 2, nome: 'Cliente da segunda nota' },
    })
    const wrapper = mount(FiscalDocumentDetails, {
      props: { open: true, documentId: 17 },
      global: { stubs: { ...stubs, FiscalDocumentActions: true } },
    })
    await wrapper.setProps({ documentId: 18 })
    await flushPromises()
    resolveFirst({ ...document, cliente: { id: 1, nome: 'Cliente da primeira nota' } })
    await flushPromises()
    expect(wrapper.text()).toContain('Cliente da segunda nota')
    expect(wrapper.text()).not.toContain('Cliente da primeira nota')
  })

  it('permite atualizar o status sem fechar o modal', async () => {
    const wrapper = mount(FiscalDocumentDetails, {
      props: { open: true, documentId: 17 },
      global: { stubs: { ...stubs, FiscalDocumentActions: true } },
    })
    await flushPromises()
    mocks.getDocument.mockResolvedValueOnce({ ...document, status: 'AUTORIZADA' })
    await buttonWithText(wrapper, 'Atualizar status').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Autorizada')
    expect(wrapper.emitted('changed')).toHaveLength(1)
  })
})

describe('Telas e vendas', () => {
  it.each(['NFE', 'NFCE', 'NFSE'] as const)(
    'filtra o histórico de %s no servidor com estado separado',
    (tipo) => {
      const wrapper = mount(FiscalHistoryTable, {
        props: { tipo, refreshToken: 0 },
        global: {
          stubs: {
            DataTable: {
              name: 'DataTable',
              props: ['api', 'filters', 'stateKey'],
              template: '<div />',
            },
            FiscalDocumentDetails: true,
          },
        },
      })
      const table = wrapper.findComponent({ name: 'DataTable' })
      expect(table.props('api')).toBe('/v1/notas-fiscais/documentos')
      expect(table.props('filters')).toEqual({ tipo })
      expect(table.props('stateKey')).toBe(`historico-notas-fiscais-${tipo}`)
    },
  )

  it.each(['NFE', 'NFCE'] as const)(
    'remove o card pronto e deixa a tabela de %s fora dos cards',
    async (tipo) => {
      const wrapper = mount(Documentos, {
        props: { tipo, title: tipo, description: '' },
        global: {
          stubs: {
            PendingSalesTable: { template: '<div data-pending />' },
            FiscalHistoryTable: true,
          },
        },
      })
      await flushPromises()
      expect(wrapper.text()).not.toContain('pronta para venda')
      expect(wrapper.find('[data-pending]').exists()).toBe(true)
      expect(wrapper.find('[data-pending]').element.closest('[data-slot="card"]')).toBeNull()
      expect(wrapper.findAll('[role="tab"]').map((tab) => tab.text())).toEqual([
        tipo === 'NFE' ? 'Vendas sem NF-e' : 'Vendas sem NFC-e',
        tipo === 'NFE' ? 'Histórico de NF-e' : 'Histórico de NFC-e',
      ])
      await wrapper.findAll('[role="tab"]')[1].trigger('mousedown', { button: 0, ctrlKey: false })
      await flushPromises()
      expect(wrapper.findComponent({ name: 'FiscalHistoryTable' }).exists()).toBe(true)
    },
  )

  it('exibe NFS-e sem abas e abre a emissão em modal', async () => {
    const wrapper = mount(Nfse, {
      global: { stubs: { ...stubs, Select2Ajax: true, FiscalHistoryTable: true } },
    })
    await flushPromises()
    expect(wrapper.get('h1').text()).toBe('NFS-e')
    expect(wrapper.text()).not.toContain('Emissor configurado')
    expect(wrapper.findAll('[role="tab"]')).toHaveLength(0)
    expect(wrapper.findComponent({ name: 'FiscalHistoryTable' }).props()).toMatchObject({
      tipo: 'NFSE',
      showHeader: false,
    })
    expect(wrapper.find('form').exists()).toBe(false)
    await buttonWithText(wrapper, 'Nova NFS-e').trigger('click')
    expect(wrapper.find('form').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'FiscalHistoryTable' }).exists()).toBe(true)
    await buttonWithText(wrapper, 'Voltar').trigger('click')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('fecha o modal e atualiza a tabela após emitir NFS-e', async () => {
    mocks.emitNfse.mockResolvedValueOnce({ ...document, tipo: 'NFSE', status: 'AUTORIZADA' })
    const wrapper = mount(Nfse, {
      global: { stubs: { ...stubs, Select2Ajax: true, FiscalHistoryTable: true } },
    })
    await flushPromises()
    await buttonWithText(wrapper, 'Nova NFS-e').trigger('click')
    wrapper.findComponent({ name: 'Select2Ajax' }).vm.$emit('update:modelValue', 42)
    await wrapper.get('#nfse-valor').setValue('100')
    await wrapper.get('#nfse-discriminacao').setValue('Serviço de manutenção')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.emitNfse).toHaveBeenCalledWith(
      {
        clienteId: 42,
        valorTotal: 100,
        codigoServico: '0101',
        codigoMunicipioTomador: '',
        discriminacao: 'Serviço de manutenção',
      },
      expect.any(String),
    )
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'FiscalHistoryTable' }).props('refreshToken')).toBe(1)
  })

  it('preserva o formulário no modal quando a emissão falha', async () => {
    mocks.emitNfse.mockRejectedValueOnce({
      response: { data: { error: { message: 'Emissão rejeitada' } } },
    })
    const wrapper = mount(Nfse, {
      global: { stubs: { ...stubs, Select2Ajax: true, FiscalHistoryTable: true } },
    })
    await flushPromises()
    await buttonWithText(wrapper, 'Nova NFS-e').trigger('click')
    wrapper.findComponent({ name: 'Select2Ajax' }).vm.$emit('update:modelValue', 42)
    await wrapper.get('#nfse-valor').setValue('100')
    await wrapper.get('#nfse-discriminacao').setValue('Serviço de manutenção')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(true)
    expect((wrapper.get('#nfse-discriminacao').element as HTMLTextAreaElement).value).toBe(
      'Serviço de manutenção',
    )
    expect(mocks.toast.error).toHaveBeenCalledWith('Emissão rejeitada')
  })

  it('mantém o tipo correto no histórico quando a tela é reutilizada', async () => {
    const wrapper = mount(FiscalHistoryTable, {
      props: { tipo: 'NFE', refreshToken: 0 },
      global: {
        stubs: {
          DataTable: { name: 'DataTable', props: ['filters', 'stateKey'], template: '<div />' },
          FiscalDocumentDetails: true,
        },
      },
    })
    await wrapper.setProps({ tipo: 'NFCE' })
    expect(wrapper.findComponent({ name: 'DataTable' }).props('filters')).toEqual({ tipo: 'NFCE' })
    expect(wrapper.findComponent({ name: 'DataTable' }).props('stateKey')).toBe(
      'historico-notas-fiscais-NFCE',
    )
  })

  it('volta à primeira aba ao navegar de NF-e para NFC-e', async () => {
    const wrapper = mount(Documentos, {
      props: { tipo: 'NFE', title: 'NF-e', description: '' },
      global: { stubs: { PendingSalesTable: true, FiscalHistoryTable: true } },
    })
    await flushPromises()
    await wrapper.findAll('[role="tab"]')[1].trigger('mousedown', { button: 0, ctrlKey: false })
    await wrapper.setProps({ tipo: 'NFCE', title: 'NFC-e' })
    await flushPromises()
    expect(wrapper.findAll('[role="tab"]')[0].attributes('aria-selected')).toBe('true')
    expect(wrapper.findComponent({ name: 'PendingSalesTable' }).props('tipo')).toBe('NFCE')
  })

  it('não exibe nem consulta acompanhamento quando o app está inativo', async () => {
    mocks.ui.active = false
    const wrapper = mount(VendaNotasFiscais, { props: { notes: [note] } })
    await flushPromises()
    expect(wrapper.find('section').exists()).toBe(false)
    expect(mocks.getDocument).not.toHaveBeenCalled()
  })

  it('mostra apenas o status para usuários sem acesso de consulta fiscal', async () => {
    mocks.ui.usuarioLogged.permissao = 'vendedor'
    const wrapper = mount(VendaNotasFiscais, { props: { notes: [note] } })
    await flushPromises()
    expect(wrapper.text()).toContain('Pendente')
    expect(wrapper.findAll('button')).toHaveLength(0)
    expect(mocks.getDocument).not.toHaveBeenCalled()
  })

  it('abre a nota correta e atualiza o status e as ações dentro da venda', async () => {
    const wrapper = mount(VendaNotasFiscais, { props: { notes: [note] }, global: { stubs } })
    await flushPromises()
    await buttonWithText(wrapper, 'Ver detalhes').trigger('click')
    expect(wrapper.emitted('openDetail')?.[0]).toEqual([17])
    expect(wrapper.text()).toContain('Tentar novamente')
    mocks.getDocument.mockResolvedValueOnce({
      ...document,
      status: 'AUTORIZADA',
      pdfDisponivel: true,
    })
    await buttonWithText(wrapper, 'Atualizar status').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Autorizada')
    expect(wrapper.text()).toContain('DANFE')
    expect(wrapper.text()).not.toContain('Tentar novamente')
  })

  it('o clique na coluna fiscal abre o modal da nota na tela de vendas', async () => {
    const column = getColumnsVendas(true).find((column) => column.id === 'notaFiscal')!
    const cell = column.cell as (context: any) => any
    const wrapper = mount(
      defineComponent({
        setup: () => () => h('div', cell({ row: { original: { NotaFiscals: [note] } } })),
      }),
    )
    await wrapper.get('button').trigger('click')
    expect(mocks.openNotaFiscal).toHaveBeenCalledWith(17)
    expect(mocks.openDetalhes).not.toHaveBeenCalled()
    expect(getColumnsVendas(false).some((column) => column.id === 'notaFiscal')).toBe(false)
  })
})
