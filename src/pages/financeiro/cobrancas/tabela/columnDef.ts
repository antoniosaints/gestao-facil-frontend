import EntityLink from '@/components/navigation/EntityLink.vue'
import DataTableColumnHeader from '@/components/tabela/DataTableColumnHeader.vue'
import { render } from '@/lib/utils'
import type { CobrancaFinanceira } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  Ban,
  Calendar,
  CircleCheck,
  HandCoins,
  Link2,
  Loader,
} from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import Actions from './Actions.vue'
import { formatCurrencyBR } from '@/utils/formatters'

export const columnsCobrancas: ColumnDef<CobrancaFinanceira>[] = [
  {
    accessorKey: 'idCobranca',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'ID' }),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: row.original.idCobranca,
        color: 'gray',
        icon: HandCoins,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) => {
      let icon = Loader
      let color: 'yellow' | 'green' | 'red' | 'blue' | 'gray' = 'gray'
      switch (row.original.status) {
        case 'PENDENTE':
          icon = Loader
          color = 'yellow'
          break
        case 'EFETIVADO':
          icon = CircleCheck
          color = 'green'
          break
        case 'CANCELADO':
          icon = Ban
          color = 'red'
          break
        case 'ESTORNADO':
          icon = Link2
          color = 'blue'
          break
      }
      return render(BadgeCell, {
        label: row.original.status,
        color: color,
        icon: icon,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'observacao',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Observação' }),
    cell: ({ row }) => {
      const observacao = row.original.observacao
      if (row.original.lancamentoId) {
        return render(EntityLink, { kind: 'lancamento', recordId: row.original.LancamentoParcela?.lancamentoId, label: 'Parcela financeira' })
      }
      if (row.original.vendaId) {
        return render(EntityLink, { kind: 'venda', recordId: row.original.vendaId, label: row.original.Venda?.Uid || `Venda #${row.original.vendaId}` })
      }
      if (row.original.ordemServicoId) {
        return render(EntityLink, { kind: 'ordem', recordId: row.original.ordemServicoId, label: row.original.Ordemservico?.Uid || `OS #${row.original.ordemServicoId}` })
      }
      return render(BadgeCell, {
        label: observacao as string,
        color: 'gray',
        icon: HandCoins,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'dataVencimento',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Vencimento' }),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: row.original.dataVencimento
          ? new Date(row.original.dataVencimento).toLocaleDateString()
          : '-',
        color: 'gray',
        icon: Calendar,
        capitalize: true,
      })
    },
  },
  {
    accessorKey: 'valor',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Valor' }),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: formatCurrencyBR((row.original.valor as number) || 0),
        color: 'green',
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'gateway',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Gateway' }),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: row.original.gateway,
        color: 'blue',
        icon: Link2,
        capitalize: true,
      })
    },
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
