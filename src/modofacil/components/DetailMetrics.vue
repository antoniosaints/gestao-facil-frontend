<script setup lang="ts">
defineProps<{
  label: string
  metrics: { label: string; value: string; hint?: string; tone?: string }[]
}>()
</script>
<template>
  <div class="grid grid-cols-2 gap-3 xl:grid-cols-4" :aria-label="label">
    <section
      v-for="metric in metrics"
      :key="metric.label"
      class="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4"
    >
      <p class="!mb-2 !text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
        {{ metric.label }}
      </p>
      <p class="!mb-1 !text-xl font-semibold tracking-tight" :class="metric.tone">
        {{ metric.value }}
      </p>
      <small v-if="metric.hint">{{ metric.hint }}</small>
    </section>
  </div>
</template>
