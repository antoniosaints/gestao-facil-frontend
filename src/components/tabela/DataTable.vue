<template>
    <div class="w-full">
        <!-- Busca e menu -->
        <div class="flex items-center py-4">
            <Input class="max-w-sm bg-card" placeholder="Buscar registro..." v-model="search" />
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
                            Mostrar
                            <ChevronDown class="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuCheckboxItem v-for="column in table
                            .getAllColumns()
                            .filter((column) => column.getCanHide())" :key="column.id" class="capitalize"
                            :model-value="column.getIsVisible()"
                            @update:model-value="(value: boolean) => column.toggleVisibility(!!value)">
                            {{ column.id }}
                        </DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>

        <!-- Tabela -->
        <div class="rounded-md border overflow-x-auto">
            <Table class="min-w-full">
                <TableHeader class="bg-gray-100 dark:bg-gray-800">
                    <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                        <TableHead v-for="(header, i) in headerGroup.headers" :key="header.id" :class="[
                            i === headerGroup.headers.length - 1
                                ? 'sticky right-0 bg-gray-100 dark:bg-gray-800 z-10'
                                : ''
                        ]">
                            <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header"
                                :props="header.getContext()" />
                        </TableHead>
                    </TableRow>
                </TableHeader>

                <TableBody>
                    <template v-if="data.length">
                        <TableRow v-for="row in table.getRowModel().rows" :key="row.id">
                            <TableCell v-for="(cell, i) in row.getVisibleCells()" :key="cell.id" :class="[
                                i === row.getVisibleCells().length - 1
                                    ? 'sticky right-0 bg-gray-50 dark:bg-gray-900 z-10'
                                    : ''
                            ]">
                                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                            </TableCell>
                        </TableRow>
                    </template>

                    <TableRow v-else>
                        <TableCell :colspan="columns.length" class="h-24 text-center">
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
                <Button variant="outline" size="sm" :disabled="pageIndex === 0"
                    @click="pageIndex = Math.max(pageIndex - 1, 0)">
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

<script setup lang="ts">
import { useServerTable } from '@/composables/useServerTable';
import { FlexRender, type ColumnDef } from '@tanstack/vue-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Input } from '../ui/input';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import { ChevronDown } from 'lucide-vue-next';

const { columns, api } = defineProps<{ columns: ColumnDef<any>[], api: string }>()

const {
    data,
    pageIndex,
    pageSize,
    totalPages,
    search,
    table
} = useServerTable(api, columns);
</script>