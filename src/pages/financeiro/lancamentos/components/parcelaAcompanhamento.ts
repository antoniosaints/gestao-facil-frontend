export type ParcelaAcompanhamento = {
  id: number
  uid: string
  parcelaId: number
  numero: number
  totalParcelas: number
  descricao: string
  categoria: string
  cliente: string | null
  conta: string | null
  contaFinanceiraId: number | null
  valor: number
  tipo: 'RECEITA' | 'DESPESA'
  status: 'PAGO' | 'PENDENTE' | 'ATRASADO'
  pago: boolean
  vencimento: string | Date
  dataPagamento: string | Date | null
  formaPagamento: string | null
  cobrancaLink: string | null
  ignorado: boolean
  contaIgnoradaNosCalculos?: boolean
}
