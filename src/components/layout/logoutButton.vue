<template>
  <div class="space-y-2">
    <button @click="logOut()"
      class="cursor-pointer w-full gap-2 px-4 p-2 rounded-xl transition-[background-color,transform] flex items-center"
      :class="colorTheme">
      <i class="fa-solid fa-right-from-bracket text-red-600 mr-2"></i> Sair
    </button>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/login/useAuthStore';
import { computed } from 'vue';
import { useToast } from 'vue-toastification';
const props = withDefaults(defineProps<{ variant?: 'sidebar' | 'header' }>(), {
  variant: 'sidebar',
})
const store = useAuthStore();
const toast = useToast()
function logOut() {
  store.logout()
  toast.info("Logout efetuado com sucesso!")
}

const colorTheme = computed(() => {
  return props.variant === 'header'
    ? 'border border-border bg-card text-foreground hover:bg-muted'
    : 'bg-black/10 text-sidebar-foreground'
})
</script>
