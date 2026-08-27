import { describe, expect, it } from 'vitest'

import { formatKdsSelections } from './kdsSelections'

describe('formatKdsSelections', () => {
  it('groups flavor choices by their group name and lists complements with a plus sign', () => {
    expect(formatKdsSelections([
      { tipo: 'SABOR', grupoNome: 'Escolha os sabores', nome: 'Calabresa' },
      { tipo: 'COMPLEMENTO', grupoNome: 'Adicionais', nome: 'Bacon' },
      { tipo: 'SABOR', grupoNome: 'Escolha os sabores', nome: 'Frango' },
      { tipo: 'COMPLEMENTO', grupoNome: 'Adicionais', nome: 'Queijo' },
    ])).toEqual([
      'Escolha os sabores: Calabresa, Frango',
      '+ Bacon, Queijo',
    ])
  })

  it('keeps selections from legacy orders visible as complements', () => {
    expect(formatKdsSelections([{ nome: 'Carne' }])).toEqual(['+ Carne'])
  })
})
