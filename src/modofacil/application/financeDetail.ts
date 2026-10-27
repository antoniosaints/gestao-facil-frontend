import type { Row } from '../adapters/domain'
import { financialPaymentOptions } from './payments'

const cents = (value: unknown) => Math.round(Number(value ?? 0) * 100)
const localDay = (value: string | Date) => {
  const date =
    value instanceof Date
      ? value
      : new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}
export const paymentLabel = (method: string | null | undefined) =>
  financialPaymentOptions.find((option) => option.value === method)?.label ||
  method ||
  'Não informado'
export function parcelStatus(part: Partial<Row>, now: Date = new Date()) {
  if (part.pago) return 'PAGO'
  return part.vencimento && localDay(part.vencimento) < localDay(now) ? 'ATRASADO' : 'PENDENTE'
}
export function financeSummary(record: Partial<Row>, now: Date = new Date()) {
  const parcels: Row[] = record.parcelas || []
  const considered = parcels.filter((part) => !record.ignorado && !part.ignorado)
  const paid = considered.filter((part) => part.pago)
  const pending = considered.filter((part) => !part.pago)
  const overdue = pending.filter((part) => parcelStatus(part, now) === 'ATRASADO')
  const total = considered.reduce((sum, part) => sum + cents(part.valor), 0)
  const paidCents = paid.reduce((sum, part) => sum + cents(part.valorPago ?? part.valor), 0)
  const pendingCents = pending.reduce((sum, part) => sum + cents(part.valor), 0)
  return {
    paid: paidCents / 100,
    pending: pendingCents / 100,
    overdue: overdue.reduce((sum, part) => sum + cents(part.valor), 0) / 100,
    paidCount: paid.length,
    pendingCount: pending.length,
    overdueCount: overdue.length,
    ignoredCount: parcels.length - considered.length,
    progress: total > 0 ? Math.min(100, Math.max(0, Math.round((paidCents / total) * 100))) : 0,
    next: [...pending]
      .filter((part) => part.vencimento)
      .sort((a, b) => localDay(a.vencimento) - localDay(b.vencimento))[0],
  }
}
