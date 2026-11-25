import { format } from 'date-fns'
import type { MetodoPagamentoFinanceiro } from '@/types/schemas'
import type {
  EmprestimoSituacao,
  ItemPagamento,
  RegraAntecipacao,
} from '@/repositories/emprestimo-repository'

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const data = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' })
const iso = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Sao_Paulo',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export const moeda = (centavos: number) => brl.format(centavos / 100)
export const dataCurta = (value: string) => data.format(new Date(value))
export const dia = (value = new Date()) => iso.format(value)
export const diaDoCalendario = (value: Date | null) => (value ? format(value, 'yyyy-MM-dd') : '')
export const percentual = (bps: number) =>
  (bps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 }) + '%'

export function descreverAntecipacao(regra: RegraAntecipacao, temJuros: boolean) {
  if (regra.antecipacaoParcelaBps)
    return `${percentual(regra.antecipacaoParcelaBps)} da parcela líquida`
  if (regra.antecipacaoParcelaCentavos)
    return `Até ${moeda(regra.antecipacaoParcelaCentavos)} por parcela`
  return temJuros && regra.descontoJurosBps
    ? `${percentual(regra.descontoJurosBps)} dos juros do contrato`
    : ''
}

export const situacoesEmprestimo = {
  EM_ANDAMENTO: { label: 'Em andamento', color: 'gray' },
  EM_ATRASO: { label: 'Em atraso', color: 'red' },
  QUITADO: { label: 'Quitado', color: 'green' },
  COMPROVANTE_EM_ANALISE: { label: 'Comprovante em análise', color: 'yellow' },
} as const

export function situacaoPorParcelas(
  comprovanteEmAnalise: boolean,
  proximoVencimento: string | null,
): EmprestimoSituacao {
  if (comprovanteEmAnalise) return 'COMPROVANTE_EM_ANALISE'
  if (!proximoVencimento) return 'QUITADO'
  return dia(new Date(proximoVencimento)) < dia() ? 'EM_ATRASO' : 'EM_ANDAMENTO'
}

export function resumoAjustes(itens: ItemPagamento[]) {
  const { fixo, antecipacao, juros, multa } = itens.reduce(
    (soma, item) => ({
      fixo: soma.fixo + (item.descontoFixoCentavos ?? 0),
      antecipacao: soma.antecipacao + (item.descontoAntecipacaoCentavos ?? item.descontoCentavos),
      juros: soma.juros + (item.jurosMoraCentavos ?? 0),
      multa: soma.multa + (item.multaCentavos ?? 0),
    }),
    { fixo: 0, antecipacao: 0, juros: 0, multa: 0 },
  )
  return [
    fixo > 0 && `− ${moeda(fixo)} desconto fixo`,
    antecipacao > 0 && `− ${moeda(antecipacao)} antecipação`,
    juros > 0 && `+ ${moeda(juros)} juros de atraso`,
    multa > 0 && `+ ${moeda(multa)} multa`,
  ]
    .filter(Boolean)
    .join(' · ')
}

export const formas: { value: MetodoPagamentoFinanceiro; label: string }[] = [
  { value: 'PIX', label: 'Pix' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'DEBITO', label: 'Cartão de débito' },
  { value: 'CREDITO', label: 'Cartão de crédito' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OUTRO', label: 'Outro' },
]
