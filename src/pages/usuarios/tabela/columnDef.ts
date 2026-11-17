import DataTableColumnHeader from '@/components/tabela/DataTableColumnHeader.vue'
import { render } from '@/lib/utils'
import type { Usuarios } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  Ban,
  BellOff,
  BellRing,
  CircleCheck,
  MailCheck,
  MailX,
  SquareArrowRight,
} from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import Actions from './Actions.vue'

export const columnsUsuarios: ColumnDef<Usuarios>[] = [
  {
    accessorKey: 'status',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) => {
      const tipo = row.original.status == 'ATIVO' ? CircleCheck : Ban
      const color = row.original.status == 'ATIVO' ? 'green' : 'red'
      return render(BadgeCell, {
        label: row.getValue('status') as string,
        color: color,
        icon: tipo,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'nome',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Nome' }),
  },
  {
    accessorKey: 'permissao',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Permissão' }),
    cell: ({ row }) => {
      let color: any = 'gray'
      switch (row.original.permissao) {
        case 'root':
        case 'admin':
          color = 'purple'
          break
        case 'gerente':
          color = 'green'
          break
        case 'vendedor':
        case 'tecnico':
          color = 'blue'
          break
        case 'usuario':
          color = 'gray'
          break
      }
      return render(BadgeCell, {
        label: row.getValue('permissao') as string,
        color: color,
        icon: SquareArrowRight,
      })
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'E-mail' }),
    cell: ({ row }) => render('div', { class: 'text-left' }, row.original.email || '-'),
  },
  {
    accessorKey: 'pushReceiver',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Push' }),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.pushReceiver ? 'Sim' : 'Nao',
        color: row.original.pushReceiver ? 'green' : 'red',
        icon: row.original.pushReceiver ? BellRing : BellOff,
      }),
  },
  {
    accessorKey: 'emailReceiver',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'E-mail' }),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.emailReceiver ? 'Sim' : 'Nao',
        color: row.original.emailReceiver ? 'green' : 'red',
        icon: row.original.emailReceiver ? MailCheck : MailX,
      }),
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row, table }) => {
      return render('div', { class: 'text-right' }, [
        render(Actions, { data: { ...row.original } }),
      ])
    },
  },
]
