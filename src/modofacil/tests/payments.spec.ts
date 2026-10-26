import { describe, it, expect } from 'vitest'
import { preparePayments } from '../application/payments'
describe('revisão de pagamentos', () => {
  it('concilia centavos do composto sem erro de ponto flutuante', () => {
    expect(
      preparePayments(
        0.3,
        'PIX',
        true,
        [
          { metodo: 'PIX', valor: '0,10' },
          { metodo: 'DEBITO', valor: '0,20' },
        ],
        '',
      ).pagamentos,
    ).toHaveLength(2)
  })
  it('mantém saldo de crediário distinguido de recebimento', () => {
    expect(
      preparePayments(
        100,
        'PIX',
        true,
        [
          { metodo: 'PIX', valor: '40' },
          { metodo: 'CREDIARIO', valor: '60' },
        ],
        '',
      ).crediario,
    ).toBe(true)
  })
  it('não aceita dinheiro recebido menor que a venda', () => {
    expect(() => preparePayments(100, 'DINHEIRO', false, [], '90')).toThrow('menor que o total')
  })
})
