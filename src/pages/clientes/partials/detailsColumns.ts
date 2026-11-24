import EntityLink from '@/components/navigation/EntityLink.vue'
import { h } from 'vue'
import type { ColumnDef } from '@tanstack/vue-table'
import type { ClienteDetalhesTab, ClienteWhatsappPayload } from '@/repositories/cliente-repository'
import DataTableColumnHeader from '@/components/tabela/DataTableColumnHeader.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'

type Handlers = {
  send: (payload: ClienteWhatsappPayload, summary: string) => void
}
const money = (value: unknown) => formatCurrencyBR(Number(value || 0))
const date = (value: any) => value ? formatDateToPtBR(value) : '—'
const action = (label: string, onClick: () => void) => h(Button, { variant: 'outline', size: 'sm', class: 'h-9', onClick }, () => label)
const column = (key: string, label: string, render?: (row: any) => any): ColumnDef<any> => ({
  accessorKey: key, meta: { label },
  header: ({ column }) => h(DataTableColumnHeader, { column, title: label }),
  cell: ({ row }) => render ? render(row.original) : row.original[key] || '—',
})
const status = column('status', 'Situação', row => h(Badge, { variant: 'outline' }, () => row.status))

export function clienteDetailsColumns(tab: ClienteDetalhesTab, handlers: Handlers): ColumnDef<any>[] {
  if (tab === 'cobrancas') return [
    column('Uid', 'Cobrança', row => row.Uid || row.idCobranca),
    column('dataVencimento', 'Vencimento', row => date(row.dataVencimento)), status,
    column('valor', 'Valor', row => money(row.valor)),
    { id: 'acoes', header: 'Ações', enableSorting: false, cell: ({ row }) => action('Enviar lembrete', () => handlers.send({ tipo: 'COBRANCA', cobrancaId: row.original.id }, `a cobrança ${row.original.Uid || row.original.idCobranca} de ${money(row.original.valor)}`)) },
  ]
  if (tab === 'lancamentos') return [
    column('descricao', 'Descrição', row => h(EntityLink, { kind: 'lancamento', recordId: row.id, label: row.descricao })), column('Uid', 'Código'),
    column('dataLancamento', 'Data', row => date(row.dataLancamento)), status,
    column('valorTotal', 'Valor', row => money(row.valorTotal)),
    { id: 'acoes', header: 'Ações', enableSorting: false, cell: ({ row }) => h('div', { class: 'flex flex-wrap gap-2' }, [
      row.original.tipo === 'RECEITA' && row.original.status !== 'PAGO'
        ? action('Enviar pendência', () => handlers.send({ tipo: 'LANCAMENTO', lancamentoId: row.original.id }, `a pendência ${row.original.descricao} de ${money(row.original.valorTotal)}`)) : null,
    ]) },
  ]
  if (tab === 'vendas') return [
    column('Uid', 'Venda', row => h(EntityLink, { kind: 'venda', recordId: row.id, label: row.Uid })), column('data', 'Data', row => date(row.data)), status,
    { ...column('itens', 'Itens', row => row.ItensVendas?.length || 0), enableSorting: false },
    { ...column('total', 'Total', row => money(Math.max(0, Number(row.valor || 0) - Number(row.desconto || 0)))), enableSorting: false },
    { id: 'acoes', header: 'Documentos', enableSorting: false, cell: ({ row }) => h('div', { class: 'flex flex-wrap gap-2' }, [
      action('Orçamento', () => handlers.send({ tipo: 'ORCAMENTO_VENDA', vendaId: row.original.id }, `o orçamento da venda ${row.original.Uid}`)),
      action('Comprovante', () => handlers.send({ tipo: 'COMPROVANTE_VENDA', vendaId: row.original.id }, `o comprovante da venda ${row.original.Uid}`)),
    ]) },
  ]
  return [column('Uid', 'Ordem de serviço', row => h(EntityLink, { kind: 'ordem', recordId: row.id, label: row.Uid })), column('data', 'Data', row => date(row.data)), status,
    { ...column('itens', 'Itens', row => row.ItensOrdensServico?.length || 0), enableSorting: false },
  ]
}
