<script setup lang="ts">
import { AlertCircle } from 'lucide-vue-next'
import type { ConfirmationOptions } from '../application/confirmation'
import ModalDialog from './ModalDialog.vue'
defineProps<{ options: ConfirmationOptions }>()
const emit = defineEmits<{ resolve: [confirmed: boolean] }>()
</script>
<template>
  <ModalDialog :title="options.title" size="sm" @close="emit('resolve', false)">
    <div
      class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/15 text-orange-500"
    >
      <AlertCircle :size="32" :stroke-width="1.7" aria-hidden="true" />
    </div>
    <p class="text-center text-muted-foreground">{{ options.description }}</p>
    <template #footer>
      <button type="button" autofocus class="!bg-muted/50" @click="emit('resolve', false)">
        Cancelar
      </button>
      <button
        type="button"
        :class="
          options.danger
            ? '!border-red-600 !bg-red-600 !text-white hover:!bg-red-700'
            : '!border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700'
        "
        @click="emit('resolve', true)"
      >
        {{ options.confirmLabel || 'Confirmar' }}
      </button>
    </template>
  </ModalDialog>
</template>
