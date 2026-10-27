// In-memory financial records for exercising card filters; never uses a real API.
import { finance, financeSummary } from './previewFixtures'
import { today } from '../application/format'

const date = today() + 'T12:00:00'
export const financeRows = [
  finance,
  {
    ...finance,
    id: 6,
    Uid: 'FIN_QA_006',
    descricao: 'Venda antiga recebida neste período',
    status: 'PAGO',
    valorTotal: 100,
    dataLancamento: '2020-01-01T12:00:00',
    parcelas: [
      {
        id: 60,
        numero: 1,
        valor: 100,
        pago: true,
        vencimento: '2020-01-01T12:00:00',
        dataPagamento: date,
      },
    ],
  },
  {
    ...finance,
    id: 7,
    Uid: 'FIN_QA_007',
    descricao: 'Despesa de consumo',
    tipo: 'DESPESA',
    status: 'PENDENTE',
    valorTotal: 80,
    parcelas: [{ id: 70, numero: 1, valor: 80, pago: false, vencimento: date }],
  },
  {
    ...finance,
    id: 8,
    Uid: 'FIN_QA_008',
    descricao: 'Compra com pagamento parcial',
    tipo: 'DESPESA',
    status: 'PARCIAL',
    valorTotal: 200,
    parcelas: [
      { id: 80, numero: 1, valor: 50, pago: true, vencimento: date, dataPagamento: date },
      { id: 81, numero: 2, valor: 150, pago: false, vencimento: date },
    ],
  },
]
const cards: Record<string, { tipo: string; pago: boolean }> = {
  RECEBIDO: { tipo: 'RECEITA', pago: true },
  PAGO: { tipo: 'DESPESA', pago: true },
  A_RECEBER: { tipo: 'RECEITA', pago: false },
  A_PAGAR: { tipo: 'DESPESA', pago: false },
}
function range(params: any = {}) {
  const now = new Date()
  const parse = (value: string) =>
    new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  const inicio = params.inicio
    ? parse(params.inicio)
    : new Date(now.getFullYear(), now.getMonth(), 1)
  const fim = params.fim
    ? parse(params.fim)
    : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  if (params.fim && /^\d{4}-\d{2}-\d{2}$/.test(params.fim)) fim.setHours(23, 59, 59, 999)
  return { inicio, fim }
}
function matching(row: any, key: string, params: any) {
  const card = cards[key],
    period = range(params)
  return row.ignorado || row.tipo !== card.tipo
    ? []
    : row.parcelas.filter((part: any) => {
        const value = part[card.pago ? 'dataPagamento' : 'vencimento']
        return (
          !part.ignorado &&
          part.pago === card.pago &&
          value &&
          new Date(value) >= period.inicio &&
          new Date(value) <= period.fim
        )
      })
}
export function financePreviewSummary(params: any) {
  const totals = Object.fromEntries(
    Object.keys(cards).map((key) => [
      key,
      financeRows.reduce(
        (sum, row) =>
          sum +
          matching(row, key, params).reduce(
            (value: number, part: any) => value + Number(part.valor),
            0,
          ),
        0,
      ),
    ]),
  )
  const period = range(params)
  return {
    ...financeSummary,
    periodo: { inicio: period.inicio.toISOString(), fim: period.fim.toISOString() },
    cards: {
      ...financeSummary.cards,
      receitasRealizadas: totals.RECEBIDO,
      despesasRealizadas: totals.PAGO,
      aReceberPendente: totals.A_RECEBER,
      aPagarPendente: totals.A_PAGAR,
    },
  }
}
export function financePreviewPage(params: any = {}, scenario: string | null) {
  const card = Object.prototype.hasOwnProperty.call(cards, params.resumo) ? params.resumo : ''
  const period = range(params)
  const rows = financeRows.flatMap((row) => {
    if (
      params.search &&
      !`${row.descricao} ${row.Uid}`.toLowerCase().includes(String(params.search).toLowerCase())
    )
      return []
    if (card) {
      const parts = matching(row, card, params)
      return parts.length
        ? [
            {
              ...row,
              valorResumo: parts.reduce((sum: number, part: any) => sum + Number(part.valor), 0),
              parcelasResumo: parts.length,
            },
          ]
        : []
    }
    if (
      (params.tipo && row.tipo !== params.tipo) ||
      (params.status && row.status !== params.status)
    )
      return []
    if (
      (params.inicio && new Date(row.dataLancamento) < period.inicio) ||
      (params.fim && new Date(row.dataLancamento) > period.fim)
    )
      return []
    return [row]
  })
  return {
    data: scenario === 'empty' ? [] : rows,
    total: scenario === 'empty' ? 0 : rows.length,
    totalPages: scenario === 'pagination' ? 12 : 1,
  }
}
