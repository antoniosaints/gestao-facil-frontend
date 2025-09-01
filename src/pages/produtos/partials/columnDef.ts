import BadgeInfo from '@/components/tabela/BadgeInfo.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { Produto } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Package, ScanQrCode } from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { formatCurrencyBR } from '@/utils/formatters'
import Actions from './Actions.vue'
import { goTo } from '@/hooks/links'
import { RouterLink } from 'vue-router'

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
    cell: ({ row }) => {
      const isLowStock = row.original.estoque <= row.original.minimo
      return render(RouterLink, { to: `/produtos/detalhes?id=${row.original.id}` }, () =>
        render(BadgeCell, {
          label: row.getValue('Uid') as string,
          color: isLowStock ? 'orange' : 'gray',
          icon: Package,
          capitalize: false,
        }),
      )
    },
  },
  {
    accessorKey: 'nome',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Produto', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
  },
  {
    accessorKey: 'codigo',
    header: ({ column }) =>
      render(
        'div',
        { class: 'text-left' },
        render(
          Button,
          {
            variant: 'ghost',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          },
          () => ['Código', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
        ),
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: `${row.original.codigo || '-'}`,
        color: 'blue',
        icon: ScanQrCode,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'estoque',
    header: ({ column }) => {
      return render(
        'div',
        { class: 'text-left' },
        render(
          Button,
          {
            variant: 'ghost',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          },
          () => ['Estoque', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
        ),
      )
    },
    cell: ({ row }) =>
      render(BadgeCell, {
        label: `${row.getValue('estoque')} ${row.original.unidade}`,
        color: 'gray',
      }),
  },
  {
    accessorKey: 'preco',
    header: ({ column }) =>
      render(
        'div',
        { class: 'text-left' },
        render(
          Button,
          {
            variant: 'ghost',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          },
          () => ['Valor', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
        ),
      ),
    cell: ({ row }) => {
      const valor = formatCurrencyBR(row.original.preco as number)
      return render(BadgeCell, { label: valor, color: 'green' })
    },
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row, table }) => {
      return render('div', { class: 'text-right' }, [
        render(Actions, { data: { ...row.original }, table }),
      ])
    },
  },
]
