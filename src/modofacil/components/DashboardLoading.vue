<script setup lang="ts">
import illustration from '../assets/dashboard-loading.svg'
</script>
<template>
  <div
    role="status"
    aria-live="polite"
    aria-atomic="true"
    aria-label="Carregando dados do dashboard"
    class="flex min-h-[calc(100dvh-65px-3rem)] flex-col items-center justify-center gap-1 px-4 pb-8 text-center"
  >
    <img :src="illustration" alt="" aria-hidden="true" class="mb-3 h-44 w-52 sm:h-52 sm:w-64" />
    <p class="!mb-1 font-semibold tracking-tight">Preparando seu dashboard</p>
    <p class="!mb-0 max-w-xs !text-xs text-muted-foreground">
      Carregando os indicadores do seu negócio…
    </p>
  </div>
</template>
