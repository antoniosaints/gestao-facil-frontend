import { Button } from '@/components/ui/button'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { render } from '@/lib/utils'
import type { AssinaturaCicloListItem } from '@/repositories/assinatura-repository'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  ArrowUpDown,
  CalendarClock,
  CircleDollarSign,
  ExternalLink,
  ReceiptText,
  UserRound,
} from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { getStatusCicloMeta } from '../shared'
import CobrancasActions from './CobrancasActions.vue'

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
      render('div', { class: 'space-y-1' }, [
        render(BadgeCell, {
          label: formatCurrencyBR(row.original.valorCobrado),
          color: 'green',
          icon: CircleDollarSign,
          capitalize: false,
        }),
        row.original.cobranca?.idCobranca
          ? render('div', { class: 'text-xs text-muted-foreground' }, `Ref. gateway: ${row.original.cobranca.idCobranca}`)
          : null,
      ]),
  },
  {
    accessorKey: 'cobranca',
    header: () => render('div', {}, 'Gateway / link'),
    cell: ({ row }) => {
      if (!row.original.cobranca) {
        return render('div', { class: 'text-sm text-muted-foreground' }, 'Sem cobrança vinculada')
      }

      return render('div', { class: 'space-y-1' }, [
        render('div', { class: 'text-sm font-medium text-foreground' }, row.original.cobranca.gateway),
        render('div', { class: 'text-xs text-muted-foreground' }, row.original.tipoCobrancaUsado || '-'),
        row.original.cobranca.externalLink
          ? render(
              'a',
              {
                href: row.original.cobranca.externalLink,
                target: '_blank',
                rel: 'noreferrer',
                class: 'inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2',
              },
              [render(ExternalLink, { class: 'h-3.5 w-3.5' }), 'Abrir cobrança'],
            )
          : null,
      ])
    },
    enableSorting: false,
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
      render('div', { class: 'flex items-center justify-end gap-2' }, [
        render(
          RouterLink,
          { to: `/assinaturas/assinaturas/${row.original.assinatura.id}` },
          () => render(Button, { variant: 'outline', size: 'sm' }, () => 'Abrir assinatura'),
        ),
        render(CobrancasActions, { data: row.original }),
      ]),
  },
]
