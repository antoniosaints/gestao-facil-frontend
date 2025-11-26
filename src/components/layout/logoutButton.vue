<template>
  <div class="space-y-2">
    <button @click="logOut()"
      class="cursor-pointer w-full dark:border-gray-500 text-gray-200 gap-2 px-4 p-2 rounded-xl transition flex items-center"
      :class="colorTheme">
      <i class="fa-solid fa-right-from-bracket text-red-600 mr-2"></i> Sair
    </button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/login/useAuthStore';
import { env } from '@/utils/dotenv';
import { computed } from 'vue';
import { useToast } from 'vue-toastification';
const store = useAuthStore();
const toast = useToast()
function logOut() {
  store.logout()
  toast.info("Logout efetuado com sucesso!")
}

const colorTheme = computed(() => {
  if (env.VITE_MODE_SYSTEM === 'arena') return 'bg-teal-900/30'
  return 'bg-blue-900/30'
})
</script>
