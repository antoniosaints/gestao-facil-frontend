<script setup lang="ts">
import {
  FlexRender,
  getCoreRowModel,
  useVueTable,
} from "@tanstack/vue-table"

import { ChevronDown } from "lucide-vue-next"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { valueUpdater } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useServerTable } from "@/composables/useServerTable"
import { columnsProdutos } from "./columnDef"

const colunas = columnsProdutos;

const {
  data,
  pageIndex,
  pageSize,
  totalPages,
  sorting,
  columnVisibility,
  rowSelection,
  search
} = useServerTable("/vendas", colunas);
// ---- Tabela ----
const table = useVueTable({
  data: data,
  columns: colunas,
  getCoreRowModel: getCoreRowModel(),
  manualPagination: true,
  manualSorting: true,
  pageCount: totalPages.value,
  onSortingChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, sorting),
  onColumnVisibilityChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: (updaterOrValue) =>
    valueUpdater(updaterOrValue, rowSelection),
  state: {
    get sorting() {
      return sorting.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get rowSelection() {
      return rowSelection.value
    },
    get pagination() {
      return { pageIndex: pageIndex.value, pageSize: pageSize.value }
    },
  },
})
</script>

<template>
  <div class="w-full">
    <!-- Busca e menu -->
    <div class="flex items-center py-4">
      <Input class="max-w-sm" placeholder="Buscar registro..." v-model="search" />
      <div class="ml-auto flex items-center space-x-2">
        <Select v-model="pageSize">
          <SelectTrigger>
            <SelectValue placeholder="Registros por página" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="10">
              10
            </SelectItem>
            <SelectItem :value="50">
              50
            </SelectItem>
            <SelectItem :value="100">
              100
            </SelectItem>
          </SelectContent>
        </Select>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" class="ml-auto">
              Colunas
              <ChevronDown class="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem v-for="column in table
              .getAllColumns()
              .filter((column) => column.getCanHide())" :key="column.id" class="capitalize"
              :model-value="column.getIsVisible()" @update:model-value="(value) => column.toggleVisibility(!!value)">
              {{ column.id }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Tabela -->
    <div class="rounded-md border">
      <Table>
        <TableHeader class="bg-gray-100 dark:bg-gray-800">
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header"
                :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="data.length">
            <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-else>
            <TableCell :colspan="colunas.length" class="h-24 text-center">
              Nenhum resultado encontrado.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Paginação -->
    <div class="flex items-center justify-end space-x-2 py-4">
      <div class="flex-1 text-sm text-muted-foreground">
        Página {{ pageIndex + 1 }} de {{ totalPages }}
      </div>
      <div class="space-x-2">
        <Button variant="outline" size="sm" :disabled="pageIndex === 0" @click="pageIndex = Math.max(pageIndex - 1, 0)">
          Anterior
        </Button>
        <Button variant="outline" size="sm" :disabled="pageIndex >= totalPages - 1"
          @click="pageIndex = Math.min(pageIndex + 1, totalPages - 1)">
          Próximo
        </Button>
      </div>
    </div>
  </div>
</template>
