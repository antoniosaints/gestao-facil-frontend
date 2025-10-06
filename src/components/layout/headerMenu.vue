<template>
  <header
    class="hidden md:flex items-center justify-between bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 px-6 py-3 z-20 transition-all duration-300 ease-in-out"
    :class="{ 'md:ml-64': uiStore.openSidebar }">

    <div class="text-md font-bold flex items-center gap-4">
      <PanelLeftOpen v-if="!uiStore.openSidebar" class="h-6 w-6 cursor-pointer p-0.5" @click="uiStore.toggleSidebar" />
      <PanelRightOpen v-else class="h-6 w-6 cursor-pointer p-0.5" @click="uiStore.toggleSidebar" />
      <Breadcrumb />
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
import Breadcrumb from './breadcrumb.vue';
import { useUiStore } from '@/stores/ui/uiStore';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-vue-next';
const useStore = useAuthStore();
const uiStore = useUiStore()
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
