import type { ColumnDef } from '@tanstack/vue-table'
import { ChevronRight } from 'lucide-vue-next'
import EntityLink from '@/components/navigation/EntityLink.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import DataTableColumnHeader from '@/components/tabela/DataTableColumnHeader.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { EmprestimoResumo } from '@/repositories/emprestimo-repository'
import { dataCurta, moeda, situacaoPorParcelas, situacoesEmprestimo } from './format'

export function columnsEmprestimos(abrir: (id: number) => void): ColumnDef<EmprestimoResumo>[] {
  return [
    {
      accessorKey: 'cliente',
      header: ({ column }) => render(DataTableColumnHeader, { column, title: 'Cliente' }),
      cell: ({ row: { original: item } }) =>
        render('div', { class: 'max-w-56' }, [
          render(EntityLink, {
            kind: 'cliente',
            recordId: item.cliente.id,
            label: item.cliente.nome,
            class: 'font-medium',
          }),
          render(
            'div',
            { class: 'text-xs text-muted-foreground' },
            `#${item.id} · ${dataCurta(item.dataSaida)}`,
          ),
        ]),
    },
    {
      id: 'situacao',
      header: 'Situação',
      enableSorting: false,
      cell: ({ row: { original: item } }) =>
        render(BadgeCell, {
          ...situacoesEmprestimo[
            item.situacao ?? situacaoPorParcelas(item.comprovanteEmAnalise, item.proximoVencimento)
          ],
          capitalize: false,
        }),
    },
    {
      accessorKey: 'principalCentavos',
      header: ({ column }) => render(DataTableColumnHeader, { column, title: 'Emprestado' }),
      cell: ({ row }) => moeda(row.original.principalCentavos),
    },
    {
      accessorKey: 'totalCentavos',
      header: 'Total sem atraso',
      enableSorting: false,
      cell: ({ row }) => moeda(row.original.totalCentavos),
    },
    {
      accessorKey: 'recebidoCentavos',
      header: 'Recebido',
      enableSorting: false,
      cell: ({ row }) => moeda(row.original.recebidoCentavos),
    },
    {
      accessorKey: 'pagas',
      header: 'Parcelas pagas',
      enableSorting: false,
      cell: ({ row }) => `${row.original.pagas}/${row.original.parcelas}`,
    },
    {
      accessorKey: 'proximoVencimento',
      header: 'Próximo vencimento',
      enableSorting: false,
      cell: ({ row }) =>
        row.original.proximoVencimento ? dataCurta(row.original.proximoVencimento) : '—',
    },
    {
      id: 'acoes',
      header: () => render('div', { class: 'text-right' }, 'Ações'),
      enableSorting: false,
      enableHiding: false,
      cell: ({ row: { original: item } }) =>
        render('div', { class: 'flex justify-end' }, [
          render(
            Button,
            {
              variant: 'ghost',
              size: 'sm',
              'aria-label': `Ver empréstimo de ${item.cliente.nome}`,
              onClick: () => abrir(item.id),
            },
            () => [
              render('span', { class: 'hidden sm:inline' }, 'Detalhes'),
              render(ChevronRight, { 'aria-hidden': true }),
            ],
          ),
        ]),
    },
  ]
}
