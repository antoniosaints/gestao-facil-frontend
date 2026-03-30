import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { FaturaContaAdmin } from '@/repositories/conta-repository'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  ArrowUpDown,
  CalendarClock,
  CircleCheck,
  CircleDollarSign,
  CircleOff,
  CreditCard,
  Loader,
} from 'lucide-vue-next'
import Actions from './Actions.vue'

function getStatusBadge(status: FaturaContaAdmin['status']) {
  if (status === 'PAGO') return { color: 'green' as const, icon: CircleCheck }
  if (status === 'ATRASADO') return { color: 'red' as const, icon: CircleOff }
  if (status === 'CANCELADO') return { color: 'gray' as const, icon: CircleOff }
  return { color: 'yellow' as const, icon: Loader }
}

export const columnsFaturasAdmin: ColumnDef<FaturaContaAdmin>[] = [
  {
    accessorKey: 'Uid',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Fatura', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.Uid,
        color: 'gray',
        icon: CreditCard,
        capitalize: false,
      }),
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
      const badge = getStatusBadge(row.original.status)
      return render(BadgeCell, {
        label: row.original.status,
        color: badge.color,
        icon: badge.icon,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'conta',
    enableSorting: false,
    header: () => 'Conta',
    cell: ({ row }) =>
      render('div', { class: 'space-y-1 min-w-[240px]' }, [
        render('div', { class: 'font-medium text-foreground' }, row.original.conta.nomeFantasia || row.original.conta.nome),
        render('div', { class: 'text-xs text-muted-foreground' }, row.original.conta.email),
      ]),
  },
  {
    accessorKey: 'vencimento',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Vencimento', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatDateToPtBR(row.original.vencimento),
        color: row.original.diasParaVencer < 0 ? 'red' : 'gray',
        icon: CalendarClock,
        capitalize: false,
      }),
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
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatCurrencyBR(row.original.valor),
        color: 'green',
        icon: CircleDollarSign,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) =>
      render('div', { class: 'text-right' }, [render(Actions, { data: { ...row.original } })]),
  },
]
