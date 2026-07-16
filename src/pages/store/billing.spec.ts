import { describe, expect, it } from 'vitest'
import { isStoreModuleFree, shouldShowImmediateBillingOptions } from './billing'

describe('cobrança da App Store', () => {
  it('trata app com valor mensal zerado como gratuito', () => {
    expect(isStoreModuleFree({ preco: 0 })).toBe(true)
    expect(isStoreModuleFree({ preco: -1 })).toBe(true)
    expect(isStoreModuleFree({ preco: 29.9 })).toBe(false)
  })

  it('não mostra opções de cobrança imediata para app gratuito', () => {
    expect(
      shouldShowImmediateBillingOptions({
        preco: 0,
        ativo: false,
        pendenteAtivacao: false,
        ativacaoImediataDisponivel: true,
      }),
    ).toBe(false)
  })

  it('mantém opções de cobrança imediata para app pago elegível', () => {
    expect(
      shouldShowImmediateBillingOptions({
        preco: 49.9,
        ativo: false,
        pendenteAtivacao: false,
        ativacaoImediataDisponivel: true,
      }),
    ).toBe(true)
  })
})
