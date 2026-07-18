<script setup lang="ts">
import { Download } from 'lucide-vue-next'
import { usePwaInstall } from '@/composables/usePwaInstall'

// Só aparece quando o PWA é instalável e ainda NÃO está instalado.
const { canInstall, installed, promptInstall } = usePwaInstall()
</script>

<template>
  <button
    v-if="canInstall && !installed"
    type="button"
    class="mb-2 flex w-full items-center gap-2 rounded-xl bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90"
    @click="promptInstall"
  >
    <Download class="h-4 w-4 shrink-0" />
    Instalar App
  </button>
</template>
