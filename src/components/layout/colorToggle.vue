<template>
  <Button @click="toggleColorMode" variant="outline" class="rounded-xl w-10">
    <Sun v-show="showSun" />
    <Moon v-show="!showSun" />
  </Button>
</template>

<script setup lang="ts">
import { colorTheme } from '@/utils/theme';
import { Button } from '../ui/button';
import { useUiStore } from '@/stores/ui/uiStore';
import { computed } from 'vue';
import { Moon, Sun } from 'lucide-vue-next';
const uiStore = useUiStore()
const showSun = computed(() => colorTheme.value === 'light')
function toggleColorMode() {
  colorTheme.value = colorTheme.value === 'light' ? 'dark' : 'light';
}
</script>
