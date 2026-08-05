import { describe, expect, it } from 'vitest'
import { availableFallbackStations, changePrimaryStation, swapPrintStations } from './printRuleDraft'

describe('configuração dos destinos de impressão', () => {
  it('inverte as funções ao escolher a contingência como nova principal', () => {
    expect(changePrimaryStation({ estacaoId: 1, fallbackEstacaoId: 2 }, 2)).toEqual({
      estacaoId: 2,
      fallbackEstacaoId: 1,
    })
  })

  it('mantém a contingência ao escolher uma terceira estação como principal', () => {
    expect(changePrimaryStation({ estacaoId: 1, fallbackEstacaoId: 2 }, 3)).toEqual({
      estacaoId: 3,
      fallbackEstacaoId: 2,
    })
  })

  it('permite inverter principal e contingência explicitamente', () => {
    expect(swapPrintStations({ estacaoId: 4, fallbackEstacaoId: 8 })).toEqual({
      estacaoId: 8,
      fallbackEstacaoId: 4,
    })
  })

  it('remove a principal das opções de contingência', () => {
    expect(availableFallbackStations([{ id: 1 }, { id: 2 }, { id: 3 }], 2)).toEqual([{ id: 1 }, { id: 3 }])
  })
})
