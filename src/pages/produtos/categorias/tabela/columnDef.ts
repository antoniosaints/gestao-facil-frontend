import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { render } from '@/lib/utils'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import type { ProdutoCategoria } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Tags } from 'lucide-vue-next'
import Actions from './Actions.vue'

const store = useProdutoStore()

function selectAllHeader({ table }: { table: any }) {
  const categoryIds = (): number[] => table.getRowModel().rows
    .map((row: any) => row.original.id)
    .filter((id: unknown): id is number => typeof id === 'number')
  const ids = categoryIds()
  const allSelected = ids.length > 0 && ids.every((id) => store.selectedCategoriaIds.includes(id))
  const someSelected = ids.some((id) => store.selectedCategoriaIds.includes(id))
  return render(Checkbox, {
    modelValue: allSelected ? true : someSelected ? 'indeterminate' : false,
    'onUpdate:modelValue': (value: boolean | string) => {
      table.getRowModel().rows.forEach((row: any) => row.toggleSelected(!!value))
      if (value) categoryIds().forEach((id) => store.addSelectedCategoriaId(id))
      else categoryIds().forEach((id) => store.removeSelectedCategoriaId(id))
    },
    ariaLabel: 'Selecionar todas as categorias',
  })
}

export const columnsCategoriasProduto: ColumnDef<ProdutoCategoria>[] = [
  {
    id: 'select',
    header: selectAllHeader,
    cell: ({ row }) => render(Checkbox, {
      modelValue: store.selectedCategoriaIds.includes(row.original.id!),
      'onUpdate:modelValue': (value: boolean | string) => {
        row.toggleSelected(!!value)
        if (value) store.addSelectedCategoriaId(row.original.id!)
        else store.removeSelectedCategoriaId(row.original.id!)
      },
      ariaLabel: `Selecionar categoria ${row.original.nome}`,
    }),
    enableSorting: false,
    enableHiding: false,
  },
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
        label: `${row.original.Uid || `#${row.original.id}`}`,
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
    accessorKey: 'status',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Status', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: `${row.original.status || 'ATIVO'}`,
        color: row.original.status === 'INATIVO' ? 'red' : 'green',
      }),
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row, table }) =>
      render('div', { class: 'text-right' }, [render(Actions, { data: { ...row.original }, table })]),
  },
]
