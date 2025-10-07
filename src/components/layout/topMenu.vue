<template>
  <div
    class="border border-border dark:border-border-dark cursor-pointer truncate hover:bg-gray-100 dark:hover:bg-gray-800 w-full flex px-3 py-2 justify-between items-center gap-2 rounded-xl bg-white dark:bg-gray-950 transition-all">
    <div class="flex gap-2 justify-between items-center">
      <img :src="logoSistemaGestaoFacil" alt="PR" class="rounded-full w-8 h-8 bg-gray-500" />
      <div class="flex flex-col truncate">
        <h1 class="text-base overflow-hidden text-ellipsis whitespace-nowrap truncate text-gray-700 dark:text-gray-300">
          {{ nameSistemaGestaoFacil }}
        </h1>
        <p class="text-xs overflow-hidden text-ellipsis whitespace-nowrap truncate text-gray-700 dark:text-gray-300">
          {{ infoSistemaGestaoFacil }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ContaRepository } from '@/repositories/conta-repository'
import { onMounted, ref } from 'vue'
const logoSistemaGestaoFacil = ref('imgs/logo.png')
const nameSistemaGestaoFacil = ref('Gestão Fácil')
const infoSistemaGestaoFacil = ref('Gestão inteligente')
async function atualizarLogoSistema() {
  try {
    const data = await ContaRepository.info()
    const url_backend = import.meta.env.VITE_API_URL
    logoSistemaGestaoFacil.value = url_backend.replace('/api', '/') + data.profile + '?_t=' + Date.now()
    nameSistemaGestaoFacil.value = data.nome
    infoSistemaGestaoFacil.value = data?.Usuarios[0]?.email
  } catch (error) {
    console.log(error)
  }
}

onMounted(() => {
  atualizarLogoSistema()
})
</script>
