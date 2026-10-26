<script setup lang="ts">
import { ArrowLeft } from 'lucide-vue-next'
import type { RouteLocationRaw } from 'vue-router'
defineProps<{ title?: string; description?: string; back?: RouteLocationRaw; backLabel?: string }>()
</script>
<template>
  <header class="space-y-3">
    <slot name="back"
      ><RouterLink
        v-if="back"
        :to="back"
        class="inline-flex min-h-10 items-center gap-2 text-xs font-medium"
        ><ArrowLeft :size="15" aria-hidden="true" />{{ backLabel || 'Voltar' }}</RouterLink
      ></slot
    >
    <div class="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0">
        <h1 class="break-words !text-xl sm:!text-2xl">
          <slot name="title">{{ title }}</slot>
        </h1>
        <p v-if="description || $slots.description" class="!mb-0 text-muted-foreground">
          <slot name="description">{{ description }}</slot>
        </p>
      </div>
      <div v-if="$slots.actions" class="flex shrink-0 flex-wrap items-center gap-2">
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
