<script setup lang="ts">
import { computed } from 'vue'
import type { Column } from '@tanstack/vue-table'
import { ArrowDown, ArrowUp, ArrowUpDown, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

defineOptions({ inheritAttrs: false })
const props = defineProps<{ column: Column<any>; title: string }>()
// A ordenação é feita pela API: colunas por ID (ex.: vencimento) dispensam accessorFn.
const canSort = computed(() => props.column.columnDef.enableSorting !== false)
const direction = computed(() => props.column.getIsSorted())
const description = computed(() =>
  direction.value === 'asc'
    ? 'ordem crescente'
    : direction.value === 'desc'
      ? 'ordem decrescente'
      : 'sem ordenação',
)

function setDirection(value: string) {
  if (value === 'none') props.column.clearSorting()
  else if (value === 'asc' || value === 'desc') props.column.toggleSorting(value === 'desc', false)
}
</script>

<template>
  <DropdownMenu v-if="canSort">
    <DropdownMenuTrigger as-child>
      <Button
        v-bind="$attrs"
        type="button"
        variant="ghost"
        size="sm"
        class="gap-2 whitespace-nowrap"
        :class="
          direction
            ? 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/15 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-300'
            : ''
        "
        :aria-label="`${title}: ${description}. Opções de ordenação`"
        :title="`${title}: ${description}`"
        :data-sort-direction="direction || 'none'"
      >
        {{ title }}
        <ArrowUp v-if="direction === 'asc'" class="size-4 shrink-0" aria-hidden="true" />
        <ArrowDown v-else-if="direction === 'desc'" class="size-4 shrink-0" aria-hidden="true" />
        <ArrowUpDown v-else class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" class="min-w-52">
      <DropdownMenuLabel>Ordenar por {{ title }}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup :model-value="direction || 'none'" @update:model-value="setDirection">
        <DropdownMenuRadioItem value="asc" class="min-h-10 gap-2 cursor-pointer">
          <ArrowUp class="size-4" aria-hidden="true" /> Crescente (ASC)
        </DropdownMenuRadioItem>
        <DropdownMenuRadioItem value="desc" class="min-h-10 gap-2 cursor-pointer">
          <ArrowDown class="size-4" aria-hidden="true" /> Decrescente (DESC)
        </DropdownMenuRadioItem>
        <DropdownMenuSeparator />
        <DropdownMenuRadioItem value="none" class="min-h-10 gap-2 cursor-pointer">
          <X class="size-4" aria-hidden="true" /> Remover ordenação
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
  <span v-else v-bind="$attrs">{{ title }}</span>
</template>
