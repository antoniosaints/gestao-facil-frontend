import { describe, expect, it } from 'vitest'
import type { ParcelaFinanceiro } from '@/types/schemas'
import { getDatasTabelaLancamento } from './dateColumns'

function parcela(overrides: Partial<ParcelaFinanceiro>): ParcelaFinanceiro {
  return {
    id: 1,
    numero: 1,
    valor: 100,
    vencimento: new Date('2026-04-10T03:00:00.000Z'),
    pago: false,
    lancamentoId: 1,
    ...overrides,
  }
}

describe('getDatasTabelaLancamento', () => {
  it('mostra o vencimento mais próximo entre as parcelas em aberto', () => {
    const result = getDatasTabelaLancamento([
      parcela({ numero: 1, pago: true, vencimento: new Date('2026-04-10T03:00:00.000Z') }),
      parcela({ numero: 3, vencimento: new Date('2026-06-10T03:00:00.000Z') }),
      parcela({ numero: 2, vencimento: new Date('2026-05-10T03:00:00.000Z') }),
    ])

    expect(result.vencimento).toEqual(new Date('2026-05-10T03:00:00.000Z'))
    expect(result.quitacao).toBeNull()
  })

  it('quando quitado, mostra a última parcela e o seu pagamento', () => {
    const result = getDatasTabelaLancamento([
      parcela({
        numero: 1,
        pago: true,
        vencimento: new Date('2026-04-10T03:00:00.000Z'),
        dataPagamento: new Date('2026-04-12T03:00:00.000Z'),
      }),
      parcela({
        numero: 2,
        pago: true,
        vencimento: new Date('2026-05-10T03:00:00.000Z'),
        dataPagamento: new Date('2026-05-15T03:00:00.000Z'),
      }),
    ])

    expect(result.vencimento).toEqual(new Date('2026-05-10T03:00:00.000Z'))
    expect(result.quitacao).toEqual(new Date('2026-05-15T03:00:00.000Z'))
  })

  it('ignora a parcela de entrada ao definir as datas principais', () => {
    const result = getDatasTabelaLancamento([
      parcela({
        numero: 0,
        pago: true,
        vencimento: new Date('2026-04-01T03:00:00.000Z'),
        dataPagamento: new Date('2026-04-01T03:00:00.000Z'),
      }),
      parcela({ numero: 1, vencimento: new Date('2026-05-10T03:00:00.000Z') }),
    ])

    expect(result.vencimento).toEqual(new Date('2026-05-10T03:00:00.000Z'))
    expect(result.quitacao).toBeNull()
  })
})
