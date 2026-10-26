<script setup lang="ts">
import { AlertCircle, CheckCircle2, LoaderCircle } from 'lucide-vue-next'
defineProps<{ loading?: boolean; error?: string; message?: string }>()
defineEmits<{ retry: [] }>()
</script>
<template>
  <div v-if="loading || error || message" class="min-w-0 space-y-3">
    <p
      v-if="loading"
      class="!mb-0 flex items-center gap-2 rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-3 text-blue-800 dark:text-blue-300"
      role="status"
    >
      <LoaderCircle :size="17" class="shrink-0 animate-spin" aria-hidden="true" />Carregando
      informações…
    </p>
    <div
      v-if="error"
      class="flex min-w-0 flex-col gap-3 rounded-[6px] border border-red-500/30 bg-red-500/10 p-4 text-red-800 dark:text-red-300 sm:flex-row sm:items-start"
      role="alert"
    >
      <AlertCircle :size="18" class="shrink-0" aria-hidden="true" />
      <p class="!mb-0 min-w-0 flex-1 break-words">{{ error }}</p>
      <button
        type="button"
        :disabled="loading"
        class="shrink-0 !border-red-500/30 !bg-card !text-red-700 dark:!text-red-300"
        @click="$emit('retry')"
      >
        Tentar novamente
      </button>
    </div>
    <p
      v-if="message"
      class="!mb-0 flex items-start gap-2 rounded-[6px] border border-emerald-500/30 bg-emerald-500/10 p-3 text-emerald-800 dark:text-emerald-300"
      role="status"
    >
      <CheckCircle2 :size="18" class="shrink-0" aria-hidden="true" /><span
        class="min-w-0 break-words"
        >{{ message }}</span
      >
    </p>
  </div>
</template>
