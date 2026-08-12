<template>
  <header
    class="hidden md:flex items-center justify-between bg-background text-foreground px-6 py-3 z-20 transition-[background-color,color] duration-300 ease-in-out"
    :class="{
      'md:ml-64': uiStore.openSidebar && !uiStore.usaNavegacaoSemSidebar && !uiStore.usaNavegacaoSideV2,
      'md:ml-72': uiStore.openSidebar && uiStore.usaNavegacaoSideV2,
    }"
  >
    <div class="text-md font-bold flex items-center gap-4">
      <RouterLink
        v-if="uiStore.usaNavegacaoPorCards"
        :to="homePath"
        class="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <LayoutGrid class="h-5 w-5" />
        <span class="sr-only">Abrir módulos</span>
      </RouterLink>
      <PanelLeftOpen
        v-else-if="!uiStore.openSidebar"
        class="h-6 w-6 cursor-pointer p-0.5"
        @click="uiStore.toggleSidebar"
      />
      <PanelRightOpen v-else class="h-6 w-6 cursor-pointer p-0.5" @click="uiStore.toggleSidebar" />
      <Breadcrumb />
    </div>
    <div class="flex items-center justify-center gap-2">
      <SupportBadge v-if="isSupportActive()" class="mr-2" />
      <ReportBugButton />
      <TourHelpButton />
      <InformativosStatusButton />
      <RestaurantPrintStatusButton />
      <ColorToggle class="mr-2" v-if="!uiStore.isMobile" />
      <div class="flex justify-between flex-col text-sm truncate text-left max-w-34">
        <div class="truncate">Olá, {{ uiStore.usuarioLogged.nome }}</div>
        <p class="text-xs">{{ horarioSistemaAtual }}</p>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import Breadcrumb from './breadcrumb.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { LayoutGrid, PanelLeftOpen, PanelRightOpen } from 'lucide-vue-next'
import ColorToggle from './colorToggle.vue'
import SupportBadge from './SupportBadge.vue'
import InformativosStatusButton from './InformativosStatusButton.vue'
import TourHelpButton from './TourHelpButton.vue'
import ReportBugButton from './ReportBugButton.vue'
import RestaurantPrintStatusButton from './RestaurantPrintStatusButton.vue'
import { isSupportActive } from '@/utils/supportSession'
withDefaults(defineProps<{ homePath?: string }>(), {
  homePath: '/',
})
const uiStore = useUiStore()
const horarioSistemaAtual = ref('')

let intervalId: number | undefined

onMounted(() => {
  const atualizarHorario = () => {
    horarioSistemaAtual.value = new Date().toLocaleTimeString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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
