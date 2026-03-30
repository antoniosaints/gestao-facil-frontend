import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { CategoriaFinanceiro } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, FolderTree, Tags } from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import Actions from './Actions.vue'

export const columnsCategorias: ColumnDef<CategoriaFinanceiro>[] = [
  {
    accessorKey: 'Uid',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['ID', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.Uid || `#${row.original.id}`,
        color: 'gray',
        icon: Tags,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'nome',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Categoria', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
  },
  {
    accessorKey: 'parentId',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Tipo', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.parentId ? 'Filha' : 'Pai',
        color: row.original.parentId ? 'blue' : 'green',
        icon: row.original.parentId ? FolderTree : Tags,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'categoriaPai',
    enableSorting: false,
    header: () => render('div', { class: 'text-left' }, 'Categoria pai'),
    cell: ({ row }) => render('div', { class: 'text-left' }, row.original.Parent?.nome || '-'),
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) => render('div', { class: 'text-right' }, [render(Actions, { data: { ...row.original } })]),
  },
]
