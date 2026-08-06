import { describe, expect, it } from 'vitest'
import { parseTrackingTokens, prependTrackingToken } from './publicMenuHistory'

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
})
