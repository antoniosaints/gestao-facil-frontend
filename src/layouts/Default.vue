<template>
  <slot></slot>
</template>
<script setup lang="ts">
import { useColorMode } from '@vueuse/core';

useColorMode({
  emitAuto: true,
  storageKey: 'tema_sistema_gestao_facil',
  modes: {
    light: 'light',
    dark: 'dark',
  },
})
</script>