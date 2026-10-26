import { decimal, today } from './format'
export const frequencies = [
  'DIARIO',
  'SEMANAL',
  'QUINZENAL',
  'MENSAL',
  'TRIMESTRAL',
  'SEMESTRAL',
  'ANUAL',
  'PERSONALIZADO',
]
export function recurrenceDraft(record: any = {}) {
  return {
    frequencia: record.frequencia || 'MENSAL',
    intervaloDias: record.intervaloDias || 30,
    dataInicio: (record.dataInicio || today()).slice(0, 10),
    dataFim: (record.dataFim || '').slice(0, 10),
    minimoGerado: record.minimoGerado || 1,
    maximoEmAberto: record.maximoEmAberto || 3,
    geracaoAutomatica: record.geracaoAutomatica ?? false,
    diasAntecedencia: record.diasAntecedencia ?? 0,
    valorParcela: String(record.valorParcela ?? ''),
  }
}
export function recurrencePayload(d: ReturnType<typeof recurrenceDraft>) {
  if (d.dataFim && d.dataFim < d.dataInicio)
    throw new Error('A data final deve ser igual ou posterior ao início.')
  const amount = decimal(d.valorParcela)
  if (amount <= 0) throw new Error('Informe um valor de parcela positivo.')
  return {
    ...d,
    intervaloDias: d.frequencia === 'PERSONALIZADO' ? Number(d.intervaloDias) : null,
    dataInicio: new Date(d.dataInicio + 'T12:00:00').toISOString(),
    dataFim: d.dataFim ? new Date(d.dataFim + 'T12:00:00').toISOString() : null,
    minimoGerado: Number(d.minimoGerado),
    maximoEmAberto: Number(d.maximoEmAberto),
    diasAntecedencia: Number(d.diasAntecedencia),
    valorParcela: amount,
  }
}
