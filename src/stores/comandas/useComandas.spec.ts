import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useComandasStore } from './useComandas'

const repositoryMock = vi.hoisted(() => ({
  get: vi.fn(),
  getConfiguracao: vi.fn(),
  create: vi.fn(),
  faturar: vi.fn(),
  removeItem: vi.fn(),
}))

const toastMock = vi.hoisted(() => ({
  error: vi.fn(),
  success: vi.fn(),
}))

vi.mock('@/repositories/comanda-operacao-repository', () => ({
  ComandaOperacaoRepository: repositoryMock,
}))

vi.mock('vue-toastification', () => ({
  useToast: () => toastMock,
}))

const comandaPendente = {
  id: 10,
  Uid: 'AB12CD',
  contaId: 1,
  status: 'PENDENTE' as const,
  total: '120.50',
  abertura: '2026-06-27T10:00:00.000Z',
  itens: [
    {
      id: 101,
      comandaId: 10,
      origemTipo: 'PRODUTO' as const,
      origemId: '7',
      nomeSnapshot: 'Produto aberto',
      valorUnitarioSnapshot: '20',
      quantidade: '1',
      subtotal: '20',
      estoqueDebitado: true,
      estoqueDevolvido: false,
      quantidadeDebitada: '1',
      quantidadeDevolvida: '0',
      pagamentoId: null,
    },
    {
      id: 102,
      comandaId: 10,
      origemTipo: 'SERVICO' as const,
      origemId: '3',
      nomeSnapshot: 'Servico aberto',
      valorUnitarioSnapshot: '50',
      quantidade: '1',
      subtotal: '50',
      estoqueDebitado: false,
      estoqueDevolvido: false,
      quantidadeDebitada: '0',
      quantidadeDevolvida: '0',
      pagamentoId: null,
    },
    {
      id: 103,
      comandaId: 10,
      origemTipo: 'AVULSO' as const,
      origemId: null,
      nomeSnapshot: 'Item pago',
      valorUnitarioSnapshot: '50.50',
      quantidade: '1',
      subtotal: '50.50',
      estoqueDebitado: false,
      estoqueDevolvido: false,
      quantidadeDebitada: '0',
      quantidadeDevolvida: '0',
      pagamentoId: 9,
    },
  ],
  pagamentos: [],
}

describe('useComandasStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    repositoryMock.get.mockResolvedValue({ data: comandaPendente })
    repositoryMock.getConfiguracao.mockResolvedValue({
      data: {
        id: 1,
        contaId: 1,
        contaFinanceiraIdPadrao: 22,
        categoriaFinanceiraIdPadrao: 33,
      },
    })
    repositoryMock.create.mockResolvedValue({ message: 'ok', data: comandaPendente })
    repositoryMock.faturar.mockResolvedValue({ message: 'ok', data: comandaPendente })
    repositoryMock.removeItem.mockResolvedValue({ message: 'ok', data: { total: 0 } })
  })

  it('prefills faturamento with default finance account and category', async () => {
    const store = useComandasStore()

    await store.openFaturar(10)

    expect(repositoryMock.get).toHaveBeenCalledWith(10)
    expect(repositoryMock.getConfiguracao).toHaveBeenCalled()
    expect(store.faturarForm.contaFinanceiraId).toBe(22)
    expect(store.faturarForm.categoriaFinanceiraId).toBe(33)
    expect(store.faturarForm.itemIds).toEqual([101, 102])
    expect(store.faturarForm.lancarFinanceiro).toBe(true)
    expect(store.openFaturarModal).toBe(true)
  })

  it('sends only selected items when billing a comanda partially', async () => {
    const store = useComandasStore()
    store.selectedComanda = comandaPendente
    store.faturarForm.itemIds = [102]

    await store.faturar()

    expect(repositoryMock.faturar).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        itemIds: [102],
      }),
    )
  })

  it('sends the stock return decision when removing a product item', async () => {
    const store = useComandasStore()
    store.selectedComanda = comandaPendente

    await store.removeItem(10, 99, true)

    expect(repositoryMock.removeItem).toHaveBeenCalledWith(10, 99, { devolverEstoque: true })
    expect(repositoryMock.get).toHaveBeenCalledWith(10)
  })

  it('normalizes create payload with public item origin fields', async () => {
    const store = useComandasStore()
    store.comandaForm.clienteId = 44
    store.comandaForm.observacao = 'Mesa 4'
    store.comandaForm.itens = [
      {
        origemTipo: 'PRODUTO',
        origemId: 7,
        nome: '',
        valorUnitario: 15.5,
        quantidade: 2,
      },
    ]

    await store.createComanda()

    expect(repositoryMock.create).toHaveBeenCalledWith({
      clienteId: 44,
      observacao: 'Mesa 4',
      itens: [
        {
          origemTipo: 'PRODUTO',
          origemId: 7,
          nome: null,
          valorUnitario: 15.5,
          quantidade: 2,
        },
      ],
    })
    expect(store.selectedComanda?.Uid).toBe('AB12CD')
  })
})
