import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { AcessoSuporteLog } from '@/repositories/conta-repository'
import { formatDateToPtBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Ban, CircleCheck, LifeBuoy, Radio, UserRound } from 'lucide-vue-next'
import Actions from './Actions.vue'

export function getSituacaoBadge(data: AcessoSuporteLog) {
  if (data.ativa) {
    return { label: 'Em andamento', color: 'orange' as const, icon: Radio }
  }

  if (data.encerradoPor === 'REVOGADO') {
    return { label: 'Revogado', color: 'red' as const, icon: Ban }
  }

  return { label: 'Encerrado', color: 'gray' as const, icon: CircleCheck }
}

export const columnsAcessosSuporte: ColumnDef<AcessoSuporteLog>[] = [
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
        label: row.original.Uid,
        color: 'gray',
        icon: LifeBuoy,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'contaNome',
    enableSorting: false,
    header: () => 'Conta acessada',
    cell: ({ row }) =>
      render('div', { class: 'leading-tight max-w-[220px]' }, [
        render(
          'div',
          { class: 'font-medium text-foreground truncate', title: row.original.contaNome },
          row.original.contaNome,
        ),
        render(
          'div',
          { class: 'text-xs text-muted-foreground truncate', title: row.original.usuarioAlvoEmail },
          `como ${row.original.usuarioAlvoEmail}`,
        ),
      ]),
  },
  {
    accessorKey: 'superAdminNome',
    enableSorting: false,
    header: () => 'Quem acessou',
    cell: ({ row }) =>
      render('div', { class: 'leading-tight max-w-[220px]' }, [
        render(
          'div',
          { class: 'font-medium text-foreground truncate', title: row.original.superAdminNome },
          row.original.superAdminNome,
        ),
        render(
          'div',
          { class: 'text-xs text-muted-foreground truncate', title: row.original.superAdminEmail },
          row.original.superAdminEmail,
        ),
      ]),
  },
  {
    accessorKey: 'motivo',
    enableSorting: false,
    header: () => 'Motivo',
    cell: ({ row }) =>
      render(
        'div',
        {
          class: 'text-sm text-foreground max-w-[260px] truncate',
          title: row.original.motivo,
        },
        row.original.motivo,
      ),
  },
  {
    accessorKey: 'ativa',
    enableSorting: false,
    header: () => 'Situação',
    cell: ({ row }) => {
      const badge = getSituacaoBadge(row.original)
      return render(BadgeCell, {
        label: badge.label,
        color: badge.color,
        icon: badge.icon,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'iniciadoEm',
    enableSorting: false,
    header: () => 'Início',
    cell: ({ row }) =>
      render(
        'div',
        { class: 'text-sm text-foreground text-nowrap' },
        formatDateToPtBR(row.original.iniciadoEm, true),
      ),
  },
  {
    accessorKey: 'encerradoEm',
    enableSorting: false,
    header: () => 'Término',
    cell: ({ row }) =>
      render('div', { class: 'leading-tight' }, [
        render(
          'div',
          { class: 'text-sm text-foreground text-nowrap' },
          formatDateToPtBR(row.original.encerradoEm || row.original.expiraEm, true),
        ),
        render(
          'div',
          { class: 'text-xs text-muted-foreground text-nowrap' },
          row.original.encerradoEm ? 'encerrado' : 'expira',
        ),
      ]),
  },
  {
    accessorKey: 'ip',
    enableSorting: false,
    header: () => 'IP',
    cell: ({ row }) =>
      render(
        'div',
        {
          class: 'text-xs text-muted-foreground max-w-[140px] truncate',
          title: row.original.userAgent || '',
        },
        row.original.ip || '-',
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
