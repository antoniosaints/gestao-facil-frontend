import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NotasFiscaisRepository } from './notas-fiscais-repository'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), delete: vi.fn() }))
vi.mock('@/utils/axios', () => ({ default: http }))
beforeEach(() => {
  vi.clearAllMocks()
  http.get.mockResolvedValue({ data: { data: [] } })
  http.post.mockResolvedValue({ data: { data: {} } })
})
describe('rotas Geranet NFS-e', () => {
  it('exclui pelo identificador fiscal e recebe a venda desvinculada', async () => {
    http.delete.mockResolvedValueOnce({ data: { data: { id: 42, vendaId: 10, excluida: true } } })
    expect(await NotasFiscaisRepository.deleteDocument(42)).toEqual({
      id: 42,
      vendaId: 10,
      excluida: true,
    })
    expect(http.delete).toHaveBeenCalledWith('/v1/notas-fiscais/documentos/42')
  })
  it('emite pela rota Geranet mesmo quando a conta usava o legado', async () => {
    const payload = { clienteId: 1, valorTotal: 100, discriminacao: 'Serviço realizado' }
    await NotasFiscaisRepository.emitNfse(payload, 'chave-unica-de-emissao')
    expect(http.post).toHaveBeenCalledWith('/v1/notas-fiscais/nfs-e/geranet/emitir', payload, {
      headers: { 'Idempotency-Key': 'chave-unica-de-emissao' },
    })
    await NotasFiscaisRepository.emitNfseHomologacao(payload, 'teste-unico-de-emissao')
    expect(http.post).toHaveBeenLastCalledWith(
      '/v1/notas-fiscais/homologacao/nfs-e/geranet/emitir',
      payload,
      { headers: { 'Idempotency-Key': 'teste-unico-de-emissao' } },
    )
  })
  it('consulta cidades/notas por nosso backend e gera PDF da nota identificada', async () => {
    await NotasFiscaisRepository.buscarCidadesGeranet('Araguaína')
    expect(http.get).toHaveBeenCalledWith('/v1/notas-fiscais/nfs-e/cidades', {
      params: { busca: 'Araguaína' },
    })
    await NotasFiscaisRepository.consultarNfse({ ultimoNsu: '10' })
    expect(http.post).toHaveBeenCalledWith('/v1/notas-fiscais/nfs-e/consultar', { ultimoNsu: '10' })
    await NotasFiscaisRepository.gerarPdfNfse(42)
    expect(http.post).toHaveBeenLastCalledWith('/v1/notas-fiscais/documentos/42/gerar-pdf')
  })
})
