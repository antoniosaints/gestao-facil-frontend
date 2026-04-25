import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { ContasFinanceiro } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import { ArrowUpDown, Wallet } from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import Actions from './Actions.vue'
import { formatCurrencyBR } from '@/utils/formatters'
import { resolveFileUrl } from '@/utils/fileUrl'

export const columnsContasFinanceiras: ColumnDef<ContasFinanceiro>[] = [
  {
    accessorKey: 'nome',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Conta', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render('div', { class: 'flex items-center gap-3 min-w-[220px]' }, [
        render(
          'div',
          {
            class: 'flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border',
            style: {
              backgroundColor: `${row.original.corDestaque || '#2563EB'}14`,
              borderColor: row.original.corDestaque || undefined,
            },
          },
          row.original.icone
            ? render('img', {
                src: resolveFileUrl(row.original.icone, { fallback: '/imgs/logo.png' }),
                alt: 'Ícone da conta',
                class: 'h-full w-full object-cover',
              })
            : render(Wallet, {
                class: 'h-4 w-4',
                style: { color: row.original.corDestaque || '#2563EB' },
              }),
        ),
        render('div', { class: 'min-w-0' }, [
          render('div', { class: 'font-medium truncate' }, row.original.nome),
          render('div', { class: 'text-xs text-muted-foreground truncate' }, row.original.Uid || `#${row.original.id}`),
        ]),
      ]),
  },
  {
    accessorKey: 'saldoInicial',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Saldo inicial', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatCurrencyBR(Number(row.original.saldoInicial || 0)),
        color: 'gray',
        capitalize: false,
      }),
  },
  {
    accessorKey: 'saldoAtual',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Saldo atual', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(BadgeCell, {
        label: formatCurrencyBR(Number(row.original.saldoAtual || 0)),
        color: Number(row.original.saldoAtual || 0) >= 0 ? 'green' : 'red',
        capitalize: false,
      }),
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) => render('div', { class: 'text-right' }, [render(Actions, { data: { ...row.original } })]),
  },
]
