import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { CobrancaFinanceira } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Ban, Calendar, CircleCheck, FileBox, Link2, Loader } from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import Actions from './Actions.vue'
import { formatCurrencyBR } from '@/utils/formatters'

export const columnsCobrancas: ColumnDef<CobrancaFinanceira>[] = [
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
      let icon = Loader
      let color: 'yellow' | 'green' | 'red' | 'blue' | 'gray' = 'gray'
      switch (row.original.status) {
        case 'PENDENTE':
          icon = Loader
          color = 'yellow'
          break
        case 'EFETIVADO':
          icon = CircleCheck
          color = 'green'
          break
        case 'CANCELADO':
          icon = Ban
          color = 'red'
          break
        case 'ESTORNADO':
          icon = Link2
          color = 'blue'
          break
      }
      return render(BadgeCell, {
        label: row.original.status,
        color: color,
        icon: icon,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'observacao',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Observação', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
  },
  {
    accessorKey: 'dataVencimento',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Vencimento', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: row.original.dataVencimento
          ? new Date(row.original.dataVencimento).toLocaleDateString()
          : '-',
        color: 'gray',
        icon: Calendar,
        capitalize: true,
      })
    },
  },
  {
    accessorKey: 'valor',
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
        label: formatCurrencyBR((row.original.valor as number) || 0),
        color: 'green',
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'gateway',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Gateway', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: row.original.gateway,
        color: 'blue',
        icon: Link2,
        capitalize: true,
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
