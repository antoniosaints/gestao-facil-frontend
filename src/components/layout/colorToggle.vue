<template>
  <button @click="toggleColorMode()"
    class="mt-4 flex items-center border border-border gap-2 px-4 py-3 rounded transition bg-background dark:bg-background-dark dark:border-border-dark w-full justify-center">
    <i class="fa-solid fa-sun" id="icon-sun"></i>
    <i class="fa-solid fa-moon hidden" id="icon-moon"></i>
  </button>
</template>

<script setup lang="ts">
import { colorTheme } from '@/utils/theme';

function toggleColorMode() {
  colorTheme.value = colorTheme.value === 'light' ? 'dark' : 'light';
}
</script>
