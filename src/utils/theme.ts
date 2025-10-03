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
    themeMeta.setAttribute('content', '#0c0a09') // cor do tema dark
    bgMeta.setAttribute('content', '#0c0a09')
  } else {
    themeMeta.setAttribute('content', '#f2f2f2') // cor do tema light
    bgMeta.setAttribute('content', '#f2f2f2')
  }
}

watch(colorTheme, updateMetaTags, { immediate: true })
