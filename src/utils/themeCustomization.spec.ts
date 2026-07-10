import { describe, expect, it } from 'vitest'
import {
  DEFAULT_THEME_CUSTOMIZATION,
  contrastRatio,
  getThemePalette,
  normalizeThemeCustomization,
  readableForeground,
} from './themeCustomization'

describe('themeCustomization', () => {
  it('restaura cores invalidas para os valores seguros', () => {
    expect(normalizeThemeCustomization({ primariaLight: 'red' })).toEqual(DEFAULT_THEME_CUSTOMIZATION)
  })

  it('gera paletas diferentes e completas para light e dark', () => {
    const light = getThemePalette(DEFAULT_THEME_CUSTOMIZATION, 'light')
    const dark = getThemePalette(DEFAULT_THEME_CUSTOMIZATION, 'dark')
    expect(light.background).toBe('#F8FAFC')
    expect(dark.background).toBe('#020617')
    expect(light.primary).not.toBe(dark.primary)
    expect(light.card).not.toBe(light.background)
  })

  it('seleciona texto com contraste WCAG para qualquer cor principal', () => {
    for (const color of ['#FFFFFF', '#000000', '#FACC15', '#2563EB', '#7C3AED']) {
      expect(contrastRatio(color, readableForeground(color))).toBeGreaterThanOrEqual(4.5)
    }
  })
})
