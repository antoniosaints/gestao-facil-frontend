import { describe, expect, it } from 'vitest'
import { isActiveRestaurantOrder, parseTrackingTokens, prependTrackingToken, restaurantOrderStatusBadgeClass, restaurantOrderStatusLabel } from './publicMenuHistory'

describe('publicMenuHistory', () => {
  it('ignora dados inválidos e remove tokens duplicados', () => {
    expect(parseTrackingTokens('{')).toEqual([])
    expect(parseTrackingTokens(JSON.stringify(['token-123', 'token-123', null, 'curto']))).toEqual([
      'token-123',
    ])
  })

  it('mantém o pedido mais recente no início', () => {
    expect(prependTrackingToken(['token-antigo', 'token-novo'], 'token-novo')).toEqual([
      'token-novo',
      'token-antigo',
    ])
  })

  it('mantém em acompanhamento somente pedidos não finalizados', () => {
    expect(isActiveRestaurantOrder('EM_PREPARO')).toBe(true)
    expect(isActiveRestaurantOrder('PRONTO')).toBe(true)
    expect(isActiveRestaurantOrder('CONCLUIDO')).toBe(false)
    expect(isActiveRestaurantOrder('CANCELADO')).toBe(false)
  })

  it('apresenta o texto do status de forma legível', () => {
    expect(restaurantOrderStatusLabel('EM_PREPARO')).toBe('Em preparo')
    expect(restaurantOrderStatusLabel('CONCLUIDO')).toBe('Concluído')
  })

  it('associa cada status a uma cor semântica', () => {
    expect(restaurantOrderStatusBadgeClass('CONCLUIDO')).toContain('emerald')
    expect(restaurantOrderStatusBadgeClass('CANCELADO')).toContain('red')
    expect(restaurantOrderStatusBadgeClass('EM_PREPARO')).toContain('violet')
  })
})
