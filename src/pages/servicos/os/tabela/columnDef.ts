import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { ItensOrdensServico, OrdensServico, Servicos } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  ArrowUpDown,
  BadgeCheck,
  Ban,
  BanknoteArrowDown,
  Calendar,
  CircleCheck,
  CircleX,
  FileBadge,
  FileBox,
  FileClock,
  Loader,
} from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import Actions from './Actions.vue'
import { formatCurrencyBR, formatToNumberValue } from '@/utils/formatters'
import { Checkbox } from '@/components/ui/checkbox'
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos'
import type { Component } from 'vue'
import { formatDate } from 'date-fns'
const store = useOrdemServicoStore()
type OrdemRecebida = OrdensServico & {
  ItensOrdensServico: ItensOrdensServico[]
}
export const columnsServicos: ColumnDef<OrdemRecebida>[] = [
  {
    id: 'select',
    header: ({ table }) => render('div', {}, ''),
    cell: ({ row }) =>
      render(Checkbox, {
        modelValue: store.selectedIds.includes(row.original.id!),
        'onUpdate:modelValue': (value: boolean | string) => {
          row.toggleSelected(!!value)
          if (value) store.addSelectedId(row.original.id!)
          else store.removeSelectedId(row.original.id!)
        },
        ariaLabel: 'Select row',
      }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'Uid',
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
      return render(BadgeCell, {
        label: row.original.Uid!,
        color: 'gray',
        icon: FileBox,
        capitalize: false,
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
      let icon: Component = FileBadge

      switch (row.original.status) {
        case 'ABERTA':
          color = 'cyan'
          icon = FileClock
          break
        case 'CANCELADA':
          color = 'red'
          icon = CircleX
          break
        case 'APROVADA':
          color = 'purple'
          icon = BadgeCheck
          break
        case 'ANDAMENTO':
          color = 'blue'
          icon = Loader
          break
        case 'FATURADA':
          color = 'green'
          icon = BanknoteArrowDown
          break
      }

      return render(BadgeCell, {
        label: row.original.status,
        color,
        icon,
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
  },
  {
    accessorKey: 'clienteId',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Cliente', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      return render('div', {}, row.original.Cliente?.nome || '-')
    },
  },
  {
    accessorKey: 'data',
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
        label: formatDate(row.original.data, 'dd/MM/yyyy'),
        color: 'gray',
        icon: Calendar,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'preco',
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
        label: formatCurrencyBR(
          row.original.ItensOrdensServico.reduce(
            (acc, item) => acc + formatToNumberValue(item.valor) * item.quantidade,
            0,
          ) - formatToNumberValue(row.original.desconto || 0),
        ),
        color: 'green',
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
    cell: ({ row, table }) => {
      return render('div', { class: 'text-right' }, [
        render(Actions, { data: { ...row.original } }),
      ])
    },
  },
]
