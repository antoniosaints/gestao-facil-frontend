<script setup lang="ts">
import { useRoute } from 'vue-router'
import Main from './layouts/Main.vue'
import Default from './layouts/Default.vue'

const route = useRoute()
const layouts = {
  default: Default,
  main: Main,
}
</script>

<template>
  <component :is="route.meta.layout ? layouts.main : layouts.default">
    <RouterView />
  </component>
</template>

<style scoped></style>
