import EntityLink from '@/components/navigation/EntityLink.vue'
import DataTableColumnHeader from '@/components/tabela/DataTableColumnHeader.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { render } from '@/lib/utils'
import type { AssinaturaClienteListItem } from '@/repositories/assinatura-repository'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import { CalendarClock, CircleDollarSign, FilePenLineIcon } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import AssinaturasActions from './AssinaturasActions.vue'
import { getPeriodicidadeLabel, getStatusAssinaturaMeta } from '../shared'

export const columnsAssinaturas: ColumnDef<AssinaturaClienteListItem>[] = [
  {
    accessorKey: 'Uid',
    header: () => render('div', {}, 'ID'),
    cell: ({ row }) =>
      render(RouterLink, { to: `/assinaturas/assinaturas/${row.original.id}` }, () =>
        render(BadgeCell, {
          label: row.original.Uid,
          color: 'gray',
          icon: FilePenLineIcon,
          capitalize: false,
        }),
      ),
    enableSorting: false,
  },
  {
    accessorKey: 'nomeContrato',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Contrato' }),
  },
  {
    accessorKey: 'status',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: getStatusAssinaturaMeta(row.original.status).label,
        color:
          row.original.status === 'ATIVA'
            ? 'green'
            : row.original.status === 'SUSPENSA'
              ? 'yellow'
              : row.original.status === 'CANCELADA'
                ? 'red'
                : 'gray',
        icon: CalendarClock,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'cliente',
    header: () => render('div', {}, 'Cliente'),
    cell: ({ row }) =>
      render(EntityLink, { kind: 'cliente', recordId: row.original.cliente?.id, label: row.original.cliente?.nome || 'Sem cliente' }),
    enableSorting: false,
  },
  {
    accessorKey: 'periodicidade',
    header: () => render('div', {}, 'Periodicidade'),
    cell: ({ row }) => render('div', {}, getPeriodicidadeLabel(row.original.periodicidade)),
    enableSorting: false,
  },
  {
    accessorKey: 'valorAtual',
    header: () => render('div', {}, 'Valor'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatCurrencyBR(row.original.valorAtual),
        color: 'green',
        icon: CircleDollarSign,
        capitalize: false,
      }),
    enableSorting: false,
  },
  {
    accessorKey: 'proximaCobranca',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Próxima cobrança' }),
    cell: ({ row }) => render('div', {}, formatDateToPtBR(row.original.proximaCobranca)),
  },
  {
    id: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) => render('div', { class: 'text-right' }, [render(AssinaturasActions, { data: row.original })]),
  },
]
