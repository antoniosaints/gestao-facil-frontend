<script setup lang="ts">
withDefaults(defineProps<{ cards?: boolean; columns?: number; label?: string }>(), {
  columns: 5,
  label: 'Carregando registros…',
})
</script>
<template>
  <div role="status" :aria-label="label" aria-live="polite" class="min-w-0">
    <span class="sr-only">{{ label }}</span>
    <div
      v-if="cards"
      aria-hidden="true"
      class="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <div
        v-for="index in 8"
        :key="index"
        class="space-y-3 rounded-lg border border-border bg-card p-3 motion-safe:animate-pulse"
      >
        <div class="h-32 rounded-md bg-muted" />
        <div class="h-3 w-4/5 rounded bg-muted" />
        <div class="h-2 w-2/3 rounded bg-muted" />
        <div class="h-2 w-1/2 rounded bg-muted" />
        <div class="pt-2">
          <div class="h-4 w-1/2 rounded bg-muted" />
          <div class="mt-2 h-4 w-2/3 rounded bg-muted" />
        </div>
      </div>
    </div>
    <template v-else>
      <div
        aria-hidden="true"
        class="hidden overflow-hidden rounded-md border border-border md:block motion-safe:animate-pulse"
      >
        <table class="w-full table-fixed border-collapse">
          <thead class="bg-muted/50">
            <tr>
              <th v-for="column in columns" :key="column" class="px-3 py-3">
                <div class="h-2.5 w-2/3 rounded bg-muted" />
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            <tr v-for="row in 6" :key="row">
              <td v-for="column in columns" :key="column" class="px-3 py-3">
                <div class="h-3 rounded bg-muted" :class="row % 2 ? 'w-4/5' : 'w-2/3'" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div aria-hidden="true" class="grid gap-2 md:hidden motion-safe:animate-pulse">
        <div
          v-for="row in 3"
          :key="row"
          class="grid grid-cols-2 gap-3 rounded-md border border-border bg-card p-3"
        >
          <div v-for="column in 6" :key="column" class="space-y-2">
            <div class="h-2 w-1/3 rounded bg-muted" />
            <div class="h-3 w-4/5 rounded bg-muted" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
