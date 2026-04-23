import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { ContasFinanceiro } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Wallet } from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import Actions from './Actions.vue'
import { formatCurrencyBR } from '@/utils/formatters'

export const columnsContasFinanceiras: ColumnDef<ContasFinanceiro>[] = [
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
        icon: Wallet,
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
        () => ['Conta', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
  },
  {
    accessorKey: 'saldoInicial',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Saldo inicial', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatCurrencyBR(Number(row.original.saldoInicial || 0)),
        color: 'gray',
        capitalize: false,
      }),
  },
  {
    accessorKey: 'saldoAtual',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Saldo atual', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatCurrencyBR(Number(row.original.saldoAtual || 0)),
        color: Number(row.original.saldoAtual || 0) >= 0 ? 'green' : 'red',
        capitalize: false,
      }),
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
