<template>
  <div v-if="isOpen"
    class="fixed inset-0 bg-black/70 flex items-center animate-in fade-in duration-300 justify-center z-50"
    @click="onNo">
    <div class="bg-white dark:bg-gray-900 border rounded-lg shadow-lg p-6 w-full max-w-sm">
      <div class="flex items-center mb-4 space-x-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24"
          stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M12 9v2m0 4h.01M12 5a7 7 0 110 14 7 7 0 010-14z" />
        </svg>
        <h2 class="text-lg text-gray-800 dark:text-gray-100">{{ title }}</h2>
      </div>

      <p class="text-gray-600 dark:text-gray-300 mb-6">{{ message }}</p>

      <div class="flex justify-end space-x-3">
        <button @click="onNo" class="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800">
          {{ cancelText }}
        </button>
        <button @click="onYes" class="px-4 py-2 rounded-lg text-white" :class="[colorMap(color)]">
          {{ confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm';

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
