import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { render } from '@/lib/utils'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import type { ProdutoBase } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Boxes, Package, ScanQrCode, Tags } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import Actions from './Actions.vue'

const store = useProdutoStore()

export const columnsProdutos: ColumnDef<ProdutoBase>[] = [
  {
    id: 'select',
    header: () => render('div', {}, ''),
    cell: ({ row }) =>
      render(Checkbox, {
        modelValue: store.selectedIds.includes(row.original.id!),
        'onUpdate:modelValue': (value: boolean | string) => {
          row.toggleSelected(!!value)
          if (value) store.addSelectedId(row.original.id!)
          else store.removeSelectedId(row.original.id!)
        },
        ariaLabel: 'Selecionar linha',
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
        () => ['ID', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(RouterLink, { to: `/produtos/detalhes?id=${row.original.id}` }, () =>
        render(BadgeCell, {
          label: row.getValue('Uid') as string,
          color: 'gray',
          icon: Package,
          capitalize: false,
        }),
      ),
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
        () => ['Produto base', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
  },
  {
    accessorKey: 'categoria',
    header: () => render('div', {}, 'Categoria'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: `${row.original.categoria || 'Sem categoria'}`,
        color: 'blue',
        icon: Tags,
      }),
    enableSorting: false,
  },
  {
    accessorKey: 'totalVariantes',
    header: () => render('div', {}, 'Variantes'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: `${row.original.totalVariantes || 0}`,
        color: 'gray',
        icon: Boxes,
        capitalize: false,
      }),
    enableSorting: false,
  },
  {
    accessorKey: 'estoqueTotal',
    header: () => render('div', {}, 'Estoque total'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: `${row.original.estoqueTotal || 0} ${row.original.unidade || 'un'}`,
        color: 'gray',
      }),
    enableSorting: false,
  },
  {
    accessorKey: 'preco',
    header: () => render('div', {}, 'Preço padrão'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatCurrencyBR(Number(row.original.preco || 0)),
        color: 'green',
      }),
    enableSorting: false,
  },
  {
    accessorKey: 'codigo',
    header: () => render('div', {}, 'Código padrão'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: `${row.original.codigo || '-'}`,
        color: 'blue',
        icon: ScanQrCode,
        capitalize: false,
      }),
    enableSorting: false,
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row, table }) =>
      render('div', { class: 'text-right' }, [render(Actions, { data: { ...row.original }, table })]),
  },
]
