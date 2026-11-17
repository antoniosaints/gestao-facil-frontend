import DataTableColumnHeader from '@/components/tabela/DataTableColumnHeader.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { render } from '@/lib/utils'
import type { PlanoAssinaturaListItem } from '@/repositories/assinatura-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import { Layers3, Package, Repeat, Wallet } from 'lucide-vue-next'
import PlanosActions from './PlanosActions.vue'
import { getPeriodicidadeLabel, getStatusPlanoMeta } from '../shared'

export const columnsPlanosAssinatura: ColumnDef<PlanoAssinaturaListItem>[] = [
  {
    accessorKey: 'Uid',
    header: () => render('div', {}, 'ID'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.Uid,
        color: 'gray',
        icon: Layers3,
        capitalize: false,
      }),
    enableSorting: false,
  },
  {
    accessorKey: 'nome',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Plano' }),
  },
  {
    accessorKey: 'status',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: getStatusPlanoMeta(row.original.status).label,
        color: row.original.status === 'ATIVO' ? 'green' : 'gray',
        icon: row.original.status === 'ATIVO' ? Repeat : Package,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'periodicidadePadrao',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Periodicidade' }),
    cell: ({ row }) => render('div', {}, getPeriodicidadeLabel(row.original.periodicidadePadrao)),
  },
  {
    accessorKey: 'valorBase',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Valor base' }),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatCurrencyBR(row.original.valorBase),
        color: 'green',
        icon: Wallet,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'resumo',
    header: () => render('div', {}, 'Resumo'),
    cell: ({ row }) =>
      render(
        'div',
        { class: 'text-sm text-muted-foreground' },
        `${row.original.resumo.itens} item(ns) • ${row.original.resumo.assinaturasVinculadas} contrato(s)`,
      ),
    enableSorting: false,
  },
  {
    id: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) => render('div', { class: 'text-right' }, [render(PlanosActions, { data: row.original })]),
  },
]
