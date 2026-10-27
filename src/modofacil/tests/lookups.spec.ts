import { describe, expect, it, vi } from 'vitest'
const api = vi.hoisted(() => ({ read: vi.fn() }))
vi.mock('../adapters/domain', () => ({ api }))
import { useLookupOptions } from '../adapters/lookups'
describe('catálogos paginados', () => {
  it('envia página/busca/ID ao endpoint sem carregar a lista integral e retém os nomes para revisão', async () => {
    api.read.mockResolvedValueOnce({ results: [{ id: 95, label: 'Aluguel' }], hasMore: true })
    const catalog = useLookupOptions('finance-categories', () => ({ excludeId: 3 }))
    const result = await catalog.load({ page: 2, search: 'aluguel' })
    expect(api.read).toHaveBeenCalledWith('/modofacil/financeiro/categorias/opcoes', {
      page: 2,
      search: 'aluguel',
      excludeId: 3,
    })
    expect(result.hasMore).toBe(true)
    api.read.mockResolvedValueOnce({
      results: [{ id: 80, label: 'Categoria selecionada' }],
      hasMore: false,
    })
    await catalog.load({ page: 1, search: '', id: 80 })
    expect(catalog.rows.value).toEqual([
      { id: 95, nome: 'Aluguel' },
      { id: 80, nome: 'Categoria selecionada' },
    ])
  })
  it('propaga falhas para permitir retry e não transforma resposta inválida em lista vazia', async () => {
    const catalog = useLookupOptions('finance-accounts')
    api.read.mockResolvedValueOnce([])
    await expect(catalog.load({ page: 1, search: '' })).rejects.toThrow('Não foi possível carregar')
    api.read.mockRejectedValueOnce(new Error('offline'))
    await expect(catalog.load({ page: 1, search: '' })).rejects.toThrow('offline')
  })
})
