import DataTableColumnHeader from '@/components/tabela/DataTableColumnHeader.vue'
import { Button } from '@/components/ui/button'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { render } from '@/lib/utils'
import type { AssinaturaComodatoListItem } from '@/repositories/assinatura-repository'
import { formatDateToPtBR } from '@/utils/formatters'
import type { ColumnDef } from '@tanstack/vue-table'
import { Package, ReceiptText, UserRound } from 'lucide-vue-next'
import { RouterLink } from 'vue-router'
import { getStatusComodatoMeta } from '../shared'

export const columnsComodatosAssinatura: ColumnDef<AssinaturaComodatoListItem>[] = [
  {
    accessorKey: 'produto',
    header: () => render('div', {}, 'Produto'),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: row.original.produto?.nome || 'Produto sem vínculo',
        color: 'gray',
        icon: Package,
        capitalize: false,
      }),
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Status' }),
    cell: ({ row }) => {
      const status = getStatusComodatoMeta(row.original.status)
      const color =
        row.original.status === 'DEVOLVIDO'
          ? 'green'
          : row.original.status === 'PERDIDO'
            ? 'red'
            : row.original.status === 'AVARIADO'
              ? 'orange'
              : 'blue'

      return render(BadgeCell, {
        label: status.label,
        color,
        icon: ReceiptText,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'assinatura',
    header: () => render('div', {}, 'Contrato / cliente'),
    cell: ({ row }) =>
      render('div', { class: 'space-y-1' }, [
        render('div', { class: 'font-medium text-foreground' }, row.original.assinatura.nomeContrato),
        render(BadgeCell, {
          label: row.original.assinatura.cliente,
          color: 'blue',
          icon: UserRound,
          capitalize: false,
          size: 'sm',
        }),
      ]),
    enableSorting: false,
  },
  {
    accessorKey: 'quantidade',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Quantidade' }),
  },
  {
    accessorKey: 'dataEntrega',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Entrega' }),
    cell: ({ row }) => render('div', {}, formatDateToPtBR(row.original.dataEntrega)),
  },
  {
    accessorKey: 'dataDevolucao',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Devolução' }),
    cell: ({ row }) => render('div', {}, row.original.dataDevolucao ? formatDateToPtBR(row.original.dataDevolucao) : '-'),
  },
  {
    id: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) =>
      render('div', { class: 'text-right' }, [
        render(
          RouterLink,
          { to: `/assinaturas/assinaturas/${row.original.assinatura.id}` },
          () => render(Button, { variant: 'outline', size: 'sm' }, () => 'Abrir contrato'),
        ),
      ]),
  },
]
