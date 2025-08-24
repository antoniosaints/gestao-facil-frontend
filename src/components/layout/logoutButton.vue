<template>
  <div class="space-y-2">
    <button @click="logOut()"
      class="cursor-pointer w-full border border-border mt-2 px-4 hover:bg-gray-200 dark:hover:bg-gray-800 dark:bg-background-dark dark:border-border-dark p-2 rounded-lg transition flex items-center">
      <i class="fa-solid fa-right-from-bracket text-red-600 mr-2"></i> Sair
    </button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/login/useAuthStore';
const store = useAuthStore();

function logOut() {
  store.logout()
}
</script>
