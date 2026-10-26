import { beforeEach, describe, expect, it, vi } from 'vitest'
const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), patch: vi.fn() }))
vi.mock('@/utils/axios', () => ({ default: http }))
import { readCompatible } from '../adapters/compatibleRead'
import { createOperationalSettingsApi } from '../adapters/operationalSettings'
import { errorMessage } from '../application/format'

const path = '/modofacil/configuracoes/operacionais'
const missing = (url: string) => ({
  message: 'Request failed with status code 404',
  response: { status: 404, data: `<html><pre>Cannot GET /api${url}</pre></html>` },
})
beforeEach(() => vi.resetAllMocks())

describe('compatibilidade de consultas em versões anteriores da API', () => {
  it('prefere o contrato dedicado sem consulta adicional', async () => {
    http.get.mockResolvedValue({ data: { data: [{ id: 1 }] } })
    const result = await readCompatible('/modofacil/produtos', { params: { page: 3 } })
    expect(result.response.data.data).toEqual([{ id: 1 }])
    expect(http.get).toHaveBeenCalledExactlyOnceWith('/modofacil/produtos', { params: { page: 3 } })
  })
  it.each([
    ['/modofacil/produtos', '/produtos'],
    ['/modofacil/produtos/11/variantes', '/produtos/11/variantes'],
    ['/modofacil/financeiro/contas', '/lancamentos/contas'],
    ['/modofacil/financeiro/lancamentos', '/lancamentos/getDataTable'],
    ['/modofacil/vendas', '/vendas'],
    ['/modofacil/servicos/ordens', '/servicos/lista/ordens/tabela'],
    ['/modofacil/pessoas', '/clientes/getDataTable'],
  ])('consulta %s por rota equivalente quando o caminho não existe', async (url, legacy) => {
    const config = { params: { page: 3, search: 'Exemplo', _mfRead: 'private-read' } }
    const response = { data: { data: [{ id: 7 }], total: 30, totalPages: 3 } }
    http.get.mockRejectedValueOnce(missing(url)).mockResolvedValueOnce(response)
    const result = await readCompatible(url, config)
    expect(result.response).toBe(response)
    expect(http.get).toHaveBeenNthCalledWith(2, legacy, config)
    expect(http.get).toHaveBeenCalledTimes(2)
  })
  it.each([
    { response: { status: 401 } },
    { response: { status: 403 } },
    { response: { status: 500 } },
    new Error('timeout'),
    { response: { status: 404, data: { message: 'Produto não encontrado.' } } },
    { response: { status: 404, data: { error: { code: 'product_not_found' } } } },
    { response: { status: 404 } },
    missing('/outra-rota'),
  ])('não confunde erro de domínio, acesso ou rede com rota ausente (%j)', async (error) => {
    http.get.mockRejectedValueOnce(error)
    await expect(readCompatible('/modofacil/produtos/11', {})).rejects.toBe(error)
    expect(http.get).toHaveBeenCalledOnce()
  })
  it('não procura alternativa para contratos de edição ou detalhes com escopo próprio', async () => {
    for (const url of [
      '/modofacil/vendas/12/edicao',
      '/modofacil/servicos/ordens/15',
      '/modofacil/pessoas/1/historico',
    ]) {
      http.get.mockRejectedValueOnce(missing(url))
      await expect(readCompatible(url, {})).rejects.toEqual(missing(url))
    }
    expect(http.get).toHaveBeenCalledTimes(3)
  })
  it('propaga falha da rota equivalente sem ciclos ou lista vazia inventada', async () => {
    const failure = { response: { status: 503 } }
    http.get.mockRejectedValueOnce(missing('/modofacil/produtos')).mockRejectedValueOnce(failure)
    await expect(readCompatible('/modofacil/produtos', {})).rejects.toBe(failure)
    expect(http.get).toHaveBeenCalledTimes(2)
  })
  it('aceita código explícito de rota ausente sem memorizar a ausência para a próxima consulta', async () => {
    const url = '/modofacil/produtos'
    http.get
      .mockRejectedValueOnce({
        response: { status: 404, data: { error: { code: 'route_not_found' } } },
      })
      .mockResolvedValueOnce({ data: { data: [] } })
      .mockResolvedValueOnce({ data: { data: [{ id: 1 }] } })
    await readCompatible(url, {})
    await readCompatible(url, {})
    expect(http.get).toHaveBeenNthCalledWith(3, url, {})
  })
})

