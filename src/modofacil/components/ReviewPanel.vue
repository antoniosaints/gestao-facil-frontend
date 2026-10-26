<script setup lang="ts">
import { ClipboardCheck } from 'lucide-vue-next'
defineProps<{ title?: string }>()
</script>
<template>
  <section
    class="col-span-full min-w-0 space-y-3 rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 sm:p-5"
  >
    <h2 class="flex items-start gap-2 !text-sm text-foreground">
      <ClipboardCheck
        :size="18"
        class="mt-0.5 shrink-0 text-blue-600 dark:text-blue-300"
        aria-hidden="true"
      /><span
        ><slot name="title">{{ title || 'Confira antes de confirmar' }}</slot></span
      >
    </h2>
    <slot />
  </section>
</template>
