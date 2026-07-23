<template>
  <div
    class="truncate w-full flex px-3 py-2 justify-between items-center gap-2 rounded-xl dark:border-gray-500 transition-[background-color,transform]"
    :class="colorTheme">
    <div class="flex gap-2 justify-between items-center">
      <img :src="logo" alt="PR" class="rounded-full w-10 h-10 bg-gray-500" />
      <div class="flex flex-col truncate">
        <h1 class="text-base overflow-hidden text-ellipsis whitespace-nowrap truncate text-gray-200 dark:text-gray-300">
          {{ store.contaInfo.nome }}
        </h1>
        <p class="text-xs overflow-hidden text-ellipsis whitespace-nowrap truncate text-gray-300 dark:text-gray-400">
          {{ store.usuarioLogged.email || 'Login necessário' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { resolveFileUrl } from '@/utils/fileUrl'

const store = useUiStore()

// A troca da logo mora em Configurações > Empresa; aqui o avatar é só exibição.
const logo = computed(() => resolveFileUrl(store.contaInfo.profile, { bustCache: true }))

const colorTheme = computed(() => {
  return 'bg-black/10 text-sidebar-foreground'
})
</script>
