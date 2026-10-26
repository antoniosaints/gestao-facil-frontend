<script setup lang="ts">
import ListLoading from './ListLoading.vue'
import { Inbox } from 'lucide-vue-next'
import type { Row } from '../adapters/domain'
defineProps<{
  rows: Row[]
  columns: { key: string; label: string; right?: boolean }[]
  caption: string
  loading?: boolean
  failed?: boolean
  empty?: string
}>()
</script>
<template>
  <div
    :aria-busy="loading"
    class="relative min-w-0 [&_td_button]:!min-h-7 [&_td_button]:!h-7 [&_td_button]:!px-2 [&_td_a]:!min-h-7 [&_td_a]:!py-1 [&_td_small]:!inline [&_td_small]:ml-1.5 [&_td_small]:!text-[10px] [&_td_small]:leading-none"
  >
    <ListLoading v-if="loading && !rows.length" :columns="columns.length" />
    <div
      v-if="loading && rows.length"
      role="status"
      aria-label="Atualizando registros…"
      class="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-blue-500 motion-safe:animate-pulse"
    >
      <span class="sr-only">Atualizando registros…</span>
    </div>
    <div
      v-show="!loading || rows.length"
      class="hidden overflow-x-auto rounded-[6px] border border-border md:block"
    >
      <table class="w-full min-w-[640px] border-collapse text-left text-xs">
        <caption class="sr-only">
          {{
            caption
          }}
        </caption>
        <thead class="bg-muted/50 text-muted-foreground">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="px-3 py-2 font-medium"
              :class="column.right ? 'text-right' : ''"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <tr v-for="row in rows" :key="row.id" class="hover:bg-muted/70">
            <td
              v-for="column in columns"
              :key="column.key"
              class="max-w-sm break-words px-3 py-1 leading-snug text-foreground/90"
              :class="column.right ? 'text-right' : ''"
            >
              <slot :name="column.key" :row="row">{{ row[column.key] ?? '—' }}</slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <ul
      v-show="!loading || rows.length"
      class="grid list-none gap-2 md:hidden"
      :aria-label="caption"
    >
      <li
        v-for="row in rows"
        :key="row.id"
        class="grid min-w-0 grid-cols-2 gap-x-3 gap-y-1.5 rounded-[6px] border border-border bg-card p-3"
      >
        <div
          v-for="column in columns"
          :key="column.key"
          class="min-w-0 break-words"
          :class="column.key === 'actions' ? 'col-span-2' : ''"
        >
          <span
            class="mb-0.5 block text-[11px] text-muted-foreground"
            :class="column.key === 'actions' ? 'sr-only' : ''"
            >{{ column.label }}</span
          >
          <div class="text-xs leading-snug text-foreground/90">
            <slot :name="column.key" :row="row">{{ row[column.key] ?? '—' }}</slot>
          </div>
        </div>
      </li>
    </ul>
    <div
      v-if="!loading && !failed && !rows.length"
      class="flex flex-col items-center gap-2 rounded-[6px] border border-dashed border-border px-4 py-6 text-center text-muted-foreground"
    >
      <Inbox :size="28" :stroke-width="1.4" aria-hidden="true" />
      <p class="!mb-0 text-muted-foreground">{{ empty || 'Nenhum registro encontrado.' }}</p>
      <span class="text-xs">Ajuste a busca ou os filtros para tentar novamente.</span>
    </div>
  </div>
</template>
