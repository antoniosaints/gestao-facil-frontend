import { Button } from '@/components/ui/button'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { render } from '@/lib/utils'
import type { ContaFinanceiraDetalheMovimentacao } from '@/types/schemas'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowDownLeft, ArrowUpDown, ArrowUpRight, CalendarDays, CheckCircle2, Clock3 } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'

function sortableHeader(label: string) {
  return ({ column }: { column: { toggleSorting: (descending: boolean) => void; getIsSorted: () => false | 'asc' | 'desc' } }) =>
    render(
      Button,
      { variant: 'ghost', onClick: () => column.toggleSorting(column.getIsSorted() === 'asc') },
      () => [label, render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
    )
}

export const columnsMovimentacoesConta: ColumnDef<ContaFinanceiraDetalheMovimentacao>[] = [
  {
    accessorKey: 'descricao',
    header: sortableHeader('Lançamento'),
    cell: ({ row }) =>
      render('div', { class: 'min-w-[220px] space-y-1' }, [
        render(
          RouterLink,
          { to: `/financeiro/detalhes?id=${row.original.lancamento.id}`, class: 'font-medium hover:text-primary hover:underline' },
          () => row.original.lancamento.descricao,
        ),
        render('div', { class: 'text-xs text-muted-foreground' }, `${row.original.lancamento.Uid || `#${row.original.lancamento.id}`} • Parcela ${row.original.numero}`),
      ]),
  },
  {
    accessorKey: 'tipo',
    header: sortableHeader('Tipo'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.lancamento.tipo === 'RECEITA' ? 'Entrada' : 'Saída',
        color: row.original.lancamento.tipo === 'RECEITA' ? 'green' : 'red',
        icon: row.original.lancamento.tipo === 'RECEITA' ? ArrowUpRight : ArrowDownLeft,
        capitalize: false,
      }),
  },
  {
    id: 'referencia',
    header: () => render('span', {}, 'Categoria / pessoa'),
    cell: ({ row }) =>
      render('div', { class: 'min-w-[180px]' }, [
        render('div', { class: 'font-medium' }, row.original.lancamento.categoria.nome),
        render('div', { class: 'text-xs text-muted-foreground' }, row.original.lancamento.cliente?.nome || 'Sem cliente/fornecedor'),
      ]),
  },
  {
    accessorKey: 'vencimento',
    header: sortableHeader('Vencimento'),
    cell: ({ row }) => render(BadgeCell, { label: formatDateToPtBR(row.original.vencimento), color: 'gray', icon: CalendarDays, capitalize: false }),
  },
  {
    accessorKey: 'dataPagamento',
    header: sortableHeader('Pagamento'),
    cell: ({ row }) => render(BadgeCell, { label: row.original.dataPagamento ? formatDateToPtBR(row.original.dataPagamento) : '—', color: row.original.pago ? 'green' : 'gray', icon: row.original.pago ? CheckCircle2 : Clock3, capitalize: false }),
  },
  {
    accessorKey: 'status',
    header: sortableHeader('Status'),
    cell: ({ row }) => render(BadgeCell, {
      label: row.original.status,
      color: row.original.status === 'PAGO' ? 'green' : row.original.status === 'ATRASADO' ? 'red' : 'yellow',
      capitalize: false,
    }),
  },
  {
    accessorKey: 'valor',
    header: sortableHeader('Valor'),
    cell: ({ row }) => render('div', { class: 'min-w-[110px] text-right font-medium' }, formatCurrencyBR(row.original.pago && row.original.valorPago !== null ? row.original.valorPago : row.original.valor)),
  },
]
