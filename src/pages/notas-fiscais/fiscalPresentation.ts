import type { FiscalDocument } from '@/repositories/notas-fiscais-repository'

export const typeLabels: Record<string, string> = { NFE: 'NF-e', NFCE: 'NFC-e', NFSE: 'NFS-e' }
export const statuses = [
  ['PENDENTE', 'Registrada'],
  ['PRONTA_PARA_EMISSAO', 'Pronta para emissão'],
  ['EMITINDO', 'Emitindo'],
  ['EM_PROCESSAMENTO', 'Em processamento'],
  ['AUTORIZADA', 'Autorizada'],
  ['HOMOLOGADA', 'Homologada'],
  ['FALHA_REPROCESSAVEL', 'Falha reprocessável'],
  ['REJEITADA', 'Rejeitada'],
  ['RESULTADO_INCERTO', 'Resultado incerto'],
  ['EMISSAO_INCERTA', 'Emissão incerta'],
  ['CANCELADA', 'Cancelada'],
] as const
export const statusLabels = Object.fromEntries(statuses) as Record<string, string>

export function statusClass(status: string) {
  if (['AUTORIZADA', 'HOMOLOGADA'].includes(status))
    return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
  if (['REJEITADA', 'FALHA_REPROCESSAVEL'].includes(status))
    return 'border-destructive/40 bg-destructive/10 text-destructive'
  if (status === 'CANCELADA') return 'border-muted-foreground/40 bg-muted text-muted-foreground'
  if (['RESULTADO_INCERTO', 'EMISSAO_INCERTA'].includes(status))
    return 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
  return 'border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300'
}

export function formatFiscalDate(value?: string | null) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('pt-BR')
}

export function isRetryable(document: Pick<FiscalDocument, 'tipo' | 'status'>) {
  return (
    ['NFE', 'NFCE'].includes(document.tipo) &&
    ['PENDENTE', 'FALHA_REPROCESSAVEL'].includes(document.status)
  )
}

export function hasFiscalDocumentsInProgress(documents: Array<Pick<FiscalDocument, 'status'>>) {
  return documents.some((document) =>
    ['PENDENTE', 'REGISTRADA', 'EMITINDO', 'EM_PROCESSAMENTO'].includes(document.status),
  )
}
