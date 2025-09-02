import { useColorMode } from '@vueuse/core'
import { watch } from 'vue'

export const colorTheme = useColorMode({
  emitAuto: true,
  storageKey: 'tema_sistema_gestao_facil',
  modes: {
    light: 'light',
    dark: 'dark',
    auto: 'auto',
  },
})

function updateMetaTags() {
  const themeMeta = document.querySelector<HTMLMetaElement>('#meta-theme')
  const bgMeta = document.querySelector<HTMLMetaElement>('#meta-background')

  if (!themeMeta || !bgMeta) return

  if (colorTheme.value === 'dark') {
    themeMeta.setAttribute('content', '#0f172a') // cor do tema dark
    bgMeta.setAttribute('content', '#0f172a')
  } else {
    themeMeta.setAttribute('content', '#ffffff') // cor do tema light
    bgMeta.setAttribute('content', '#ffffff')
  }
}

watch(colorTheme, updateMetaTags, { immediate: true })
