import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { ClientesFornecedores } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown } from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import Actions from '@/pages/clientes/tabela/Actions.vue'

export const columnsClientes: ColumnDef<ClientesFornecedores>[] = [
  {
    accessorKey: 'Uid',
    enableSorting: false,
    header: () => render('div', { class: 'ml-2 h-4 w-4' }, 'ID'),
    cell: ({ row }) => {
      const tipo =
        row.original.tipo == 'CLIENTE' ? 'fa-solid fa-user-tag' : 'fa-solid fa-business-time'
      return render(BadgeCell, {
        label: row.getValue('Uid') as string,
        color: 'gray',
        icon: tipo,
        capitalize: false,
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
      const tipo = row.original.status == 'ATIVO' ? 'fa-solid fa-check' : 'fa-solid fa-xmark'
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
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Nome', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
  },
  {
    accessorKey: 'documento',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['CPF/CNPJ', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => render('div', { class: 'text-left' }, row.original.documento || '-'),
  },
  {
    accessorKey: 'email',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['E-mail', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => render('div', { class: 'text-left' }, row.original.email || '-'),
  },
  {
    accessorKey: 'telefone',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Telefone', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
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
