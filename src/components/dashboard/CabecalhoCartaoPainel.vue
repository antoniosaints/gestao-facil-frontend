<script setup lang="ts">
import type { Component } from 'vue'
import AjudaIndicador from './AjudaIndicador.vue'

withDefaults(defineProps<{
  titulo: string
  texto: string
  icone: Component
  classeIcone?: string
}>(), {
  classeIcone: 'text-primary',
})
</script>

<template>
  <div class="mb-4 flex min-w-0 items-center justify-between gap-2">
    <div class="flex min-w-0 items-center gap-2">
      <component :is="icone" class="size-5 shrink-0" :class="classeIcone" aria-hidden="true" />
      <h3 class="font-semibold">{{ titulo }}</h3>
    </div>
    <AjudaIndicador :titulo="titulo" :texto="texto" class="-my-2 -mr-2" />
  </div>
</template>
