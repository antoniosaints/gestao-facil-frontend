import { describe, it, expect, vi, beforeEach } from 'vitest'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn() }))
vi.mock('@/utils/axios', () => ({ default: http }))
vi.mock('@/repositories/venda-repository', () => ({ VendaRepository: { getCupomPDF: vi.fn() } }))
vi.mock('@/repositories/caixa-repository', () => ({ CaixaRepository: {} }))
vi.mock('@/repositories/lancamento-repository', () => ({ LancamentosRepository: {} }))
vi.mock('@/repositories/os-repository', () => ({ OrdensServicoRepository: {} }))
vi.mock('@/repositories/cliente-repository', () => ({ ClienteRepository: {} }))
import { api, products, VendaRepository, OrdensServicoRepository } from '../adapters/domain'
import { configurationApi } from '../adapters/configuration'
beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockResolvedValue({ data: { data: [], total: 0, totalPages: 0 } })
  http.post.mockResolvedValue({ data: { data: { id: 1 } } })
  http.patch.mockResolvedValue({ data: { data: { produtoBaseId: 5, varianteId: 9 } } })
})
describe('fronteira HTTP', () => {
  it('usa PATCH restrito com ambos os IDs', async () => {
    await products.update(5, 9, { preco: 10 })
    expect(http.patch).toHaveBeenCalledWith('/modofacil/produtos/5/variantes/9/basico', {
      preco: 10,
    })
    expect(http.post).not.toHaveBeenCalled()
  })
  it('preferência e leituras não reutilizam cache PWA de outra sessão', async () => {
    http.get.mockResolvedValueOnce({ data: { modo: 'NORMAL', versao: 0, podeAlterar: false } })
    await configurationApi.get()
    await api.page('/modofacil/produtos')
    expect(http.get.mock.calls[0]![1].params._mfRead).toEqual(expect.any(String))
    expect(http.get.mock.calls[1]![1].params._mfRead).toEqual(expect.any(String))
    expect(http.get.mock.calls[0]![1].params._mfRead).not.toBe(
      http.get.mock.calls[1]![1].params._mfRead,
    )
  })
  it('conclusão de venda tem uma única operação sem receita ou estoque extras', async () => {
    const body = {
      caixaId: 4,
      data: '2026-10-26',
      desconto: 0,
      pagamento: 'PIX',
      itens: [{ id: 9, tipo: 'PRODUTO' as const, quantidade: 0.25, preco: 35 }],
    }
    await VendaRepository.finalizarVendaPdv(body)
    expect(http.post).toHaveBeenCalledExactlyOnceWith(
      '/modofacil/vendas/caixa/finalizar-venda',
      body,
    )
  })
  it('abertura de OS não chama faturamento nem financeiro', async () => {
    const body = {
      clienteId: 2,
      vendedorId: 1,
      data: '2026-10-26',
      status: 'ABERTA' as const,
      itens: [{ id: 9, tipo: 'SERVICO' as const, nome: 'Reparo', valor: 50, quantidade: 1 }],
    }
    await OrdensServicoRepository.save(body)
    expect(http.post).toHaveBeenCalledExactlyOnceWith('/modofacil/servicos/ordens', body)
  })
})
