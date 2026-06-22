import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import FluxoFinanceiroPage from './FluxoFinanceiroPage.vue'

const lancamentoDia = {
  id: 10,
  uid: 'LAN-10',
  parcelaId: 501,
  numero: 2,
  descricao: 'Mensalidade cliente',
  categoria: 'Receitas recorrentes',
  cliente: 'Cliente Alpha',
  conta: 'Conta principal',
  valor: 129.9,
  tipo: 'RECEITA' as const,
  status: 'PENDENTE' as const,
  pago: false,
  vencimento: '2026-06-18T03:00:00.000Z',
  dataPagamento: null,
  formaPagamento: 'PIX',
  cobrancaLink: null,
}

const resumo = {
  saldoInicialPeriodo: 0,
  receitasPrevistas: 129.9,
  despesasPrevistas: 0,
  receitasRealizadas: 0,
  despesasRealizadas: 0,
  pendenteReceber: 129.9,
  pendentePagar: 0,
  saldoAtualDia: 0,
  saldoPossivelDia: 129.9,
  dataReferenciaSaldo: '2026-06-18T03:00:00.000Z',
}

const repositoryMock = vi.hoisted(() => ({
  listarContas: vi.fn(),
  listarCategorias: vi.fn(),
  getLancamentosMensais: vi.fn(),
  estornarParcela: vi.fn(),
}))

vi.mock('@/repositories/lancamento-repository', () => ({
  LancamentosRepository: repositoryMock,
}))

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    error: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  }),
}))

vi.mock('@/hooks/links', () => ({
  goBack: vi.fn(),
  goTo: vi.fn(),
}))

vi.mock('@/composables/useSocketEvent', () => ({
  useSocketEvent: vi.fn(),
}))

const passthrough = { template: '<div><slot /></div>' }
const buttonStub = { template: '<button><slot /></button>' }
const modalViewStub = {
  props: ['open', 'title'],
  template: '<section v-if="open" data-testid="quick-summary"><h2>{{ title }}</h2><slot /></section>',
}

async function mountPage() {
  const wrapper = mount(FluxoFinanceiroPage, {
    props: {
      title: 'Acompanhamento financeiro',
      description: 'Resumo do fluxo',
      mode: 'all',
    },
    global: {
      plugins: [createPinia()],
      stubs: {
        Badge: passthrough,
        Button: buttonStub,
        Card: passthrough,
        CardContent: passthrough,
        CardHeader: passthrough,
        CardTitle: passthrough,
        ClientesModal: true,
        DropdownMenu: passthrough,
        DropdownMenuContent: passthrough,
        DropdownMenuItem: passthrough,
        DropdownMenuTrigger: passthrough,
        FinanceiroCalendario: true,
        FormularioEfertivar: true,
        GerarCobranca: true,
        Input: true,
        LancamentoModal: true,
        ModalParcela: true,
        ModalView: modalViewStub,
        MobileBottomBar: passthrough,
        RouterLink: {
          props: ['to'],
          template: '<a><slot /></a>',
        },
        Select: passthrough,
        SelectContent: passthrough,
        SelectItem: passthrough,
        SelectTrigger: passthrough,
        SelectValue: true,
        Tabs: passthrough,
        TabsContent: passthrough,
        TabsList: passthrough,
        TabsTrigger: passthrough,
      },
    },
  })

  await flushPromises()
  return wrapper
}

describe('FluxoFinanceiroPage', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    repositoryMock.listarContas.mockResolvedValue({ data: [] })
    repositoryMock.listarCategorias.mockResolvedValue({ data: [] })
    repositoryMock.getLancamentosMensais.mockResolvedValue({
      data: {
        dias: [
          {
            dia: '2026-06-18T03:00:00.000Z',
            entradasPrevistas: 129.9,
            saidasPrevistas: 0,
            entradasRealizadas: 0,
            saidasRealizadas: 0,
            saldoRealizado: 0,
            saldoPrevisto: 129.9,
            lancamentos: [lancamentoDia],
          },
        ],
        resumo,
      },
    })
    repositoryMock.estornarParcela.mockResolvedValue({})
  })

  it('opens the quick parcel summary when clicking a launch row', async () => {
    const wrapper = await mountPage()

    await wrapper.get('[data-testid="lancamento-row-501"]').trigger('click')

    expect(wrapper.get('[data-testid="quick-summary"]').text()).toContain('Mensalidade cliente')
    expect(wrapper.get('[data-testid="quick-summary"]').text()).toContain('Conta principal')
  })

  it('does not open the quick summary when clicking a row action', async () => {
    const wrapper = await mountPage()

    await wrapper.get('[data-testid="editar-parcela-501"]').trigger('click')

    expect(wrapper.find('[data-testid="quick-summary"]').exists()).toBe(false)
  })
})
