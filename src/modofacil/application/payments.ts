import { decimal } from './format'
export interface PaymentDraft {
  metodo: string
  valor: string
}
export const paymentMethods = [
  ['PIX', 'Pix já recebido'],
  ['DINHEIRO', 'Dinheiro'],
  ['DEBITO', 'Cartão de débito'],
  ['CREDITO', 'Cartão de crédito'],
  ['TRANSFERENCIA', 'Transferência recebida'],
  ['CREDIARIO', 'A prazo / crediário'],
] as const
export function preparePayments(
  total: number,
  method: string,
  compound: boolean,
  drafts: PaymentDraft[],
  received: string,
) {
  if (!Number.isFinite(total) || total <= 0)
    throw new Error('O total da venda deve ser maior que zero.')
  const payments = compound
    ? drafts.map((p) => ({ metodo: p.metodo, valor: decimal(p.valor) }))
    : [{ metodo: method, valor: Math.round(total * 100) / 100 }]
  if (
    !payments.length ||
    payments.length > 8 ||
    payments.some((p) => p.valor <= 0 || !paymentMethods.some(([m]) => m === p.metodo))
  )
    throw new Error('Informe de uma a oito formas válidas, com valores maiores que zero.')
  if (payments.reduce((sum, p) => sum + Math.round(p.valor * 100), 0) !== Math.round(total * 100))
    throw new Error('A soma das formas de pagamento precisa ser igual ao total da venda.')
  const onlyCash = payments.length === 1 && payments[0]!.metodo === 'DINHEIRO'
  const cash = onlyCash ? decimal(received) : undefined
  if (onlyCash && cash! < total)
    throw new Error('O valor em dinheiro recebido é menor que o total.')
  return {
    pagamento: payments.length === 1 ? payments[0]!.metodo : 'OUTRO',
    pagamentos: compound ? payments : undefined,
    valorRecebido: onlyCash ? cash : total,
    crediario: payments.some((p) => p.metodo === 'CREDIARIO'),
  }
}
