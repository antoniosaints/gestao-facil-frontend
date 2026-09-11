import { describe, expect, it } from 'vitest'
import { getResumoValorLancamento, getValorExibidoLancamento } from './valorExibido'

describe('getValorExibidoLancamento', () => {
  it('mantém o valor total como padrão', () => {
    expect(
      getValorExibidoLancamento(
        [
          { valor: 100, pago: true },
          { valor: 120, pago: false },
        ] as any,
        false,
      ),
    ).toBe(220)
  })

  it('soma as parcelas em aberto quando a visão por parcelas está ativa', () => {
    expect(
      getValorExibidoLancamento(
        [
          { valor: 100, pago: true, vencimento: '2026-07-10' },
          { valor: 120, pago: false, vencimento: '2026-08-10' },
          { valor: 80, pago: false, vencimento: '2026-09-11' },
        ] as any,
        true,
      ),
    ).toBe(200)
  })

  it('inclui atrasadas e a próxima pendente, sem antecipar parcelas futuras', () => {
    expect(
      getResumoValorLancamento(
        [
          { valor: 200, pago: false, vencimento: '2026-08-10' },
          { valor: 200, pago: false, vencimento: '2026-09-01' },
          { valor: 200, pago: false, vencimento: '2026-09-15' },
          { valor: 200, pago: false, vencimento: '2026-10-15' },
          { valor: 200, pago: false, vencimento: '2026-11-15' },
        ] as any,
        new Date(2026, 8, 11),
      ),
    ).toMatchObject({ temParcelasEmAberto: true, valorPendente: 600, valorTotal: 1000 })
  })

  it('volta ao total quando todas as parcelas foram efetivadas', () => {
    expect(
      getValorExibidoLancamento(
        [
          { valor: 100, pago: true, vencimento: '2026-08-10' },
          { valor: 120, pago: true, vencimento: '2026-09-10' },
        ] as any,
        true,
      ),
    ).toBe(220)
  })
})
