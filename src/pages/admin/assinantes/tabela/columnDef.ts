import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { ContaAssinanteAdmin } from '@/repositories/conta-repository'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, CalendarClock, CircleDollarSign, CircleOff, CreditCard, ShieldCheck, UserRound } from 'lucide-vue-next'
import Actions from './Actions.vue'

function getAssinaturaBadge(data: ContaAssinanteAdmin) {
  if (data.statusAssinatura === 'VENCIDA') {
    return {
      label: `Vencida há ${Math.abs(data.diasParaVencer)}d`,
      color: 'red' as const,
      icon: CircleOff,
    }
  }

  if (data.statusAssinatura === 'VENCE_HOJE') {
    return {
      label: 'Vence hoje',
      color: 'orange' as const,
      icon: CalendarClock,
    }
  }

  return {
    label: `Em dia (${data.diasParaVencer}d)`,
    color: 'green' as const,
    icon: ShieldCheck,
  }
}

function getStatusBadge(status: string) {
  if (status === 'BLOQUEADO') {
    return {
      label: status,
      color: 'red' as const,
      icon: CircleOff,
    }
  }

  if (status === 'INATIVO') {
    return {
      label: status,
      color: 'orange' as const,
      icon: CalendarClock,
    }
  }

  return {
    label: status,
    color: 'green' as const,
    icon: ShieldCheck,
  }
}

export const columnsAssinantesAdmin: ColumnDef<ContaAssinanteAdmin>[] = [
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
        icon: UserRound,
        capitalize: false,
      }),
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
        () => ['Assinante', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render('div', { class: 'space-y-1 min-w-[250px]' }, [
        render('div', { class: 'font-medium text-foreground' }, row.original.nome),
        render(
          'div',
          { class: 'text-xs text-muted-foreground' },
          row.original.nomeFantasia || row.original.email,
        ),
        row.original.nomeFantasia
          ? render('div', { class: 'text-xs text-muted-foreground' }, row.original.email)
          : null,
      ]),
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
        () => ['Conta', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      const badge = getStatusBadge(row.original.status)
      return render(BadgeCell, {
        label: badge.label,
        color: badge.color,
        icon: badge.icon,
      })
    },
  },
  {
    accessorKey: 'statusAssinatura',
    enableSorting: false,
    header: () => 'Assinatura',
    cell: ({ row }) => {
      const badge = getAssinaturaBadge(row.original)
      return render(BadgeCell, {
        label: badge.label,
        color: badge.color,
        icon: badge.icon,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'vencimento',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Vencimento', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render('div', { class: 'text-sm text-foreground text-nowrap' }, formatDateToPtBR(row.original.vencimento)),
  },
  {
    accessorKey: 'valor',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Plano', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render('div', { class: 'space-y-1 min-w-[140px]' }, [
        render(BadgeCell, {
          label: formatCurrencyBR(row.original.valor),
          color: 'green',
          icon: CircleDollarSign,
          capitalize: false,
        }),
        render('div', { class: 'text-xs text-muted-foreground uppercase' }, row.original.gateway),
      ]),
  },
  {
    accessorKey: 'usuariosTotal',
    enableSorting: false,
    header: () => 'Usuários',
    cell: ({ row }) =>
      render(BadgeCell, {
        label: `${row.original.usuariosTotal}/${row.original.funcionarios || 0}`,
        color: 'blue',
        icon: CreditCard,
        capitalize: false,
      }),
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
