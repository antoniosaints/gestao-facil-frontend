export type PrecificacaoInput = {
  custoCompra: number
  custoProducao: number
  custosAdicionais: number[]
  lucroPercentual: number
}

export type PrecificacaoResultado = {
  custoTotal: number
  lucroValor: number
  precoVenda: number
  margemSobreVenda: number
}

function normalizarValor(value: number) {
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

function arredondar(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

/**
 * Calcula o preço aplicando o lucro desejado sobre o custo total. A margem
 * sobre a venda é retornada separadamente para deixar a diferença explícita.
 */
export function calcularPrecificacao(input: PrecificacaoInput): PrecificacaoResultado {
  const custoTotal = arredondar(
    normalizarValor(input.custoCompra) +
      normalizarValor(input.custoProducao) +
      input.custosAdicionais.reduce((total, custo) => total + normalizarValor(custo), 0),
  )
  const lucroPercentual = normalizarValor(input.lucroPercentual)
  const lucroValor = arredondar(custoTotal * (lucroPercentual / 100))
  const precoVenda = arredondar(custoTotal + lucroValor)
  const margemSobreVenda = precoVenda > 0 ? arredondar((lucroValor / precoVenda) * 100) : 0

  return {
    custoTotal,
    lucroValor,
    precoVenda,
    margemSobreVenda,
  }
}
