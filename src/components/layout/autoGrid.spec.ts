// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import AutoGrid from './AutoGrid.vue'
import { melhorColunas } from './autoGrid'

// Quantos itens sobram sozinhos na última linha.
const sobra = (total: number, colunas: number) => (colunas - (total % colunas)) % colunas

describe('melhorColunas', () => {
  // Os dois casos que aparecem na dashboard hoje: 9 KPIs e 3 blocos numa grade de 4 colunas,
  // ambos deixando buraco.
  it('fecha exatamente os casos reais da dashboard', () => {
    expect(melhorColunas(9, 4)).toBe(3)
    expect(sobra(9, melhorColunas(9, 4))).toBe(0)

    expect(melhorColunas(3, 4)).toBe(3)
    expect(sobra(3, melhorColunas(3, 4))).toBe(0)
  })

  it('mantém a largura máxima quando ela já fecha certo', () => {
    expect(melhorColunas(8, 4)).toBe(4)
    expect(melhorColunas(4, 4)).toBe(4)
    expect(melhorColunas(12, 4)).toBe(4)
  })

  it('prefere menos colunas quando isso elimina a sobra', () => {
    expect(melhorColunas(6, 4)).toBe(3)
    expect(sobra(6, 3)).toBe(0)
  })

  // Minimizar sobra sem limite escolheria 2 colunas (sobra 0) e faria 5 linhas estreitas.
  it('não estreita demais só para zerar a sobra', () => {
    expect(melhorColunas(10, 4)).toBe(4)
  })

  it('em empate de sobra, fica com o layout mais largo', () => {
    // 7 itens: 4 colunas deixa 1 órfão, 3 colunas deixa 2.
    expect(melhorColunas(7, 4)).toBe(4)
    // 11 itens: 4 e 3 colunas deixam 1 órfão cada.
    expect(melhorColunas(11, 4)).toBe(4)
  })

  it('nunca pede mais colunas do que itens', () => {
    expect(melhorColunas(2, 4)).toBe(2)
    expect(melhorColunas(1, 4)).toBe(1)
    expect(melhorColunas(3, 3)).toBe(3)
  })

  it('lida com lista vazia e max degenerado sem quebrar', () => {
    expect(melhorColunas(0, 4)).toBe(1)
    expect(melhorColunas(5, 1)).toBe(1)
    expect(melhorColunas(5, 0)).toBe(1)
  })

  // A promessa do componente: seja qual for a combinação, a última linha nunca fica com
  // órfão demais a ponto de um card sozinho esticar a largura toda de uma grade larga.
  it('nunca deixa um único órfão numa grade de 3+ colunas quando dá para evitar', () => {
    for (let total = 2; total <= 24; total++) {
      const colunas = melhorColunas(total, 4)
      const orfaos = total % colunas
      const ehUnicoOrfaoEmGradeLarga = colunas >= 3 && orfaos === 1
      if (ehUnicoOrfaoEmGradeLarga) {
        // Só é aceitável se nenhuma das colunas candidatas evitava o órfão único.
        const alternativa = colunas - 1
        expect(alternativa >= 2 && total % alternativa === 1, `total=${total} colunas=${colunas}`).toBe(true)
      }
    }
  })
})

function montar(total: number, props: Record<string, unknown> = {}) {
  return mount(AutoGrid, {
    props: { items: Array.from({ length: total }, (_, i) => ({ nome: `item ${i}` })), ...props },
    slots: { default: '<div class="card">conteudo</div>' },
  })
}

describe('AutoGrid', () => {
  it('renderiza um slot por item', () => {
    expect(montar(9).findAll('.card')).toHaveLength(9)
    expect(montar(1).findAll('.card')).toHaveLength(1)
  })

  it('não renderiza nada com lista vazia, em vez de um bloco vazio', () => {
    expect(montar(0).findAll('.card')).toHaveLength(0)
  })

  // A garantia contra lacunas: todo item cresce para fechar a linha. Sem isso, a última linha
  // ficaria com buraco à direita — exatamente o problema que o componente resolve.
  it('deixa todos os itens crescerem para fechar a linha', () => {
    expect(montar(5).findAll('.flex-1')).toHaveLength(5)
  })

  // 9 itens em 4 colunas deixaria 1 órfão esticado sozinho; 3 colunas fecha exato.
  it('usa a largura de coluna que fecha a grade', () => {
    expect(montar(9).findAll('.flex-1')[0].attributes('style')).toContain('33.33')
  })

  it('respeita o máximo de colunas informado', () => {
    // Com max=2, 4 itens fecham em 2 colunas => 50% cada.
    expect(montar(4, { max: 2 }).findAll('.flex-1')[0].attributes('style')).toContain('50%')
  })

  it('aplica a largura mínima para quebrar em telas estreitas', () => {
    expect(montar(4, { min: 300 }).findAll('.flex-1')[0].attributes('style')).toContain('min-width: 300px')
  })
})
