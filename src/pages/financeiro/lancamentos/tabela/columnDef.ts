import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { LancamentoFinanceiro } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  ArrowUpDown,
  BadgeCheck,
  Calendar,
  CircleDollarSign,
  ClockAlert,
  Loader,
  TrendingDown,
  TrendingUp,
  Ungroup,
} from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import Actions from './Actions.vue'
import { formatCurrencyBR } from '@/utils/formatters'
import { formatDate } from 'date-fns'
import { RouterLink } from 'vue-router'

export const columnsLancamentos: ColumnDef<LancamentoFinanceiro>[] = [
  {
    accessorKey: 'Uid',
    enableSorting: false,
    header: () => render('div', { class: 'ml-2 h-4 w-4' }, 'ID'),
    cell: ({ row }) => {
      return render(RouterLink, { to: `/financeiro/detalhes?id=${row.original.id}` }, () =>
        render(BadgeCell, {
          label: row.getValue('Uid') as string,
          color: 'gray',
          icon: CircleDollarSign,
          capitalize: false,
        }),
      )
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
      let cor: any = 'gray'
      let icon = BadgeCheck
      switch (row.original.status) {
        case 'PAGO':
          cor = 'green'
          icon = BadgeCheck
          break
        case 'PARCIAL':
          cor = 'blue'
          icon = Ungroup
          break
        case 'PENDENTE':
          cor = 'yellow'
          icon = Loader
          break
        case 'ATRASADO':
          cor = 'red'
          icon = ClockAlert
          break
      }
      return render(BadgeCell, {
        label: row.getValue('status') as string,
        color: cor,
        icon: icon,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'descricao',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Descrição', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(
        'div',
        { class: 'text-left w-full truncate max-w-[450px]' },
        row.getValue('descricao') as string,
      ),
  },
  {
    accessorKey: 'valorTotal',
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
      return render(BadgeCell, {
        label: formatCurrencyBR(row.original.valorTotal),
        color: row.original.tipo === 'RECEITA' ? 'green' : 'red',
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'tipo',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Tipo', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: row.getValue('tipo') as string,
        color: row.original.tipo === 'RECEITA' ? 'green' : 'red',
        icon: row.original.tipo === 'RECEITA' ? TrendingUp : TrendingDown,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'dataLancamento',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Data', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: formatDate(row.getValue('dataLancamento') as string, 'dd/MM/yyyy'),
        color: 'gray',
        icon: Calendar,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) => {
      return render('div', { class: 'text-right' }, [
        render(Actions, { data: { ...row.original } }),
      ])
    },
  },
]
