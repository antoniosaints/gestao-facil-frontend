import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { render } from '@/lib/utils'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import type { ProdutoBase, ProdutoVariante } from '@/types/schemas'
import { formatCurrencyBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Boxes, Package, ScanQrCode, Tags } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import Actions from './Actions.vue'
import ActionsVariante from './ActionsVariante.vue'
import ThumbCell from './ThumbCell.vue'

const store = useProdutoStore()

type ProdutoVarianteRow = ProdutoVariante & {
  produtoBaseNome?: string
  produtoBaseUid?: string | null
}

// Checkbox no cabeçalho: seleciona/desseleciona todas as linhas da página atual,
// sincronizando com `store.selectedIds` (mesma seleção usada pela barra de ações em massa).
function selectAllHeader({ table }: { table: any }) {
  const rows = table.getRowModel().rows
  const ids = rows
    .map((row: any) => row.original.id)
    .filter((id: unknown): id is number => typeof id === 'number')
  const allSelected = ids.length > 0 && ids.every((id: number) => store.selectedIds.includes(id))
  const someSelected = ids.some((id: number) => store.selectedIds.includes(id))
  return render(Checkbox, {
    modelValue: allSelected ? true : someSelected ? 'indeterminate' : false,
    'onUpdate:modelValue': (value: boolean | string) => {
      rows.forEach((row: any) => row.toggleSelected(!!value))
      if (value) ids.forEach((id: number) => store.addSelectedId(id))
      else ids.forEach((id: number) => store.removeSelectedId(id))
    },
    ariaLabel: 'Selecionar todos',
  })
}

export const columnsProdutos: ColumnDef<ProdutoBase>[] = [
  {
    id: 'select',
    header: selectAllHeader,
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
    accessorKey: 'imagem',
    id: 'foto',
    header: () => render('div', {}, 'Foto'),
    cell: ({ row }) =>
      render(ThumbCell, { image: row.original.imagem ?? null, alt: row.original.nome }),
    enableSorting: false,
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

export const columnsVariantes: ColumnDef<ProdutoVarianteRow>[] = [
  {
    id: 'select',
    header: selectAllHeader,
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
    accessorKey: 'imagem',
    id: 'foto',
    header: () => render('div', {}, 'Foto'),
    cell: ({ row }) =>
      render(ThumbCell, { image: row.original.imagem ?? null, alt: row.original.nomeVariante || row.original.nome }),
    enableSorting: false,
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
      // render(BadgeCell, {
      //   label: row.getValue('Uid') as string,
      //   color: 'gray',
      //   icon: Package,
      //   capitalize: false,
      // }),
       render(RouterLink, { to: `/produtos/detalhes?id=${row.original.produtoBaseId}&varianteId=${row.original.id}` }, () =>
        render(BadgeCell, {
          label: row.getValue('Uid') as string,
          color: 'gray',
          icon: Package,
          capitalize: false,
        }),
      ),
  },
  {
    accessorKey: 'produtoBaseNome',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Produto', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(RouterLink, { to: `/produtos/detalhes?id=${row.original.produtoBaseId}&varianteId=${row.original.id}` }, () => {
        const base = row.original.produtoBaseNome || row.original.nome
        const variante = row.original.nomeVariante || ''
        return base + ' ' + variante;
      }),
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
    accessorKey: 'estoque',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Estoque', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: `${row.original.estoque || 0} ${row.original.unidade || 'un'}`,
        color: 'gray',
        capitalize: false,
      }),
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
        () => ['Preço', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatCurrencyBR(Number(row.original.preco || 0)),
        color: 'green',
      }),
  },
  {
    accessorKey: 'codigo',
    header: () => render('div', {}, 'Código'),
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
      render('div', { class: 'text-right' }, [render(ActionsVariante, { data: { ...row.original }, table })]),
  },
]
