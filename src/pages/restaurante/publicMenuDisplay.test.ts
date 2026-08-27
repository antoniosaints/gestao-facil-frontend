import { describe, expect, it } from 'vitest'

import { menuCategoryItems, uniquePublicMenuItems } from './publicMenuDisplay'

describe('public menu display', () => {
  const items = [
    { id: 1, maisPedido: true },
    { id: 2, maisPedido: false },
    { id: 1, maisPedido: true },
  ]

  it('keeps a catalog item only once even if the response repeats it', () => {
    expect(uniquePublicMenuItems(items).map((item) => item.id)).toEqual([1, 2])
  })

  it('does not repeat highlights in their category on the initial view', () => {
    expect(menuCategoryItems(uniquePublicMenuItems(items), true).map((item) => item.id)).toEqual([2])
  })

  it('keeps highlights available while filtering or searching', () => {
    expect(menuCategoryItems(uniquePublicMenuItems(items), false).map((item) => item.id)).toEqual([1, 2])
  })
})
