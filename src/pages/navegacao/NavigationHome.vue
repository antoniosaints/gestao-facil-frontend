<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'
import { env } from '@/utils/dotenv'
import { useUiStore } from '@/stores/ui/uiStore'
import CardsNavigationHub from './CardsNavigationHub.vue'

const uiStore = useUiStore()
const dashboardComponent = defineAsyncComponent(() =>
  env.VITE_MODE_SYSTEM === 'arena'
    ? import('@/pages/arena/comandas/Dashboard.vue')
    : import('@/pages/dashboard/Dashboard.vue'),
)
const showCards = computed(() => uiStore.usaNavegacaoPorCards)
</script>

<template>
  <CardsNavigationHub v-if="showCards" />
  <component :is="dashboardComponent" v-else />
</template>
