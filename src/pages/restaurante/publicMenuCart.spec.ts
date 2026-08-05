import { describe, expect, it } from 'vitest'
import { calculateMenuItemUnitPrice, updateMenuGroupSelection } from './publicMenuCart'

const item: Parameters<typeof calculateMenuItemUnitPrice>[0] = {
  Produto: { preco: 30 },
  regraPrecoSabores: 'MAIOR_PRECO',
  grupos: [
    {
      Grupo: {
        tipo: 'SABOR',
        opcoes: [
          { id: 1, precoAdicional: 4 },
          { id: 2, precoAdicional: 7 },
        ],
      },
    },
    {
      Grupo: {
        tipo: 'COMPLEMENTO',
        opcoes: [{ id: 3, precoAdicional: 5 }],
      },
    },
  ],
}

describe('calculateMenuItemUnitPrice', () => {
  it('usa o maior adicional dos sabores e soma os complementos', () => {
    expect(calculateMenuItemUnitPrice(item, [1, 2, 3])).toBe(42)
  })

  it('soma todos os sabores quando essa for a regra do item', () => {
    expect(calculateMenuItemUnitPrice({ ...item, regraPrecoSabores: 'SOMA' }, [1, 2, 3])).toBe(46)
  })

  it('usa a média dos sabores quando essa for a regra do item', () => {
    expect(calculateMenuItemUnitPrice({ ...item, regraPrecoSabores: 'MEDIA_PROPORCIONAL' }, [1, 2, 3])).toBe(40.5)
  })
})

describe('updateMenuGroupSelection', () => {
  it('substitui a escolha anterior quando o grupo permite apenas uma opção', () => {
    expect(updateMenuGroupSelection([10, 1], [1, 2], 2, 1)).toEqual([10, 2])
  })
})
