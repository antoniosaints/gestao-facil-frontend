import DataTableColumnHeader from '@/components/tabela/DataTableColumnHeader.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import { useComandaStore } from '@/stores/arena/comandaStore'
import type { ComandaVenda } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  BanknoteArrowDown,
  CalendarDays,
  CircleDollarSign,
  CircleSlash,
  Clock3,
  ConciergeBell,
  LoaderCircle,
} from 'lucide-vue-next'
import type { Component } from 'vue'
import Actions from './Actions.vue'

const store = useComandaStore()

function getStatusConfig(status: ComandaVenda['status']) {
  let color:
    | 'cyan'
    | 'yellow'
    | 'gray'
    | 'violet'
    | 'purple'
    | 'green'
    | 'emerald'
    | 'orange'
    | 'red'
    | 'blue' = 'gray'
  let icon: Component = ConciergeBell

  switch (status) {
    case 'ABERTA':
      color = 'blue'
      icon = LoaderCircle
      break
    case 'PENDENTE':
      color = 'orange'
      icon = Clock3
      break
    case 'FECHADA':
      color = 'green'
      icon = BanknoteArrowDown
      break
    case 'CANCELADA':
      color = 'red'
      icon = CircleSlash
      break
  }

  return { color, icon }
}

export const columnsComandas: ColumnDef<ComandaVenda>[] = [
  {
    accessorKey: 'id',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Comanda' }),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: `#${row.original.id}`,
        color: 'gray',
        icon: ConciergeBell,
        capitalize: false,
        onClick: () => store.openDetalhes(row.original.id as number),
      }),
  },
  {
    accessorKey: 'clienteNome',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Identificação' }),
    cell: ({ row }) =>
      render('div', { class: 'min-w-[220px]' }, [
        render('div', { class: 'font-medium text-foreground' }, row.original.clienteNome || '-'),
        render(
          'div',
          { class: 'text-xs text-muted-foreground' },
          row.original.Cliente?.nome || row.original.observacao || 'Sem cliente vinculado',
        ),
      ]),
  },
  {
    accessorKey: 'status',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) => {
      const config = getStatusConfig(row.original.status)
      return render(BadgeCell, {
        label: row.original.status,
        color: config.color,
        icon: config.icon,
      })
    },
  },
  {
    accessorKey: 'itensAbertos',
    enableSorting: false,
    header: () => render(Button, { variant: 'ghost' }, () => 'Itens abertos'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: String(row.original.itensAbertos || 0),
        color: row.original.itensAbertos ? 'blue' : 'gray',
        icon: ConciergeBell,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'valorItensAbertos',
    enableSorting: false,
    header: () => render(Button, { variant: 'ghost' }, () => 'Em aberto'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatCurrencyBR(Number(row.original.valorItensAbertos || 0)),
        color: row.original.valorItensAbertos ? 'blue' : 'gray',
        icon: CircleDollarSign,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'valorPendente',
    enableSorting: false,
    header: () => render(Button, { variant: 'ghost' }, () => 'A receber'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatCurrencyBR(Number(row.original.valorPendente || 0)),
        color: row.original.valorPendente ? 'orange' : 'gray',
        icon: CircleDollarSign,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'abertura',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Abertura' }),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: new Date(row.original.abertura).toLocaleDateString('pt-BR'),
        color: 'gray',
        icon: CalendarDays,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) => render('div', { class: 'text-right' }, render(Actions, { data: row.original })),
  },
]
