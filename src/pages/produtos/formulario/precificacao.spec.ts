import { describe, expect, it } from 'vitest'
import { calcularPrecificacao } from './precificacao'

describe('calcularPrecificacao', () => {
  it('soma todos os custos e aplica o lucro percentual sobre o custo total', () => {
    expect(
      calcularPrecificacao({
        custoCompra: 100,
        custoProducao: 20,
        custosAdicionais: [10, 20],
        lucroPercentual: 50,
      }),
    ).toEqual({
      custoTotal: 150,
      lucroValor: 75,
      precoVenda: 225,
      margemSobreVenda: 33.33,
    })
  })

  it('arredonda os valores monetarios em duas casas', () => {
    expect(
      calcularPrecificacao({
        custoCompra: 10.01,
        custoProducao: 0,
        custosAdicionais: [],
        lucroPercentual: 33.33,
      }),
    ).toEqual({
      custoTotal: 10.01,
      lucroValor: 3.34,
      precoVenda: 13.35,
      margemSobreVenda: 25.02,
    })
  })

  it('desconsidera entradas negativas ou invalidas', () => {
    expect(
      calcularPrecificacao({
        custoCompra: -10,
        custoProducao: Number.NaN,
        custosAdicionais: [-5],
        lucroPercentual: -20,
      }),
    ).toEqual({
      custoTotal: 0,
      lucroValor: 0,
      precoVenda: 0,
      margemSobreVenda: 0,
    })
  })
})
