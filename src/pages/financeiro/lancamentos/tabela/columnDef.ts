import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { CategoriaFinanceiro, LancamentoFinanceiro, ParcelaFinanceiro } from '@/@types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  ArrowUpDown,
  BadgeCheck,
  Calendar,
  CircleDollarSign,
  ClockAlert,
  FlagTriangleRight,
  Loader,
  Tag,
  TrendingDown,
  TrendingUp,
  Ungroup,
} from 'lucide-vue-next'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import Actions from './Actions.vue'
import { formatCurrencyBR } from '@/utils/formatters'
import { formatDate, isAfter } from 'date-fns'
import { RouterLink } from 'vue-router'
import { Checkbox } from '@/components/ui/checkbox'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
const store = useLancamentosStore()
export const columnsLancamentos: ColumnDef<
  LancamentoFinanceiro & { parcelas: Array<ParcelaFinanceiro>; categoria: CategoriaFinanceiro }
>[] = [
  {
    id: 'select',
    header: ({ table }) => render('div', {}, ''),
    cell: ({ row }) =>
      render(Checkbox, {
        modelValue: store.selectedIds.includes(row.original.id!),
        'onUpdate:modelValue': (value: boolean | string) => {
          row.toggleSelected(!!value)
          if (value) store.addSelectedId(row.original.id!)
          else store.removeSelectedId(row.original.id!)
        },
        ariaLabel: 'Select row',
      }),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'Uid',
    enableSorting: false,
    header: () => render('div', { class: 'ml-2 h-4 w-4' }, 'ID'),
    cell: ({ row }) => {
      return render(RouterLink, { to: `/financeiro/detalhes?id=${row.original.id}` }, () =>
        render(BadgeCell, {
          label: row.getValue('Uid') as string,
          color: 'gray',
          icon: row.original.vendaId ? Tag : CircleDollarSign,
          capitalize: false,
        }),
      )
    },
  },
  {
    accessorKey: 'tipo',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Tipo', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: row.getValue('tipo') as string,
        color: row.original.tipo === 'RECEITA' ? 'green' : 'red',
        icon: row.original.tipo === 'RECEITA' ? TrendingUp : TrendingDown,
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
      const status = row.original.status as string
      const parcelas = row.original.parcelas.filter((p) => p.numero !== 0)
      const efetivadas = parcelas.filter((p) => p.pago).length
      const pendentes = parcelas.length - efetivadas
      const hasOverdue = parcelas.some(
        (p) => !p.pago && isAfter(new Date(), new Date(p.vencimento)),
      )

      // Mapeamento direto de cores e ícones
      const statusConfig: Record<
        string,
        { color: 'green' | 'blue' | 'yellow' | 'red'; icon: any }
      > = {
        PAGO: { color: 'green', icon: BadgeCheck },
        PARCIAL: { color: 'blue', icon: Ungroup },
        PENDENTE: { color: 'yellow', icon: Loader },
        ATRASADO: { color: 'red', icon: ClockAlert },
      }

      let { color, icon } = statusConfig[status] || { color: 'gray', icon: BadgeCheck }
      let label = status

      if (pendentes > 0 && row.original.recorrente) {
        const percentual = Math.round((efetivadas / parcelas.length) * 100)
        label = `${efetivadas}/${parcelas.length} ${percentual}%`
      }

      if (hasOverdue) {
        color = 'red'
        icon = ClockAlert
      }

      return render(BadgeCell, {
        label,
        color,
        icon,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'descricao',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Descrição', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) =>
      render(
        'div',
        {
          class: 'text-left w-full truncate max-w-[450px] p-1 px-2 rounded-md',
        },
        row.original.vendaId
          ? `🏷️ ${row.getValue('descricao')}`
          : `${row.getValue('descricao') as string}`,
      ),
  },
  {
    accessorKey: 'valorTotal',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Valor', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: formatCurrencyBR(row.original.parcelas.reduce((acc, p) => acc + Number(p.valor), 0)),
        color: row.original.tipo === 'RECEITA' ? 'green' : 'red',
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'dataLancamento',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Data', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: formatDate(row.getValue('dataLancamento') as string, 'dd/MM/yyyy'),
        color: 'gray',
        icon: Calendar,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'categoriaId',
    enableColumnFilter: false,
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Categoria', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      return render(BadgeCell, {
        label: row.original.categoria.nome,
        color: 'blue',
        icon: FlagTriangleRight,
        capitalize: false,
      })
    },
  },
  {
    accessorKey: 'acoes',
    enableSorting: false,
    enableColumnFilter: false,
    enableHiding: false,
    header: () => render('div', { class: 'text-right' }, 'Ações'),
    cell: ({ row }) => {
      return render('div', { class: 'text-right' }, [
        render(Actions, { data: { ...row.original } }),
      ])
    },
  },
]
