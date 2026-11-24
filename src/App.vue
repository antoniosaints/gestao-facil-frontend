<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Main from './layouts/Main.vue'
import Default from './layouts/Default.vue'
import { useUiStore } from './stores/ui/uiStore'
import Admin from './layouts/Admin.vue'
import { env } from './utils/dotenv'
import Arena from './layouts/Arena.vue'
import AppAccessDialog from './components/apps/AppAccessDialog.vue'
import AppAccessReturn from './components/apps/AppAccessReturn.vue'
import RouteLoadingViewport from './components/layout/RouteLoadingViewport.vue'
import { isRouteLoading } from './router'

const store = useUiStore()
const route = useRoute()

// Definição dos layouts disponíveis
const layouts = {
  default: Default,
  main: env.VITE_MODE_SYSTEM === 'arena' ? Arena : Main,
  admin: Admin
}

// Seleciona o layout de acordo com a meta da rota
const layout = computed(() => {
  const name = route.meta.layout as keyof typeof layouts || 'default'
  return layouts[name]
})

const disableRouteTransition = computed(() => route.path.startsWith('/lojas/'))
const usesAnimatedRouteLoading = computed(
  () => store.usaCarregamentoAnimado && !route.meta.isPublic && route.meta.layout !== 'admin',
)
</script>

<template>
  <component :is="layout">
    <AppAccessReturn />
    <RouteLoadingViewport :loading="isRouteLoading && route.meta.layout !== 'default'">
      <router-view v-slot="{ Component }">
        <component v-if="disableRouteTransition" :is="Component" />
        <transition
          v-else
          :name="store.isMobile ? 'fade' : 'slide'"
          :css="!usesAnimatedRouteLoading"
          :mode="usesAnimatedRouteLoading ? undefined : 'out-in'"
        >
          <component :is="Component" />
        </transition>
      </router-view>
    </RouteLoadingViewport>
  </component>
  <AppAccessDialog />
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.1s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
