import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { RelatoBug, RelatoBugSeveridade, RelatoBugStatus } from '@/repositories/bug-repository'
import { formatDateToPtBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  ArrowUpDown,
  Bug,
  CircleCheck,
  CircleDot,
  Search,
  Trash2,
  TriangleAlert,
} from 'lucide-vue-next'
import Actions from './Actions.vue'

type BadgeColor = 'gray' | 'blue' | 'emerald' | 'red' | 'orange' | 'yellow'

export function getStatusBadge(status: RelatoBugStatus) {
  switch (status) {
    case 'ABERTO':
      return { label: 'Aberto', color: 'yellow' as BadgeColor, icon: CircleDot }
    case 'EM_ANALISE':
      return { label: 'Em análise', color: 'blue' as BadgeColor, icon: Search }
    case 'RESOLVIDO':
      return { label: 'Resolvido', color: 'emerald' as BadgeColor, icon: CircleCheck }
    case 'DESCARTADO':
      return { label: 'Descartado', color: 'gray' as BadgeColor, icon: Trash2 }
    default:
      return { label: status, color: 'gray' as BadgeColor, icon: CircleDot }
  }
}

export function getSeveridadeBadge(severidade: RelatoBugSeveridade) {
  switch (severidade) {
    case 'BAIXA':
      return { label: 'Baixa', color: 'gray' as BadgeColor, icon: CircleDot }
    case 'MEDIA':
      return { label: 'Média', color: 'yellow' as BadgeColor, icon: CircleDot }
    case 'ALTA':
      return { label: 'Alta', color: 'orange' as BadgeColor, icon: TriangleAlert }
    case 'CRITICA':
      return { label: 'Crítica', color: 'red' as BadgeColor, icon: TriangleAlert }
    default:
      return { label: severidade, color: 'gray' as BadgeColor, icon: CircleDot }
  }
}

export const columnsBugs: ColumnDef<RelatoBug>[] = [
  {
    accessorKey: 'id',
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
        label: `#${row.original.id}`,
        color: 'gray',
        icon: Bug,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'titulo',
    enableSorting: false,
    header: () => 'Problema',
    cell: ({ row }) =>
      render('div', { class: 'leading-tight max-w-[320px]' }, [
        render(
          'div',
          { class: 'font-medium text-foreground truncate', title: row.original.titulo },
          row.original.titulo,
        ),
        render(
          'div',
          { class: 'text-xs text-muted-foreground truncate', title: row.original.descricao },
          row.original.descricao,
        ),
      ]),
  },
  {
    accessorKey: 'conta',
    enableSorting: false,
    header: () => 'Origem',
    cell: ({ row }) =>
      render('div', { class: 'leading-tight max-w-[200px]' }, [
        render(
          'div',
          { class: 'text-sm text-foreground truncate', title: row.original.Conta?.nome || '' },
          row.original.Conta?.nome || '—',
        ),
        render(
          'div',
          { class: 'text-xs text-muted-foreground truncate' },
          row.original.Usuario?.nome || 'Usuário removido',
        ),
      ]),
  },
  {
    accessorKey: 'severidade',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Gravidade', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      const badge = getSeveridadeBadge(row.original.severidade)
      return render(BadgeCell, {
        label: badge.label,
        color: badge.color,
        icon: badge.icon,
        capitalize: false,
        size: 'sm',
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
      const badge = getStatusBadge(row.original.status)
      return render(BadgeCell, {
        label: badge.label,
        color: badge.color,
        icon: badge.icon,
        capitalize: false,
      })
    },
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
        () => ['Recebido', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(
        'div',
        { class: 'text-sm text-foreground text-nowrap' },
        formatDateToPtBR(row.original.createdAt, true),
      ),
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) =>
      render('div', { class: 'text-right' }, [render(Actions, { data: { ...row.original } })]),
  },
]
