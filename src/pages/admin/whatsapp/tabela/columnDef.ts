import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { AdminWhatsAppInstance } from '@/repositories/whatsapp-repository'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  AlertTriangle,
  ArrowUpDown,
  Building2,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Phone,
  Smartphone,
  WifiOff,
} from 'lucide-vue-next'
import Actions from './Actions.vue'

function statusBadge(status: AdminWhatsAppInstance['status']) {
  if (status === 'CONECTADA')
    return { label: 'Conectada', color: 'green' as const, icon: CheckCircle2 }
  if (status === 'ERRO') return { label: 'Erro', color: 'red' as const, icon: AlertTriangle }
  if (status === 'CONECTANDO' || status === 'PENDENTE') {
    return {
      label: status === 'CONECTANDO' ? 'Conectando' : 'Pendente',
      color: 'orange' as const,
      icon: LoaderCircle,
    }
  }
  return { label: 'Desconectada', color: 'gray' as const, icon: WifiOff }
}

const sortableHeader =
  (label: string) =>
  ({ column }: any) =>
    render(
      Button,
      {
        variant: 'ghost',
        onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
      },
      () => [label, render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
    )

export const columnsAdminWhatsApp: ColumnDef<AdminWhatsAppInstance>[] = [
  {
    accessorKey: 'nome',
    header: sortableHeader('Instância'),
    cell: ({ row }) =>
      render('div', { class: 'max-w-[240px] leading-tight' }, [
        render('div', { class: 'flex items-center gap-2 font-medium text-foreground' }, [
          render(Smartphone, { class: 'h-4 w-4 shrink-0 text-primary' }),
          render('span', { class: 'truncate', title: row.original.nome }, row.original.nome),
        ]),
        render(
          'div',
          {
            class: 'mt-1 truncate pl-6 text-xs text-muted-foreground',
            title: row.original.instanceId,
          },
          row.original.instanceId,
        ),
      ]),
  },
  {
    id: 'assinante',
    enableSorting: false,
    header: () => 'Assinante',
    cell: ({ row }) =>
      render('div', { class: 'max-w-[260px] leading-tight' }, [
        render('div', { class: 'flex items-center gap-2 font-medium text-foreground' }, [
          render(Building2, { class: 'h-4 w-4 shrink-0 text-violet-500' }),
          render(
            'span',
            { class: 'truncate', title: row.original.Conta.nome },
            row.original.Conta.nomeFantasia || row.original.Conta.nome,
          ),
        ]),
        render(
          'div',
          {
            class: 'mt-1 truncate pl-6 text-xs text-muted-foreground',
            title: row.original.Conta.email,
          },
          row.original.Conta.email,
        ),
      ]),
  },
  {
    accessorKey: 'numeroConectado',
    header: sortableHeader('Número'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.numeroConectado || 'Sem número',
        color: row.original.numeroConectado ? 'blue' : 'gray',
        icon: Phone,
        capitalize: false,
      }),
  },
  {
    accessorKey: 'status',
    header: sortableHeader('Status'),
    cell: ({ row }) => {
      const badge = statusBadge(row.original.status)
      return render(BadgeCell, badge)
    },
  },
  {
    accessorKey: 'lastSyncAt',
    header: sortableHeader('Sincronização'),
    cell: ({ row }) =>
      render('div', { class: 'flex items-center gap-2 text-sm text-muted-foreground' }, [
        render(Clock3, { class: 'h-4 w-4' }),
        row.original.lastSyncAt
          ? new Date(row.original.lastSyncAt).toLocaleString('pt-BR')
          : 'Nunca',
      ]),
  },
  {
    id: 'acoes',
    enableSorting: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) =>
      render('div', { class: 'text-right' }, [render(Actions, { data: row.original })]),
  },
]
