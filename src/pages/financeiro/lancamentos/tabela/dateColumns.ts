import type { ParcelaFinanceiro } from '@/types/schemas'

export type DatasTabelaLancamento = {
  vencimento: Date | string | null
  quitacao: Date | string | null
}

/**
 * Datas exibidas na listagem vêm das parcelas, nunca da data fixa do cabeçalho
 * do lançamento. A entrada (parcela 0) não faz parte do cronograma principal.
 */
export function getDatasTabelaLancamento(
  parcelas: Array<ParcelaFinanceiro> | undefined,
): DatasTabelaLancamento {
  const parcelasDoCronograma = (parcelas ?? []).filter((parcela) => parcela.numero !== 0)

  if (!parcelasDoCronograma.length) {
    return { vencimento: null, quitacao: null }
  }

  const porVencimento = [...parcelasDoCronograma].sort((a, b) => {
    const diferenca = new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime()
    return diferenca || a.numero - b.numero
  })
  const primeiraEmAberto = porVencimento.find((parcela) => !parcela.pago)

  if (primeiraEmAberto) {
    return { vencimento: primeiraEmAberto.vencimento, quitacao: null }
  }

  const ultimaParcela = porVencimento.at(-1)!
  return {
    vencimento: ultimaParcela.vencimento,
    quitacao: ultimaParcela.dataPagamento ?? null,
  }
}
