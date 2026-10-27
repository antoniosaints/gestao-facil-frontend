<script setup lang="ts">
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableCaption,
} from '@/components/ui/table'
import ListLoading from './ListLoading.vue'
import { Inbox } from 'lucide-vue-next'
import type { Row } from '../adapters/domain'
withDefaults(
  defineProps<{
    rows: Row[]
    columns: { key: string; label: string; right?: boolean }[]
    caption: string
    loading?: boolean
    failed?: boolean
    empty?: string
    minWidth?: number
    mobileLayout?: 'cards' | 'table'
  }>(),
  { minWidth: 640, mobileLayout: 'cards' },
)
</script>
<template>
  <div
    :aria-busy="loading"
    class="relative min-w-0 [&_td_button]:!min-h-8 [&_td_button]:!px-2.5 [&_td_a]:!min-h-8 [&_td_a]:!py-1 [&_td_small]:mt-0.5 [&_td_small]:!text-xs"
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
      v-show="rows.length"
      class="overflow-x-auto rounded-lg border border-border bg-card"
      :class="mobileLayout === 'cards' ? 'hidden md:block' : ''"
    >
      <Table class="text-left text-sm" :style="{ minWidth: `${minWidth}px` }">
        <TableCaption class="sr-only">
          {{ caption }}
        </TableCaption>
        <TableHeader class="bg-muted/50 text-muted-foreground">
          <TableRow>
            <TableHead
              v-for="column in columns"
              :key="column.key"
              scope="col"
              class="h-12 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em]"
              :class="column.right ? 'text-right' : ''"
            >
              {{ column.label }}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody class="[&_tr:last-child]:border-0">
          <TableRow v-for="(row, index) in rows" :key="row.id ?? index" class="hover:bg-muted/50">
            <TableCell
              v-for="column in columns"
              :key="column.key"
              class="max-w-sm break-words px-4 py-3 leading-snug text-foreground/90"
              :class="column.right ? 'text-right' : ''"
            >
              <slot :name="column.key" :row="row">{{ row[column.key] ?? '—' }}</slot>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
    <ul
      v-if="mobileLayout === 'cards'"
      v-show="rows.length"
      class="grid list-none gap-2 md:hidden"
      :aria-label="caption"
    >
      <li
        v-for="(row, index) in rows"
        :key="row.id ?? index"
        class="grid min-w-0 grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-border bg-card p-4"
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
