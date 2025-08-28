import BadgeInfo from '@/components/tabela/BadgeInfo.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import type { Vendas } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown } from 'lucide-vue-next'
import TabelaActions from './TabelaActions.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { formatCurrencyBR } from '@/utils/formatters'

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
        icon: 'fa-solid fa-tag',
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
        icon: 'fa-solid fa-coins',
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
      let color: "cyan" | "yellow" | "gray" | "violet" | "purple" | "green" | "emerald" | "orange" | "red" | "blue" = 'gray'
      let icon = 'fa-solid fa-check'
      switch (row.original.status) {
        case 'PENDENTE':
          color = 'yellow'
          icon = 'fa-solid fa-clock'
          break
        case 'CANCELADO':
          color = 'red'
          icon = 'fa-solid fa-xmark'
          break
        case 'FINALIZADO':
          color = 'purple'
          icon = 'fa-solid fa-check'
          break
        case 'ANDAMENTO':
          color = 'blue'
          icon = 'fa-solid fa-spinner'
          break
        case 'FATURADO':
          color = 'green'
          icon = 'fa-solid fa-money-bill'
          break
        default:
          color = 'gray'
          icon = 'fa-solid fa-check'
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
          icon: 'fa-solid fa-calendar',
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
