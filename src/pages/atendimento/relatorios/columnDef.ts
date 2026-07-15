import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { CicloStatusAtendimento, LinhaRelatorioAtendimento } from '@/repositories/whatsapp-repository'
import { formatDuracaoMs } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Headset, User } from 'lucide-vue-next'

function formatDataHora(valor: string | null) {
  if (!valor) return '—'
  return new Date(valor).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type BadgeColor = InstanceType<typeof BadgeCell>['$props']['color']

const STATUS_LABEL: Record<CicloStatusAtendimento, { label: string; color: BadgeColor }> = {
  NA_FILA: { label: 'Na fila', color: 'yellow' },
  EM_ANDAMENTO: { label: 'Em andamento', color: 'blue' },
  FINALIZADO: { label: 'Finalizado', color: 'green' },
}

function sortableHeader(label: string) {
  return ({ column }: { column: any }) =>
    render(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      },
      () => [label, render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
    )
}

export const columnsRelatorioAtendimentos: ColumnDef<LinhaRelatorioAtendimento>[] = [
  {
    accessorKey: 'contato',
    header: sortableHeader('Contato'),
    cell: ({ row }) =>
      render('div', { class: 'min-w-0' }, [
        render('p', { class: 'truncate text-sm font-medium' }, row.original.contato),
        render('p', { class: 'truncate text-xs text-muted-foreground' }, row.original.telefone),
      ]),
  },
  {
    accessorKey: 'atendente',
    header: sortableHeader('Atendente'),
    cell: ({ row }) =>
      row.original.atendente
        ? render(BadgeCell, { label: row.original.atendente, color: 'blue', icon: Headset })
        : // Ciclo ainda na fila ou assumido direto do aparelho: não há atendente identificado.
          render(BadgeCell, { label: 'Sem atendente', color: 'gray', icon: User }),
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: () => render('div', {}, 'Status'),
    cell: ({ row }) => {
      const status = STATUS_LABEL[row.original.status]
      return render(BadgeCell, { label: status.label, color: status.color })
    },
    enableSorting: false,
  },
  {
    accessorKey: 'entrouFilaEm',
    header: sortableHeader('Entrou na fila'),
    cell: ({ row }) => render('span', { class: 'text-nowrap text-sm' }, formatDataHora(row.original.entrouFilaEm)),
  },
  {
    accessorKey: 'assumidoEm',
    header: sortableHeader('Assumido'),
    cell: ({ row }) => render('span', { class: 'text-nowrap text-sm' }, formatDataHora(row.original.assumidoEm)),
  },
  {
    accessorKey: 'finalizadoEm',
    header: sortableHeader('Finalizado'),
    cell: ({ row }) => render('span', { class: 'text-nowrap text-sm' }, formatDataHora(row.original.finalizadoEm)),
  },
  {
    accessorKey: 'esperaMs',
    header: sortableHeader('Espera'),
    // "—" aqui é espera não medida (o ciclo começou antes do período), não espera zero.
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatDuracaoMs(row.original.esperaMs),
        color: (row.original.esperaMs ?? 0) > 3_600_000 ? 'red' : 'gray',
        capitalize: false,
      }),
  },
  {
    accessorKey: 'duracaoMs',
    header: sortableHeader('Duração'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatDuracaoMs(row.original.duracaoMs),
        color: 'gray',
        capitalize: false,
      }),
  },
]
