import type { ThemeCustomization } from '@/types/schemas'

export type ThemeMode = 'light' | 'dark'

export const DEFAULT_THEME_CUSTOMIZATION: ThemeCustomization = {
  primariaLight: '#2563EB',
  primariaDark: '#1D4ED8',
  sidebarLight: '#1D4ED8',
  sidebarDark: '#172554',
  fundoLight: '#F8FAFC',
  fundoDark: '#020617',
}

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/

function normalizeHex(value: unknown, fallback: string) {
  return typeof value === 'string' && HEX_COLOR.test(value) ? value.toUpperCase() : fallback
}

export function normalizeThemeCustomization(value?: Partial<ThemeCustomization> | null): ThemeCustomization {
  return {
    primariaLight: normalizeHex(value?.primariaLight, DEFAULT_THEME_CUSTOMIZATION.primariaLight),
    primariaDark: normalizeHex(value?.primariaDark, DEFAULT_THEME_CUSTOMIZATION.primariaDark),
    sidebarLight: normalizeHex(value?.sidebarLight, DEFAULT_THEME_CUSTOMIZATION.sidebarLight),
    sidebarDark: normalizeHex(value?.sidebarDark, DEFAULT_THEME_CUSTOMIZATION.sidebarDark),
    fundoLight: normalizeHex(value?.fundoLight, DEFAULT_THEME_CUSTOMIZATION.fundoLight),
    fundoDark: normalizeHex(value?.fundoDark, DEFAULT_THEME_CUSTOMIZATION.fundoDark),
  }
}

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16)
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const channel = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0')
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase()
}

export function mixHex(base: string, overlay: string, overlayWeight: number) {
  const a = hexToRgb(base)
  const b = hexToRgb(overlay)
  const weight = Math.min(1, Math.max(0, overlayWeight))
  return rgbToHex({
    r: a.r + (b.r - a.r) * weight,
    g: a.g + (b.g - a.g) * weight,
    b: a.b + (b.b - a.b) * weight,
  })
}

function linearChannel(value: number) {
  const channel = value / 255
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  return 0.2126 * linearChannel(r) + 0.7152 * linearChannel(g) + 0.0722 * linearChannel(b)
}

export function contrastRatio(background: string, foreground: string) {
  const first = relativeLuminance(background)
  const second = relativeLuminance(foreground)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

export function readableForeground(background: string) {
  const light = '#F8FAFC'
  const dark = '#0F172A'
  return contrastRatio(background, light) >= contrastRatio(background, dark) ? light : dark
}

export function hexToHslValue(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const red = r / 255
  const green = g / 255
  const blue = b / 255
  const max = Math.max(red, green, blue)
  const min = Math.min(red, green, blue)
  const delta = max - min
  let hue = 0

  if (delta) {
    if (max === red) hue = ((green - blue) / delta) % 6
    else if (max === green) hue = (blue - red) / delta + 2
    else hue = (red - green) / delta + 4
    hue *= 60
    if (hue < 0) hue += 360
  }

  const lightness = (max + min) / 2
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1))
  return `${hue.toFixed(1)} ${(saturation * 100).toFixed(1)}% ${(lightness * 100).toFixed(1)}%`
}

export function getThemePalette(themeValue: Partial<ThemeCustomization> | null | undefined, mode: ThemeMode) {
  const theme = normalizeThemeCustomization(themeValue)
  const primary = mode === 'dark' ? theme.primariaDark : theme.primariaLight
  const sidebar = mode === 'dark' ? theme.sidebarDark : theme.sidebarLight
  const background = mode === 'dark' ? theme.fundoDark : theme.fundoLight
  const foreground = readableForeground(background)
  const primaryForeground = readableForeground(primary)
  const sidebarForeground = readableForeground(sidebar)

  return {
    background,
    body: mixHex(background, foreground, mode === 'dark' ? 0.035 : 0.065),
    foreground,
    card: mixHex(background, foreground, mode === 'dark' ? 0.075 : 0.012),
    popover: mixHex(background, foreground, mode === 'dark' ? 0.055 : 0),
    primary,
    primaryForeground,
    sidebar,
    sidebarForeground,
    secondary: mixHex(background, foreground, mode === 'dark' ? 0.13 : 0.1),
    muted: mixHex(background, foreground, mode === 'dark' ? 0.14 : 0.1),
    mutedForeground: mixHex(background, foreground, 0.62),
    accent: mixHex(background, primary, mode === 'dark' ? 0.2 : 0.09),
    border: mixHex(background, foreground, mode === 'dark' ? 0.2 : 0.15),
    input: mixHex(background, foreground, mode === 'dark' ? 0.24 : 0.18),
  }
}

export function applyThemeVariables(theme: Partial<ThemeCustomization> | null | undefined, mode: ThemeMode) {
  if (typeof document === 'undefined') return getThemePalette(theme, mode)
  const palette = getThemePalette(theme, mode)
  const root = document.documentElement
  const variables: Record<string, string> = {
    '--background': palette.background,
    '--body': palette.body,
    '--foreground': palette.foreground,
    '--card': palette.card,
    '--card-foreground': palette.foreground,
    '--popover': palette.popover,
    '--popover-foreground': palette.foreground,
    '--primary': palette.primary,
    '--primary-foreground': palette.primaryForeground,
    '--sidebar': palette.sidebar,
    '--sidebar-foreground': palette.sidebarForeground,
    '--secondary': palette.secondary,
    '--secondary-foreground': palette.foreground,
    '--muted': palette.muted,
    '--muted-foreground': palette.mutedForeground,
    '--accent': palette.accent,
    '--accent-foreground': palette.foreground,
    '--border': palette.border,
    '--input': palette.input,
    '--ring': palette.primary,
  }

  for (const [property, hex] of Object.entries(variables)) {
    root.style.setProperty(property, hexToHslValue(hex))
  }

  return palette
}