describe('preferências operacionais compatíveis', () => {
  it('carrega a configuração existente e salva apenas a alteração revisada', async () => {
    const api = createOperationalSettingsApi()
    const legacy = {
      permitirCriacaoCobranca: false,
      contaFinanceiraPadraoId: 2,
      AbacatePayApiKey: 'fictional-secret',
      temaPersonalizado: { fundoDark: '#000' },
    }
    http.get.mockRejectedValueOnce(missing(path)).mockResolvedValueOnce({ data: { data: legacy } })
    const record = await api.get()
    expect(record).toMatchObject({
      permitirCriacaoCobranca: false,
      contaFinanceiraPadraoId: 2,
      modeloPdv: 'BASICO',
    })
    expect(record).not.toHaveProperty('AbacatePayApiKey')
    expect(record).not.toHaveProperty('temaPersonalizado')
    http.post.mockResolvedValueOnce({
      data: { data: { ...legacy, contaFinanceiraPadraoId: null } },
    })
    const saved = await api.save({
      contaFinanceiraPadraoId: null,
      AbacatePayApiKey: 'do-not-send',
      temaPersonalizado: {},
    })
    expect(http.post).toHaveBeenCalledExactlyOnceWith('/contas/parametros', {
      contaFinanceiraPadraoId: null,
    })
    expect(http.patch).not.toHaveBeenCalled()
    expect(saved).not.toHaveProperty('AbacatePayApiKey')
    expect(saved.contaFinanceiraPadraoId).toBeNull()
  })
  it('mantém PATCH dedicado quando disponível e não repete gravação após falha', async () => {
    const api = createOperationalSettingsApi()
    http.get.mockResolvedValueOnce({ data: { data: {} } })
    await api.get()
    const error = missing(path)
    http.patch.mockRejectedValueOnce(error)
    await expect(api.save({ permitirCriacaoCobranca: false })).rejects.toBe(error)
    expect(http.patch).toHaveBeenCalledExactlyOnceWith(path, { permitirCriacaoCobranca: false })
    expect(http.post).not.toHaveBeenCalled()
  })
  it('não compartilha escolha de rota entre instâncias e não salva sem carregar', async () => {
    const first = createOperationalSettingsApi()
    http.get.mockRejectedValueOnce(missing(path)).mockResolvedValueOnce({ data: { data: {} } })
    await first.get()
    const next = createOperationalSettingsApi()
    await expect(next.save({ modeloPdv: 'PRO' })).rejects.toThrow('Carregue')
    expect(http.post).not.toHaveBeenCalled()
  })
  it('invalida a escolha anterior quando uma nova leitura falha', async () => {
    const api = createOperationalSettingsApi()
    http.get.mockRejectedValueOnce(missing(path)).mockResolvedValueOnce({ data: { data: {} } })
    await api.get()
    http.get.mockRejectedValueOnce({ response: { status: 403 } })
    await expect(api.get()).rejects.toMatchObject({ response: { status: 403 } })
    await expect(api.save({ modeloPdv: 'PRO' })).rejects.toThrow('Carregue')
    expect(http.post).not.toHaveBeenCalled()
  })
  it('recusa preferências inválidas e payload vazio sem enviar gravação', async () => {
    const api = createOperationalSettingsApi()
    http.get.mockResolvedValueOnce({ data: { data: {} } })
    await api.get()
    for (const value of [
      { modeloPdv: 'OUTRO' },
      { contaFinanceiraPadraoId: -1 },
      { permitirCriacaoCobranca: 'false' },
      {},
    ])
      await expect(api.save(value)).rejects.toThrow()
    expect(http.patch).not.toHaveBeenCalled()
    expect(http.post).not.toHaveBeenCalled()
  })
  it('traduz erro genérico 404 e preserva a mensagem de registro não encontrado', () => {
    expect(errorMessage(missing(path))).toContain('não foi encontrado na API')
    expect(
      errorMessage({
        response: { status: 404, data: { message: 'Conta financeira não encontrada.' } },
      }),
    ).toBe('Conta financeira não encontrada.')
  })
})
