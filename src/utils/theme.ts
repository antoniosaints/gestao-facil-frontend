import { useColorMode } from '@vueuse/core'
import { watch } from 'vue'
import { env } from './dotenv'

export const colorTheme = useColorMode({
  emitAuto: true,
  storageKey: 'tema_sistema_gestao_facil',
  modes: {
    light: 'light',
    dark: 'dark',
    auto: 'auto',
  },
})

export function updateMetaTags() {
  const themeMeta = document.querySelector<HTMLMetaElement>('#meta-theme')
  const bgMeta = document.querySelector<HTMLMetaElement>('#meta-background')

  if (!themeMeta || !bgMeta) return

  if (colorTheme.value === 'dark') {
    themeMeta.setAttribute('content', '#0c0a09') // cor do tema dark
    bgMeta.setAttribute('content', '#0c0a09')
  } else {
    themeMeta.setAttribute('content', '#f2f2f2') // cor do tema light
    bgMeta.setAttribute('content', '#f2f2f2')
  }

  const iconUrl = env.VITE_MODE_SYSTEM === 'arena' ? '/imgs/favicon_arena.png' : '/imgs/logo.png'

  const favicon = document.querySelector<HTMLLinkElement>('link#logotipoSystema')
  const appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')
  const shortcutIcon = document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')
  document.title = env.VITE_MODE_SYSTEM === 'arena' ? 'Arena ERP' : 'Gestão Fácil'

  if (favicon) favicon.href = iconUrl
  if (appleIcon) appleIcon.href = iconUrl
  if (shortcutIcon) shortcutIcon.href = iconUrl
}

watch(colorTheme, updateMetaTags, { immediate: true })
