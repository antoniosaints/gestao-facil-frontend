<template>
  <div class="space-y-2">
    <button @click="logOut()"
      class="cursor-pointer w-full bg-blue-900/30 dark:border-gray-500 text-gray-200 gap-2 px-4 p-2 rounded-xl transition flex items-center">
      <i class="fa-solid fa-right-from-bracket text-red-600 mr-2"></i> Sair
    </button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/login/useAuthStore';
import { useToast } from 'vue-toastification';
const store = useAuthStore();
const toast = useToast()
function logOut() {
  store.logout()
  toast.info("Logout efetuado com sucesso!")
}
</script>
