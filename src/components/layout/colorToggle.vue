<template>
  <Button @click="toggleColorMode" variant="ghost" class="rounded-xl w-10 bg-primary hover:bg-primary/80 text-white">
    <Sun v-show="showSun" />
    <Moon v-show="!showSun" />
  </Button>
</template>

<script setup lang="ts">
import { colorTheme } from '@/utils/theme';
import { Button } from '../ui/button';
import { computed } from 'vue';
import { Moon, Sun } from 'lucide-vue-next';
const showSun = computed(() => colorTheme.value === 'light')
function toggleColorMode() {
  colorTheme.value = colorTheme.value === 'light' ? 'dark' : 'light';
}
</script>
