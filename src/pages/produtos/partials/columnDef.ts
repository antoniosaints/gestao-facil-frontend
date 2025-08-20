import BadgeInfo from '@/components/tabela/BadgeInfo.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { Produto } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown } from 'lucide-vue-next'
import TabelaActions from './Actions.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { formatCurrencyBR } from '@/utils/formatters'
import Actions from './Actions.vue'

export const columnsProdutos: ColumnDef<Produto>[] = [
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
      render(BadgeInfo, {
        conteudo: row.getValue('Uid') as string,
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
    cell: ({ row }) =>
      render('div', { class: 'text-right' }, render(Actions, { data: row.original })),
  },
]
