import { describe, expect, it } from 'vitest'
import { intervaloDoPreset, PERIODO_PRESETS } from './periodoPresets'

// Quarta-feira, 15/07/2026, meio do mês e meio do dia.
const agora = new Date(2026, 6, 15, 12, 30, 0)
const dia = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`

describe('intervaloDoPreset', () => {
  it('hoje cobre o dia inteiro', () => {
    const [inicio, fim] = intervaloDoPreset('today', agora)
    expect(dia(inicio)).toBe('15/7/2026')
    expect(dia(fim)).toBe('15/7/2026')
    expect(inicio.getHours()).toBe(0)
    expect(fim.getHours()).toBe(23)
  })

  // Inclui hoje: 7 dias no total, não 7 dias atrás + hoje = 8.
  it('7 dias inclui hoje e volta 6', () => {
    const [inicio, fim] = intervaloDoPreset('7d', agora)
    expect(dia(inicio)).toBe('9/7/2026')
    expect(dia(fim)).toBe('15/7/2026')
  })

  it('30 dias inclui hoje e volta 29', () => {
    const [inicio, fim] = intervaloDoPreset('30d', agora)
    expect(dia(inicio)).toBe('16/6/2026')
    expect(dia(fim)).toBe('15/7/2026')
  })

  it('este mês vai do primeiro ao último dia', () => {
    const [inicio, fim] = intervaloDoPreset('month', agora)
    expect(dia(inicio)).toBe('1/7/2026')
    expect(dia(fim)).toBe('31/7/2026')
  })

  it('mês passado não invade o mês atual', () => {
    const [inicio, fim] = intervaloDoPreset('last-month', agora)
    expect(dia(inicio)).toBe('1/6/2026')
    expect(dia(fim)).toBe('30/6/2026')
  })

  // Vira de ano: subtrair um mês de janeiro tem que cair em dezembro do ano anterior.
  it('mês passado atravessa a virada de ano', () => {
    const [inicio, fim] = intervaloDoPreset('last-month', new Date(2026, 0, 10))
    expect(dia(inicio)).toBe('1/12/2025')
    expect(dia(fim)).toBe('31/12/2025')
  })

  it('todo preset da lista devolve um intervalo válido', () => {
    for (const preset of PERIODO_PRESETS) {
      const [inicio, fim] = intervaloDoPreset(preset.key, agora)
      expect(inicio.getTime(), preset.key).toBeLessThanOrEqual(fim.getTime())
    }
  })
})
