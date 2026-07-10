import { useColorMode } from '@vueuse/core'
import { nextTick, ref, watch } from 'vue'
import { env } from './dotenv'
import type { ThemeCustomization } from '@/types/schemas'
import {
  DEFAULT_THEME_CUSTOMIZATION,
  applyThemeVariables,
  getThemePalette,
  normalizeThemeCustomization,
  type ThemeMode,
} from './themeCustomization'

export const colorTheme = useColorMode({
  emitAuto: true,
  storageKey: 'tema_sistema_gestao_facil',
  modes: {
    light: 'light',
    dark: 'dark',
    auto: 'auto',
  },
})

export const activeThemeCustomization = ref<ThemeCustomization>({ ...DEFAULT_THEME_CUSTOMIZATION })

function resolvedThemeMode(): ThemeMode {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function setThemeCustomization(value?: Partial<ThemeCustomization> | null) {
  activeThemeCustomization.value = normalizeThemeCustomization(value)
  applyThemeVariables(activeThemeCustomization.value, resolvedThemeMode())
  updateMetaTags()
}

export function updateMetaTags() {
  const themeMeta = document.querySelector<HTMLMetaElement>('#meta-theme')
  const bgMeta = document.querySelector<HTMLMetaElement>('#meta-background')

  if (!themeMeta || !bgMeta) return

  const palette = getThemePalette(activeThemeCustomization.value, resolvedThemeMode())
  themeMeta.setAttribute('content', palette.background)
  bgMeta.setAttribute('content', palette.background)

  const iconUrl = env.VITE_MODE_SYSTEM === 'arena' ? '/imgs/favicon_arena.png' : '/imgs/logo.png'

  const favicon = document.querySelector<HTMLLinkElement>('link#logotipoSystema')
  const appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
  const shortcutIcon = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')
  document.title = env.VITE_MODE_SYSTEM === 'arena' ? 'Arena ERP' : 'Gestão Fácil'

  if (favicon) favicon.href = iconUrl
  if (appleIcon) appleIcon.href = iconUrl
  if (shortcutIcon) shortcutIcon.href = iconUrl
}

watch(colorTheme, async () => {
  await nextTick()
  applyThemeVariables(activeThemeCustomization.value, resolvedThemeMode())
  updateMetaTags()
}, { immediate: true })
