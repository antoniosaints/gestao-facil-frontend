<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Main from './layouts/Main.vue'
import Default from './layouts/Default.vue'
import { useUiStore } from './stores/ui/uiStore'

const store = useUiStore()
const route = useRoute()

// Definição dos layouts disponíveis
const layouts = {
  default: Default,
  main: Main,
}

// Seleciona o layout de acordo com a meta da rota
const layout = computed(() => {
  const name = route.meta.layout as keyof typeof layouts || 'default'
  return layouts[name]
})
</script>

<template>
  <component :is="layout">
    <router-view v-slot="{ Component }">
      <transition :name="store.isMobile ? 'fade' : 'slide'" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </component>
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
  transition: all 0.2s ease;
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
