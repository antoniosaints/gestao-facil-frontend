import DataTableColumnHeader from '@/components/tabela/DataTableColumnHeader.vue'
import { render } from '@/lib/utils'
import type { ClientesFornecedores } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import { Ban, Building, CircleCheck, UserSearch } from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import Actions from '@/pages/clientes/tabela/Actions.vue'
import router from '@/router'

export const columnsClientes: ColumnDef<ClientesFornecedores>[] = [
  {
    accessorKey: 'Uid',
    enableSorting: false,
    header: () => render('div', { class: 'ml-2 h-4 w-4' }, 'ID'),
    cell: ({ row }) => {
      const tipo = row.original.tipo == 'CLIENTE' ? UserSearch : Building
      return render(
        'button',
        {
          class: 'inline-flex cursor-pointer transition hover:opacity-80',
          title: 'Abrir detalhes do cliente',
          onClick: () => router.push({ name: 'clientes-detalhes', params: { id: row.original.id } }),
        },
        [
          render(BadgeCell, {
            label: row.getValue('Uid') as string,
            color: 'gray',
            icon: tipo,
            capitalize: false,
          }),
        ],
      )
    },
  },
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
    accessorKey: 'documento',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'CPF/CNPJ' }),
    cell: ({ row }) => render('div', { class: 'text-left' }, row.original.documento || '-'),
  },
  {
    accessorKey: 'email',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'E-mail' }),
    cell: ({ row }) => render('div', { class: 'text-left' }, row.original.email || '-'),
  },
  {
    accessorKey: 'telefone',
    header: ({ column }) =>
      render(DataTableColumnHeader, { column, title: 'Telefone' }),
    cell: ({ row }) => render('div', { class: 'text-left' }, row.original.telefone || '-'),
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
