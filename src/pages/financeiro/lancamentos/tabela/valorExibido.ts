import type { ParcelaFinanceiro } from '@/types/schemas'

function getStartOfLocalDay(value: Date | string) {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (match) {
      const [, year, month, day] = match
      return new Date(Number(year), Number(month) - 1, Number(day))
    }
  }

  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

/**
 * Na visão por parcelas, o valor da linha considera as parcelas vencidas e a
 * próxima parcela pendente. Parcelas futuras permanecem fora desse saldo.
 */
export function getValorExibidoLancamento(
  parcelas: Array<ParcelaFinanceiro> | undefined,
  exibirValorParcelasAtuais: boolean,
) {
  const { temParcelasEmAberto, valorPendente, valorTotal } = getResumoValorLancamento(parcelas)

  if (!exibirValorParcelasAtuais) return valorTotal

  return temParcelasEmAberto ? valorPendente : valorTotal
}

export function getResumoValorLancamento(
  parcelas: Array<ParcelaFinanceiro> | undefined,
  referenceDate: Date = new Date(),
) {
  const todasAsParcelas = parcelas ?? []
  const valorTotal = todasAsParcelas.reduce((total, parcela) => total + Number(parcela.valor), 0)
  const inicioDoDia = getStartOfLocalDay(referenceDate)
  const parcelasEmAberto = todasAsParcelas
    .filter((parcela) => !parcela.pago)
    .sort((a, b) => getStartOfLocalDay(a.vencimento).getTime() - getStartOfLocalDay(b.vencimento).getTime())
  const parcelasAtrasadas = parcelasEmAberto.filter((parcela) => {
    return getStartOfLocalDay(parcela.vencimento) < inicioDoDia
  })
  const proximaParcelaPendente = parcelasEmAberto.find((parcela) => {
    return getStartOfLocalDay(parcela.vencimento) >= inicioDoDia
  })
  const parcelasDoCicloAtual = [
    ...parcelasAtrasadas,
    ...(proximaParcelaPendente ? [proximaParcelaPendente] : []),
  ]

  return {
    temParcelasEmAberto: parcelasDoCicloAtual.length > 0,
    valorPendente: parcelasDoCicloAtual.reduce((total, parcela) => total + Number(parcela.valor), 0),
    valorTotal,
  }
}
