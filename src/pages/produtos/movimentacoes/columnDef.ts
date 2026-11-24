import EntityLink from '@/components/navigation/EntityLink.vue'
import DataTableColumnHeader from '@/components/tabela/DataTableColumnHeader.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { render } from '@/lib/utils'
import { formatCurrencyBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import { h } from 'vue'
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
  CalendarClock,
  FileText,
  Package,
  Tag,
  Trash2,
  Truck,
} from 'lucide-vue-next'

type Movimentacao = {
  id: number
  Uid: string
  tipo: string
  status: string
  data: string
  notaFiscal: string | null
  quantidade: number
  custo: number | string
  produtoId?: number | null
  produtoBaseId?: number | null
  fornecedorId?: number | null
  vendaId?: number | null
  ordemId?: number | null
  produtoNome: string
  produtoCodigo: string | null
  fornecedor: string | null
  origem: string
  valorTotal: number
}

const TIPO_META: Record<string, { color: any; icon: any; label: string }> = {
  ENTRADA: { color: 'green', icon: ArrowDownToLine, label: 'Entrada' },
  SAIDA: { color: 'orange', icon: ArrowUpFromLine, label: 'Saída' },
  DESCARTE: { color: 'red', icon: Trash2, label: 'Descarte' },
  TRANSFERENCIA: { color: 'blue', icon: ArrowLeftRight, label: 'Transferência' },
}

const STATUS_META: Record<string, { color: any; label: string }> = {
  PENDENTE: { color: 'yellow', label: 'Pendente' },
  CONCLUIDO: { color: 'green', label: 'Concluído' },
  CANCELADO: { color: 'red', label: 'Cancelado' },
}

function sortHeader(label: string) {
  return ({ column }: any) =>
    render(DataTableColumnHeader, { column, title: label, class: 'px-2' })
}

export const columnsMovimentacoes: ColumnDef<Movimentacao>[] = [
  {
    accessorKey: 'Uid',
    header: sortHeader('ID'),
    cell: ({ row }) =>
      render(BadgeCell, { label: row.original.Uid, color: 'gray', icon: Tag, capitalize: false }),
  },
  {
    accessorKey: 'data',
    header: sortHeader('Data'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: new Date(row.original.data).toLocaleString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        }),
        color: 'gray',
        icon: CalendarClock,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const meta = TIPO_META[row.original.tipo] ?? { color: 'gray', icon: Package, label: row.original.tipo }
      return render(BadgeCell, { label: meta.label, color: meta.color, icon: meta.icon, capitalize: false })
    },
  },
  {
    accessorKey: 'produtoNome',
    header: 'Produto',
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col' }, [
        h(EntityLink, { kind: 'produto', recordId: row.original.produtoBaseId, variantId: row.original.produtoId, label: row.original.produtoNome, class: 'text-sm font-medium' }),
        row.original.produtoCodigo
          ? h('span', { class: 'text-xs text-muted-foreground' }, `SKU: ${row.original.produtoCodigo}`)
          : null,
      ]),
  },
  {
    accessorKey: 'quantidade',
    header: sortHeader('Qtd.'),
    cell: ({ row }) =>
      h('span', { class: 'font-semibold text-foreground' }, String(row.original.quantidade)),
  },
  {
    accessorKey: 'notaFiscal',
    header: 'Nota fiscal',
    cell: ({ row }) =>
      row.original.notaFiscal
        ? render(BadgeCell, { label: row.original.notaFiscal, color: 'violet', icon: FileText, capitalize: false })
        : h('span', { class: 'text-xs text-muted-foreground' }, '—'),
  },
  {
    accessorKey: 'fornecedor',
    header: 'Fornecedor / Cliente',
    cell: ({ row }) =>
      h(EntityLink, { kind: 'cliente', recordId: row.original.fornecedorId, label: row.original.fornecedor || '—', class: 'text-sm' }),
  },
  {
    accessorKey: 'origem',
    header: 'Origem',
    cell: ({ row }) =>
      row.original.vendaId || row.original.ordemId
        ? h(EntityLink, { kind: row.original.vendaId ? 'venda' : 'ordem', recordId: row.original.vendaId ?? row.original.ordemId, label: row.original.origem })
        : render(BadgeCell, { label: row.original.origem, color: 'cyan', icon: Truck, capitalize: false, size: 'sm' }),
  },
  {
    accessorKey: 'custo',
    header: sortHeader('Custo unit.'),
    cell: ({ row }) =>
      h('span', { class: 'text-sm text-muted-foreground' }, formatCurrencyBR(Number(row.original.custo))),
  },
  {
    accessorKey: 'valorTotal',
    header: 'Valor total',
    cell: ({ row }) =>
      h('span', { class: 'text-sm font-semibold text-foreground' }, formatCurrencyBR(row.original.valorTotal)),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const meta = STATUS_META[row.original.status] ?? { color: 'gray', label: row.original.status }
      return render(BadgeCell, { label: meta.label, color: meta.color, capitalize: false })
    },
  },
]
