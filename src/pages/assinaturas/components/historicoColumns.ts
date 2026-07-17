import { Button } from '@/components/ui/button'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { render } from '@/lib/utils'
import { formatDateToPtBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, History, UserRound } from 'lucide-vue-next'

export interface HistoricoAssinaturaListItem {
  id: number
  evento: string
  payloadJson?: string | null
  autor: string
  createdAt: string
}

// Deixa o código do evento mais legível: CICLO_GERADO -> "Ciclo gerado".
function prettifyEvento(evento: string) {
  const texto = evento.replace(/_/g, ' ').toLowerCase()
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export const columnsHistoricoAssinatura: ColumnDef<HistoricoAssinaturaListItem>[] = [
  {
    accessorKey: 'evento',
    header: () => render('div', {}, 'Evento'),
    cell: ({ row }) =>
      render('div', { class: 'space-y-1' }, [
        render(BadgeCell, {
          label: prettifyEvento(row.original.evento),
          color: 'violet',
          icon: History,
          capitalize: false,
          size: 'sm',
        }),
        row.original.payloadJson
          ? render(
              'div',
              { class: 'max-w-[420px] truncate text-xs text-muted-foreground' },
              row.original.payloadJson,
            )
          : null,
      ]),
    enableSorting: false,
  },
  {
    accessorKey: 'autor',
    header: () => render('div', {}, 'Autor'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.autor,
        color: 'blue',
        icon: UserRound,
        capitalize: false,
        size: 'sm',
      }),
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Data', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => render('div', {}, formatDateToPtBR(row.original.createdAt, true)),
  },
]
