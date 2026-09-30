import type { FiscalDocument } from '@/repositories/notas-fiscais-repository'
import { formatCNPJ, formatCPF } from '@/utils/formatters'
import { statusLabels } from './fiscalPresentation'

export function fiscalNumber(document: FiscalDocument) {
  return document.numero
    ? `${document.numero}/${document.serie ?? '—'}`
    : document.rpsNumero
      ? `RPS ${document.rpsNumero}`
      : 'Ainda não atribuído'
}
export function partyDocument(value?: string | null) {
  const digits = value?.replace(/\D/g, '') || ''
  return digits.length === 14
    ? formatCNPJ(digits)
    : digits.length === 11
      ? formatCPF(digits)
      : value || '—'
}
export function statusSummary(document: FiscalDocument) {
  const descriptions: Record<string, [string, string]> = {
    PENDENTE: [
      'Nota registrada com sucesso',
      'A nota foi criada no sistema e aguarda o início da emissão.',
    ],
    REGISTRADA: [
      'Nota registrada com sucesso',
      'A nota foi criada no sistema e aguarda o início da emissão.',
    ],
    PRONTA_PARA_EMISSAO: [
      'Nota pronta para emissão',
      'Os dados da nota foram preparados para o envio ao emissor.',
    ],
    EMITINDO: [
      'Emissão em andamento',
      'O sistema está enviando a nota ao emissor. Aguarde a confirmação do resultado.',
    ],
    EM_PROCESSAMENTO: [
      'Nota em processamento',
      'O emissor recebeu a solicitação e está processando a nota.',
    ],
    AUTORIZADA: [
      'Nota autorizada',
      'A autorização foi confirmada. Consulte os dados da nota e os arquivos disponíveis.',
    ],
    HOMOLOGADA: [
      'Nota homologada',
      'O processamento em homologação foi concluído. Consulte os arquivos disponíveis.',
    ],
    REJEITADA: [
      'Emissão rejeitada',
      'Confira a ocorrência e corrija os dados antes de preparar outra emissão.',
    ],
    FALHA_REPROCESSAVEL: [
      'O processamento precisa de atenção',
      'Confira a ocorrência. Uma nova tentativa está disponível para esta nota.',
    ],
    RESULTADO_INCERTO: [
      'Resultado ainda não confirmado',
      'Consulte o provedor antes de iniciar outra emissão para evitar duplicidade.',
    ],
    EMISSAO_INCERTA: [
      'Resultado ainda não confirmado',
      'Consulte o provedor antes de iniciar outra emissão para evitar duplicidade.',
    ],
    CANCELADA: [
      'Nota cancelada',
      'O cancelamento foi confirmado. Os dados e os arquivos da nota permanecem disponíveis.',
    ],
  }
  if (
    document.status === 'AUTORIZADA' &&
    document.eventos?.some(
      (event) => event.tipo === 'CANCELAMENTO' && event.status === 'PROCESSANDO',
    )
  )
    return [
      'Cancelamento em processamento',
      'A solicitação foi enviada. A nota permanece autorizada até a confirmação do cancelamento.',
    ]
  return (
    descriptions[document.status] || [
      statusLabels[document.status] || document.status,
      'Acompanhe o resultado do processamento desta nota.',
    ]
  )
}

export function fiscalTimeline(document: FiscalDocument) {
  const entries = [
    {
      id: 'created',
      title: 'Nota criada',
      description: 'Registro criado no sistema.',
      date: document.criadoEm,
      state: 'PENDENTE',
    },
  ]
  if (document.emitidaEm)
    entries.push({
      id: 'authorized',
      title: document.status === 'HOMOLOGADA' ? 'Nota homologada' : 'Nota autorizada',
      description: 'Resultado da emissão confirmado.',
      date: document.emitidaEm,
      state: 'AUTORIZADA',
    })
  if (document.canceladaEm)
    entries.push({
      id: 'cancelled',
      title: 'Nota cancelada',
      description: 'Cancelamento confirmado.',
      date: document.canceladaEm,
      state: 'CANCELADA',
    })
  const eventNames: Record<string, string> = {
    CANCELAMENTO: 'Solicitação de cancelamento',
    EMISSAO: 'Emissão',
    EXCLUSAO: 'Exclusão do registro',
    INUTILIZACAO: 'Inutilização',
  }
  for (const event of document.eventos || [])
    entries.push({
      id: `event-${event.id}`,
      title: eventNames[event.tipo] || event.tipo,
      description: [
        statusLabels[event.status] ||
          ({ CONCLUIDO: 'Concluído', PROCESSANDO: 'Processando' } as Record<string, string>)[
            event.status
          ] ||
          event.status,
        event.motivo,
      ]
        .filter(Boolean)
        .join(' · '),
      date: event.processadoEm || event.createdAt,
      state: event.tipo === 'CANCELAMENTO' ? 'CANCELADA' : event.status,
    })
  if (!document.emitidaEm && !document.canceladaEm)
    entries.push({
      id: 'current',
      title: statusLabels[document.status] || document.status,
      description: document.erroMensagem || statusSummary(document)[1],
      date: document.atualizadaEm || document.criadoEm,
      state: document.status,
    })
  return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}
