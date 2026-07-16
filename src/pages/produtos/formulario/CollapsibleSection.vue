<template>
  <div class="rounded-xl border border-border/70 bg-background/40 dark:bg-background/20">
    <button type="button"
      class="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      @click="open = !open">
      <span class="flex items-center gap-2 text-sm font-medium text-foreground">
        <component :is="icon" v-if="icon" class="h-4 w-4 text-primary" />
        {{ title }}
      </span>
      <ChevronDown class="h-4 w-4 text-muted-foreground transition-transform duration-200"
        :class="{ 'rotate-180': open }" />
    </button>
    <div v-show="open" class="border-t border-border/60 px-4 py-4">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronDown, type LucideIcon } from 'lucide-vue-next'

defineProps<{
  title: string
  icon?: LucideIcon
}>()

const open = defineModel<boolean>('open', { default: true })
</script>
