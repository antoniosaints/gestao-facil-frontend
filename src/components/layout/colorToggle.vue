<template>
  <button
    @click="toggleColorMode()"
    class="mt-4 flex items-center border border-border gap-2 px-4 py-3 rounded transition bg-background dark:bg-background-dark dark:border-border-dark w-full justify-center"
  >
    <i class="fa-solid fa-sun" id="icon-sun"></i>
    <i class="fa-solid fa-moon hidden" id="icon-moon"></i>
  </button>
</template>

<script setup lang="ts">
import { useColorMode } from '@vueuse/core'

const colorMode = useColorMode({
  emitAuto: true,
  storageKey: 'tema_sistema_gestao_facil',
  modes: {
    light: 'light',
    dark: 'dark',
  },
})

function toggleColorMode() {
  colorMode.value = colorMode.value === 'light' ? 'dark' : 'light'
}
</script>
