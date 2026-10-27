<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>
<template>
  <section
    class="col-span-full min-w-0 space-y-4 rounded-lg border border-border bg-card p-4 sm:p-5"
  >
    <div class="space-y-1">
      <h2 class="!mb-0 !text-sm font-semibold">{{ title }}</h2>
      <p v-if="description" class="!mb-0 !text-xs text-muted-foreground">{{ description }}</p>
    </div>
    <div class="grid grid-cols-1 items-start gap-4 sm:grid-cols-2"><slot /></div>
  </section>
</template>
