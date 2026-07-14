<script setup lang="ts">
import { Switch } from '@/components/ui/switch'

defineProps<{
  modelValue: boolean
  title: string
  description?: string
}>()

defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
</script>

<template>
  <label
    class="flex cursor-pointer items-center justify-between gap-4 rounded-lg border bg-card px-4 py-3 transition hover:border-primary/40 hover:bg-muted/40"
  >
    <span class="min-w-0">
      <span class="block text-sm font-medium text-foreground">{{ title }}</span>
      <span v-if="description" class="mt-0.5 block text-xs text-muted-foreground">{{ description }}</span>
    </span>
    <Switch
      :model-value="modelValue"
      class="shrink-0"
      @update:model-value="$emit('update:modelValue', $event)"
    />
  </label>
</template>
