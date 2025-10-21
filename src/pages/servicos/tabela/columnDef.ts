import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { Servicos } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Ban, CircleCheck, FileBox } from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import Actions from './Actions.vue'
import { formatCurrencyBR } from '@/utils/formatters'
import { Checkbox } from '@/components/ui/checkbox'
import { useServicoStore } from '@/stores/servicos/useServicos'
const store = useServicoStore()

export const columnsServicos: ColumnDef<Servicos>[] = [
  {
    id: 'select',
    header: ({ table }) => render('div', {}, ''),
    cell: ({ row }) =>
      render(Checkbox, {
        modelValue: store.selectedIds.includes(row.original.id!),
        'onUpdate:modelValue': (value: boolean | string) => {
          row.toggleSelected(!!value)
          if (value) store.addSelectedId(row.original.id!)
          else store.removeSelectedId(row.original.id!)
        },
        ariaLabel: 'Select row',
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
        () => ['Status', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: row.original.Uid!,
        color: 'gray',
        icon: FileBox,
        capitalize: false,
      })
    },
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
        () => ['Nome', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
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
    cell: ({ row }) => {
      const tipo = row.original.status ? CircleCheck : Ban
      const label = row.original.status ? 'Ativo' : 'Inativo'
      const color = row.original.status ? 'green' : 'red'
      return render(BadgeCell, {
        label,
        color,
        icon: tipo,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'preco',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Valor', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: formatCurrencyBR((row.original.preco as number) || 0),
        color: 'green',
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row, table }) => {
      return render('div', { class: 'text-right' }, [
        render(Actions, { data: { ...row.original } }),
      ])
    },
  },
]
