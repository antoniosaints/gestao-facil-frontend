<script setup lang="ts">
import { useRoute } from 'vue-router'
import Main from './layouts/Main.vue'
import Default from './layouts/Default.vue'
import { useUiStore } from './stores/ui/uiStore'

const store = useUiStore()
const route = useRoute()
const layouts = {
  default: Default,
  main: Main,
}
</script>

<template>
  <component :is="route.meta.layout ? layouts.main : layouts.default">
    <transition :name="store.isMobile ? 'fade' : 'slide'" mode="out-in">
      <RouterView />
    </transition>
  </component>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s ease;
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
