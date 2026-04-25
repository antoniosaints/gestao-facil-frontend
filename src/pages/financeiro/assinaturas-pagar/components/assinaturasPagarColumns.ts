import { render } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/vue-table'
import type { AssinaturaPagarListItem } from '@/repositories/assinatura-pagar-repository'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, CalendarDays, Link2, ReceiptText, Repeat2, Sparkles } from 'lucide-vue-next'
import { formatCurrencyBR } from '@/utils/formatters'
import { formatDate } from 'date-fns'
import AssinaturasPagarActions from './AssinaturasPagarActions.vue'

function statusColor(status: AssinaturaPagarListItem['status']) {
  if (status === 'ATIVA') return 'green'
  if (status === 'INATIVA') return 'yellow'
  return 'red'
}

export const columnsAssinaturasPagar: ColumnDef<AssinaturaPagarListItem>[] = [
  {
    accessorKey: 'Uid',
    header: () => render('div', {}, 'ID'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.Uid,
        color: 'gray',
        icon: Sparkles,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'nomeServico',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Serviço', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render('div', { class: 'min-w-0' }, [
        render('div', { class: 'truncate font-medium text-foreground' }, row.original.nomeServico),
        render('div', { class: 'mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground' }, [
          row.original.links.length
            ? render(Badge, { variant: 'outline' }, () => [render(Link2, { class: 'mr-1 h-3.5 w-3.5' }), `${row.original.links.length} link(s)`])
            : null,
          row.original.lancamentoAtual
            ? render(Badge, { variant: 'secondary' }, () => [
                render(ReceiptText, { class: 'mr-1 h-3.5 w-3.5' }),
                row.original.lancamentoAtual?.status || '',
              ])
            : null,
        ]),
      ]),
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
        label: row.original.status,
        color: statusColor(row.original.status) as 'green' | 'yellow' | 'red',
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
        color: 'red',
        capitalize: false,
      }),
  },
  {
    accessorKey: 'periodicidade',
    header: () => render('div', {}, 'Recorrência'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label:
          row.original.periodicidade === 'PERSONALIZADO'
            ? `A cada ${row.original.intervaloDiasPersonalizado || 0} dia(s)`
            : row.original.periodicidade,
        color: 'blue',
        icon: Repeat2,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'proximoVencimento',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Próximo vencimento', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.proximoVencimento ? formatDate(row.original.proximoVencimento, 'dd/MM/yyyy') : 'Sem data',
        color: 'gray',
        icon: CalendarDays,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'gerarFinanceiro',
    header: () => render('div', {}, 'Financeiro'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.gerarFinanceiro ? (row.original.gerarAutomatico ? 'Automático' : 'Manual') : 'Desligado',
        color: row.original.gerarFinanceiro ? 'emerald' : 'gray',
        icon: ReceiptText,
        capitalize: false,
      }),
  },
  {
    id: 'acoes',
    enableSorting: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) => {
      return render('div', { class: 'text-right' }, [
        render(AssinaturasPagarActions, { data: row.original }),
      ])
    } 
  },
]
