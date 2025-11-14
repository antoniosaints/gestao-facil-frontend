<template>
  <Button @click="toggleColorMode" variant="ghost"
    class="rounded-xl w-10 bg-primary md:border md:bg-card md:hover:bg-card/80 hover:bg-primary/80 text-white md:text-gray-700 md:dark:text-gray-200">
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
