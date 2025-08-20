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
    cell: ({ row }) =>
      render(BadgeInfo, {
        conteudo: row.getValue('Uid') as string,
        onClick: async () => {
          const data = await useProduto.get(row.original.id as number)
          console.log(data)
        },
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
    cell: ({ row }) => {
      const valor = formatCurrencyBR(row.original.valor)
      return render(BadgeCell, {
        label: valor,
        color: 'green',
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
  },
  {
    accessorKey: 'vendedor',
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
          'Vendedor',
        ),
      ),
    cell: ({ row }) => render('div', { class: 'text-left' }, row.original.vendedor?.nome),
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
          'Cliente',
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
    cell: ({ row }) =>
      render('div', { class: 'text-right' }, render(TabelaActions, { data: row.original })),
  },
]
