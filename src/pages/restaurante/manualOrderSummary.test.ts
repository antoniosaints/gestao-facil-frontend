import { describe, expect, it } from 'vitest'

import { selectedMenuItemSummary } from './manualOrderSummary'

describe('selectedMenuItemSummary', () => {
  const item = {
    grupos: [
      { Grupo: { nome: 'Sabores', opcoes: [{ id: 1, nome: 'Calabresa' }, { id: 2, nome: 'Frango' }] } },
      { Grupo: { nome: 'Adicionais', opcoes: [{ id: 3, nome: 'Bacon' }, { id: 4, nome: 'Queijo' }] } },
    ],
  }

  it('shows the group and each selected option below the cart item name', () => {
    expect(selectedMenuItemSummary(item, [2, 3, 4])).toBe('Sabores: Frango · Adicionais: Bacon, Queijo')
  })

  it('does not show a summary when nothing was selected', () => {
    expect(selectedMenuItemSummary(item, [])).toBe('')
  })
})
