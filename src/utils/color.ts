import { useColorMode } from "@vueuse/core";

export const colorMode = useColorMode({
    emitAuto: true,
    storageKey: 'tema_sistema_gestao_facil',
    modes: {
        light: 'light',
        dark: 'dark',
    },
})