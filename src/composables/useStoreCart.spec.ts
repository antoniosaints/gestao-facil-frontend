import { describe, expect, it } from 'vitest'
import { normalizeCartQuantity } from './useStoreCart'

const product = { id: 1, controlsStock: true, available: 2 } as any
describe('carrinho da loja', () => {
  it('limita a quantidade ao estoque disponível e nunca aceita negativos', () => {
    expect(normalizeCartQuantity(product, 5)).toBe(2)
    expect(normalizeCartQuantity(product, -3)).toBe(0)
  })
  it('não limita produtos sem controle de estoque', () => {
    expect(normalizeCartQuantity({ ...product, controlsStock: false }, 5)).toBe(5)
  })
})
