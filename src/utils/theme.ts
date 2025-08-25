import { useColorMode } from '@vueuse/core'

export const colorTheme = useColorMode({
  emitAuto: true,
  storageKey: 'tema_sistema_gestao_facil',
  modes: {
    light: 'light',
    dark: 'dark',
    auto: 'auto',
  },
})
