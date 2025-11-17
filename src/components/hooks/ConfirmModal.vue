<template>
  <ModalView v-model:open="isOpen" :title="title" :description="message" :icon="BadgeInfo" size="sm">
    <div class="flex justify-end space-x-3 px-4">
      <button @click="onNo" class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800">
        {{ cancelText }}
      </button>
      <button @click="onYes" class="px-4 py-2 rounded-lg text-white" :class="[colorMap(color)]">
        {{ confirmText }}
      </button>
    </div>
  </ModalView>
</template>

<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm';
import ModalView from '../formulario/ModalView.vue';
import { BadgeInfo } from 'lucide-vue-next';

const colorMap = (color: string) => {
  switch (color) {
    case 'info':
      return 'bg-info hover:bg-info/80'
    case 'warning':
      return 'bg-warning hover:bg-warning/80'
    case 'danger':
      return 'bg-danger hover:bg-danger/80'
    case 'success':
      return 'bg-green-600 hover:bg-green-600/80 dark:bg-green-800 dark:hover:bg-green-800/80'
    default:
      return 'bg-primary hover:bg-primary/80'
  }
}

const { isOpen, title, message, cancelText, confirmText, onYes, onNo, color } = useConfirm()
</script>
