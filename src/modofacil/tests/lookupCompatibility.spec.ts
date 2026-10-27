import { beforeEach, describe, expect, it, vi } from 'vitest'

const http = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/utils/axios', () => ({ default: http }))
import { useLookupOptions } from '../adapters/lookups'

const missing = (path: string) => ({
  response: { status: 404, data: `<pre>Cannot GET /api${path}</pre>` },
})
beforeEach(() => vi.resetAllMocks())

describe('SelectAjax com versões anteriores da API', () => {
  it.each([
    [
      'finance-categories',
      '/modofacil/financeiro/categorias/opcoes',
      '/lancamentos/categorias/select2',
    ],
    ['finance-accounts', '/modofacil/financeiro/contas/opcoes', '/lancamentos/contas/select2'],
    ['product-categories', '/modofacil/produtos/categorias/opcoes', '/produtos/categorias/select2'],
  ] as const)(
    'carrega %s por busca e recupera uma seleção fora da primeira página',
    async (kind, path, legacy) => {
      const catalog = useLookupOptions(kind)
      http.get.mockRejectedValueOnce(missing(path)).mockResolvedValueOnce({
        data: { results: [{ id: 95, label: 'Aluguel', caminho: 'Despesas › Aluguel' }] },
      })
      expect(await catalog.load({ search: 'Aluguel', page: 1 })).toEqual({
        results: [{ id: 95, label: 'Aluguel', caminho: 'Despesas › Aluguel' }],
      })
      expect(http.get).toHaveBeenNthCalledWith(2, legacy, {
        params: expect.objectContaining({ search: 'Aluguel', page: 1 }),
      })
      http.get.mockRejectedValueOnce(missing(path)).mockResolvedValueOnce({
        data: { results: [{ id: 120, label: 'Seleção anterior' }] },
      })
      await catalog.load({ search: '', page: 1, id: 120 })
      expect(http.get).toHaveBeenNthCalledWith(4, legacy, {
        params: expect.objectContaining({ id: 120 }),
      })
      expect(catalog.rows.value).toEqual([
        { id: 95, nome: 'Aluguel' },
        { id: 120, nome: 'Seleção anterior' },
      ])
    },
  )

  it('mantém paginação do contrato novo e exclui a própria categoria também no contrato antigo', async () => {
    const catalog = useLookupOptions('finance-categories', () => ({ excludeId: 3 }))
    http.get.mockResolvedValueOnce({
      data: { results: [{ id: 95, label: 'Página 2' }], hasMore: true },
    })
    expect(await catalog.load({ search: '', page: 2 })).toEqual({
      results: [{ id: 95, label: 'Página 2' }],
      hasMore: true,
    })
    expect(http.get).toHaveBeenCalledOnce()
    http.get
      .mockRejectedValueOnce(missing('/modofacil/financeiro/categorias/opcoes'))
      .mockResolvedValueOnce({
        data: {
          results: [
            { id: 3, label: 'Categoria em edição' },
            { id: 8, label: 'Outra categoria' },
          ],
        },
      })
    expect((await catalog.load({ search: '', page: 1 })).results).toEqual([
      { id: 8, label: 'Outra categoria' },
    ])
  })

  it.each([401, 403, 500])('preserva falhas HTTP %s sem tentar outra rota', async (status) => {
    const error = { response: { status } }
    http.get.mockRejectedValueOnce(error)
    await expect(useLookupOptions('finance-categories').load({ search: '', page: 1 })).rejects.toBe(
      error,
    )
    expect(http.get).toHaveBeenCalledOnce()
  })
})
