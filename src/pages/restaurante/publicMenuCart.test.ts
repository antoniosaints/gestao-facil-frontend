import { describe, expect, it } from 'vitest'

import { hasSameMenuSelections } from './publicMenuCart'

describe('hasSameMenuSelections', () => {
  it('reconhece a mesma combinação independentemente da ordem', () => {
    expect(hasSameMenuSelections([8, 3], [3, 8])).toBe(true)
  })

  it('diferencia combinações de sabores distintas', () => {
    expect(hasSameMenuSelections([3], [8])).toBe(false)
  })
})
