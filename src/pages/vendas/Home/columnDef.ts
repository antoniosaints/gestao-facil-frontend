import BadgeInfo from '@/components/tabela/BadgeInfo.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import type { Vendas } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  ArrowUpDown,
  BadgeCheck,
  BanknoteArrowDown,
  CalendarArrowDown,
  CircleDollarSign,
  CircleX,
  FileClock,
  FlagTriangleRight,
  Loader,
  Tag,
} from 'lucide-vue-next'
import TabelaActions from './TabelaActions.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { formatCurrencyBR } from '@/utils/formatters'
import type { Component } from 'vue'

const useProduto = useProdutoStore()

export const columnsVendas: ColumnDef<Vendas>[] = [
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
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: row.getValue('Uid') as string,
        color: 'gray',
        icon: Tag,
        capitalize: false,
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
      const valor = formatCurrencyBR(row.original.valor)
      const color = row.getValue('status') === 'FATURADO' ? 'green' : 'gray'
      return render(BadgeCell, {
        label: valor,
        color: color,
        icon: CircleDollarSign,
      })
    },
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
      let icon: Component = FlagTriangleRight
      switch (row.original.status) {
        case 'PENDENTE':
          color = 'yellow'
          icon = FileClock
          break
        case 'CANCELADO':
          color = 'red'
          icon = CircleX
          break
        case 'FINALIZADO':
          color = 'purple'
          icon = BadgeCheck
          break
        case 'ANDAMENTO':
          color = 'blue'
          icon = Loader
          break
        case 'FATURADO':
          color = 'green'
          icon = BanknoteArrowDown
          break
      }
      return render(BadgeCell, {
        label: row.original.status,
        color: color,
        icon: icon,
      })
    },
  },
  {
    accessorKey: 'vendedorId',
    enableSorting: false,
    enableColumnFilter: false,
    header: ({ column }) =>
      render(
        'div',
        { class: 'text-left' },
        render(
          Button,
          {
            variant: 'ghost',
            class: 'text-left',
          },
          () => 'Vendedor',
        ),
      ),
    cell: ({ row }) => render('div', { class: 'text-left' }, row.original.vendedor?.nome || '-'),
  },
  {
    accessorKey: 'cliente',
    enableSorting: false,
    enableColumnFilter: false,
    header: ({ column }) =>
      render(
        'div',
        { class: 'text-left' },
        render(
          Button,
          {
            variant: 'ghost',
            class: 'text-left',
          },
          () => 'Cliente',
        ),
      ),
    cell: ({ row }) => render('div', { class: 'text-left' }, row.original.cliente?.nome || '-'),
  },
  {
    accessorKey: 'data',
    header: ({ column }) =>
      render(
        'div',
        { class: 'text-right' },
        render(
          Button,
          {
            variant: 'ghost',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          },
          () => ['Data', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
        ),
      ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('data'))
      const formattedDate = date.toLocaleString('pt-BR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      return render(
        'div',
        { class: 'text-right' },
        render(BadgeCell, {
          label: formattedDate,
          color: 'gray',
          icon: CalendarArrowDown,
        }),
      )
    },
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row, table }) =>
      render('div', { class: 'text-right' }, render(TabelaActions, { data: row.original, table })),
  },
]
