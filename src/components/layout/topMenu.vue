<template>
  <div
    class="border border-border dark:border-border-dark cursor-pointer truncate hover:bg-gray-100 dark:hover:bg-gray-800 w-full flex px-3 py-2 justify-between items-center gap-2 rounded-xl bg-white dark:bg-gray-950 transition-all">
    <div class="flex gap-2 justify-between items-center">
      <img @click="openModal" :src="logo" alt="PR" class="rounded-full w-10 h-10 bg-gray-500" />
      <div class="flex flex-col truncate">
        <h1 class="text-base overflow-hidden text-ellipsis whitespace-nowrap truncate text-gray-700 dark:text-gray-300">
          {{ store.contaInfo.nome }}
        </h1>
        <p class="text-xs overflow-hidden text-ellipsis whitespace-nowrap truncate text-gray-700 dark:text-gray-300">
          {{ store.usuarioLogged.email || "Login necessário" }}
        </p>
      </div>
    </div>
    <ModalUploadPerfil />
  </div>
</template>

<script setup lang="ts">
import ModalUploadPerfil from '@/pages/configs/ModalUploadPerfil.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { computed } from 'vue'
const store = useUiStore()

const logo = computed(() => {
  const url = import.meta.env.VITE_BACKEND_URL
  return url + '/' + store.contaInfo.profile + '?_t=' + Date.now()
})

const openModal = () => {
  if (store.permissoes.admin) {
    store.openModalProfile = true
  }
}
</script>
