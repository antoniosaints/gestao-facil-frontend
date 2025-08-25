<template>
  <header
    class="hidden md:flex md:ml-64 items-center justify-between border border-border bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-6 py-3 shadow z-20">
    <div class="text-xl font-bold">
      <button class="hidden p-2"><i class="fa-solid fa-bars"></i></button>
    </div>
    <div class="flex gap-2">
      <div class="flex justify-between flex-col text-sm text-left">
        <div>{{ useStore.user }}</div>
        <p class="text-xs">{{ horarioSistemaAtual }}</p>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/login/useAuthStore'
import { onMounted, onUnmounted, ref } from 'vue'
const useStore = useAuthStore();
const horarioSistemaAtual = ref('')

let intervalId: number | undefined

onMounted(() => {
  const atualizarHorario = () => {
    horarioSistemaAtual.value = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  atualizarHorario()
  intervalId = window.setInterval(atualizarHorario, 1000)
})

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>
