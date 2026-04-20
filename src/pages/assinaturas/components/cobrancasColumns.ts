import { Button } from '@/components/ui/button'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { render } from '@/lib/utils'
import type { AssinaturaCicloListItem } from '@/repositories/assinatura-repository'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, CalendarClock, CircleDollarSign, ReceiptText, UserRound } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { getStatusCicloMeta } from '../shared'

export const columnsCobrancasAssinatura: ColumnDef<AssinaturaCicloListItem>[] = [
  {
    accessorKey: 'referencia',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Referência', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.referencia,
        color: 'gray',
        icon: CalendarClock,
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
      const status = getStatusCicloMeta(row.original.status)
      const color =
        row.original.status === 'PAGO'
          ? 'green'
          : row.original.status === 'ATRASADO'
            ? 'red'
            : row.original.status === 'COBRADO'
              ? 'blue'
              : row.original.status === 'FALHA'
                ? 'orange'
                : row.original.status === 'CANCELADO'
                  ? 'gray'
                  : 'yellow'

      return render(BadgeCell, {
        label: status.label,
        color,
        icon: ReceiptText,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'assinatura',
    header: () => render('div', {}, 'Contrato / cliente'),
    cell: ({ row }) =>
      render('div', { class: 'space-y-1' }, [
        render('div', { class: 'font-medium text-foreground' }, row.original.assinatura.nomeContrato),
        render(BadgeCell, {
          label: row.original.assinatura.cliente,
          color: 'blue',
          icon: UserRound,
          capitalize: false,
          size: 'sm',
        }),
      ]),
    enableSorting: false,
  },
  {
    accessorKey: 'valorCobrado',
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
        label: formatCurrencyBR(row.original.valorCobrado),
        color: 'green',
        icon: CircleDollarSign,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'inicioPeriodo',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Período inicial', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => render('div', {}, formatDateToPtBR(row.original.inicioPeriodo)),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Criada em', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => render('div', {}, formatDateToPtBR(row.original.createdAt, true)),
  },
  {
    id: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) =>
      render('div', { class: 'text-right' }, [
        render(
          RouterLink,
          { to: `/assinaturas/assinaturas/${row.original.assinatura.id}` },
          () => render(Button, { variant: 'outline', size: 'sm' }, () => 'Abrir assinatura'),
        ),
      ]),
  },
]
