import BadgeInfo from '@/components/tabela/BadgeInfo.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
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
  FileText,
  FlagTriangleRight,
  Loader,
  Tag,
} from 'lucide-vue-next'
import TabelaActions from './TabelaActions.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { formatCurrencyBR } from '@/utils/formatters'
import type { Component } from 'vue'
import { useVendasStore } from '@/stores/vendas/useVenda'
import { Checkbox } from '@/components/ui/checkbox'
const store = useVendasStore()
const allColumnsVendas: ColumnDef<Vendas>[] = [
  {
    id: 'select',
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    header: ({ table }) =>
      render(Checkbox, {
        modelValue: table.getIsAllPageRowsSelected()
          ? true
          : table.getIsSomePageRowsSelected()
            ? 'indeterminate'
            : false,
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        'aria-label': 'Selecionar todos',
      }),
    cell: ({ row }) =>
      render(Checkbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'aria-label': 'Selecionar linha',
      }),
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
        () => ['ID', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.Uid as string,
        class: 'cursor-pointer',
        color: 'gray',
        icon: Tag,
        capitalize: false,
        onClick: () => store.openDetalhes(row.original.id!),
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
      const color = row.original.status === 'FATURADO' ? 'green' : 'gray'
      return render(BadgeCell, {
        label: valor,
        color,
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
        color,
        icon,
      })
    },
  },
  {
    accessorKey: 'vendedorId',
    enableSorting: false,
    enableColumnFilter: false,
    header: () => render(Button, { variant: 'ghost', class: 'text-left' }, () => 'Vendedor'),
    cell: ({ row }) => render('div', { class: 'text-left' }, row.original.vendedor?.nome || '-'),
  },
  {
    accessorKey: 'cliente',
    enableSorting: false,
    enableColumnFilter: false,
    header: () => render(Button, { variant: 'ghost', class: 'text-left' }, () => 'Cliente'),
    cell: ({ row }) => render('div', { class: 'text-left' }, row.original.cliente?.nome || '-'),
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
      const formattedDate = new Date(row.original.data).toLocaleDateString('pt-BR')
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
    id: 'notaFiscal',
    enableSorting: false,
    enableColumnFilter: false,
    header: () => render(Button, { variant: 'ghost', class: 'text-left' }, () => 'Nota fiscal'),
    cell: ({ row }) => {
      const nota = row.original.NotaFiscals?.[0]
      if (!nota) return render(BadgeCell, { label: 'Sem emissão', color: 'yellow', icon: FileText })

      const label = `${nota.tipo === 'NFCE' ? 'NFC-e' : nota.tipo === 'NFE' ? 'NF-e' : 'NFS-e'}${nota.numero ? ` #${nota.numero}` : ''}`
      const color = nota.status === 'AUTORIZADA' ? 'green' : nota.status.includes('FALHA') || nota.status === 'REJEITADA' ? 'red' : 'yellow'
      return render(BadgeCell, { label: `${label} · ${nota.status}`, color, icon: FileText })
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

export function getColumnsVendas(
  includeFiscalColumn: boolean,
  fiscalTypes: { nfe: boolean; nfce: boolean } = { nfe: false, nfce: false },
): ColumnDef<Vendas>[] {
  const columns = includeFiscalColumn
    ? allColumnsVendas
    : allColumnsVendas.filter((column) => column.id !== 'notaFiscal')

  return columns.map((column) =>
    column.id !== 'acoes' && (!('accessorKey' in column) || column.accessorKey !== 'acoes')
      ? column
      : {
          ...column,
          cell: ({ row, table }) =>
            render('div', { class: 'text-right' }, render(TabelaActions, {
              data: row.original,
              table,
              fiscalTypes,
            })),
        },
  )
}
