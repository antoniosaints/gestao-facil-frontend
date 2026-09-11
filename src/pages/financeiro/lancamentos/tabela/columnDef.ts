import { Button } from '@/components/ui/button'
import { render } from '@/lib/utils'
import type { CategoriaFinanceiro, LancamentoFinanceiro, ParcelaFinanceiro } from '@/types/schemas'
import type { ColumnDef } from '@tanstack/vue-table'
import {
  ArrowUpDown,
  ArrowUpRightSquare,
  BadgeCheck,
  Calendar,
  ClockAlert,
  EyeOff,
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
import { getDatasTabelaLancamento } from './dateColumns'
import { getResumoValorLancamento } from './valorExibido'
const store = useLancamentosStore()
export const columnsLancamentos: ColumnDef<
  LancamentoFinanceiro & { parcelas: Array<ParcelaFinanceiro>; categoria: CategoriaFinanceiro }
>[] = [
  {
    id: 'select',
    enableSorting: false,
    enableHiding: false,
    header: ({ table }) => {
      const rows = table.getRowModel().rows
      // Ler selectedIds.length é essencial: garante que o header re-renderize a cada
      // mudança de seleção. O filter abaixo não acessa selectedIds quando `rows` está
      // vazio no render, então sem esta leitura o header nunca reflete o "selecionar todas".
      const totalSelecionados = store.selectedIds.length
      const naPagina = rows.filter((r) => store.selectedIds.includes(r.original.id!)).length
      const modelValue =
        rows.length > 0 && naPagina === rows.length
          ? true
          : naPagina > 0 || (rows.length === 0 && totalSelecionados > 0)
            ? 'indeterminate'
            : false
      return render(Checkbox, {
        modelValue,
        // Lê as linhas e o estado NO MOMENTO DO CLIQUE (não no render): o header não
        // re-renderiza quando os dados chegam, então um `rows` capturado no render fica
        // vazio/estale e a seleção não funcionaria.
        'onUpdate:modelValue': () => {
          const atuais = table.getRowModel().rows
          const todasSelecionadas =
            atuais.length > 0 && atuais.every((r) => store.selectedIds.includes(r.original.id!))
          const marcar = !todasSelecionadas
          atuais.forEach((r) => {
            r.toggleSelected(marcar)
            if (marcar) store.addSelectedId(r.original.id!)
            else store.removeSelectedId(r.original.id!)
          })
        },
        ariaLabel: 'Selecionar todos',
      })
    },
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
    RouterLink,
    {
      to: `/financeiro/detalhes?id=${row.original.id}`,
      class:
        'min-w-0 p-1 px-2 pl-4 flex items-center gap-2 cursor-pointer transition-colors',
      title: 'Ver detalhes',
    },
    () => [
      row.original.notificarVencimento
        ? render('div', { class: 'flex flex-wrap items-center gap-2 shrink-0' }, [
            render('i', {
              class: 'fa-solid fa-bell text-yellow-600',
            }),
          ])
        : null,

      row.original.ignorado ||
      row.original.parcelas.some((parcela) => parcela.ignorado)
        ? render(BadgeCell, {
            label: 'Ignorado',
            color: 'gray',
            icon: EyeOff,
            capitalize: false,
            size: 'sm',
          })
        : null,

      render(
        'div',
        {
          class: 'truncate max-w-[420px] font-medium text-left',
        },
        row.original.vendaId
          ? `🏷️ ${row.getValue('descricao')}`
          : `${row.getValue('descricao') as string}`,
      ),

      render(
        'div',
        {
          class:
            'shrink-0 text-gray-600 dark:text-gray-300 border border-border rounded flex items-center transition-colors',
        },
        [
          render(ArrowUpRightSquare, {
            class: 'w-4 h-4',
          }),
        ],
      ),

      row.original.origemSistema === 'ASSINATURA_PAGAR' &&
      row.original.assinaturaPagar
        ? render(
            'div',
            {
              class: 'mt-1 flex flex-wrap items-center gap-2',
            },
            [
              render(BadgeCell, {
                label: 'Assinatura',
                color: 'violet',
                icon: Tag,
                capitalize: false,
                size: 'sm',
              }),
            ],
          )
        : null,
    ],
  ),
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
      let status = row.original.status as string
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

      // O status persistido na API é a regra principal. O cálculo abaixo só
      // cobre o vencimento que pode ter ocorrido desde a última atualização.
      if (hasOverdue && status === 'PENDENTE') status = 'ATRASADO'

      const { color, icon } = statusConfig[status] || { color: 'gray', icon: BadgeCheck }
      let label = status

      if (pendentes > 0 && row.original.recorrente) {
        const percentual = Math.round((efetivadas / parcelas.length) * 100)
        label = `${status} (${efetivadas}/${parcelas.length} · ${percentual}%)`
      }

      if (row.original.recorrencia?.ativo) {
        label = `${status} · FIXA (${efetivadas}/${parcelas.length})`
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
    accessorKey: 'valorTotal',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => [
          store.exibirValorParcelasAtuais ? 'Pendente/Total' : 'Valor',
          render(ArrowUpDown, { class: 'ml-2 h-4 w-4' }),
        ],
    ),
    cell: ({ row }) => {
      const { temParcelasEmAberto, valorPendente, valorTotal } = getResumoValorLancamento(
        row.original.parcelas,
      )
      const label = store.exibirValorParcelasAtuais && temParcelasEmAberto
        ? `${formatCurrencyBR(valorPendente)}/${formatCurrencyBR(valorTotal)}`
        : formatCurrencyBR(valorTotal)

      if (store.exibirValorParcelasAtuais && temParcelasEmAberto) {
        return render('span', { class: 'inline-flex items-center gap-1 font-medium' }, [
          render('span', { class: 'text-yellow-700 dark:text-yellow-300' }, formatCurrencyBR(valorPendente)),
          render('span', { class: 'text-muted-foreground' }, '/'),
          render(
            'span',
            {
              class:
                row.original.tipo === 'RECEITA'
                  ? 'text-green-800 dark:text-green-300'
                  : 'text-red-800 dark:text-red-300',
            },
            formatCurrencyBR(valorTotal),
          ),
        ])
      }

      return render(BadgeCell, {
        label,
        color: row.original.tipo === 'RECEITA' ? 'green' : 'red',
        capitalize: false,
      })
    },
  },
  {
    id: 'vencimento',
    header: ({ column }) =>
      render(
        Button,
        {
          variant: 'ghost',
          onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
        },
        () => ['Vencimento', render(ArrowUpDown, { class: 'ml-2 h-4 w-4' })],
      ),
    cell: ({ row }) => {
      const { vencimento } = getDatasTabelaLancamento(row.original.parcelas)
      return render(BadgeCell, {
        label: vencimento ? formatDate(vencimento, 'dd/MM/yyyy') : '—',
        color: 'gray',
        icon: Calendar,
        capitalize: false,
      })
    },
  },
  {
    id: 'quitacao',
    enableSorting: false,
    header: () => render('div', {}, 'Quitação'),
    cell: ({ row }) => {
      const { quitacao } = getDatasTabelaLancamento(row.original.parcelas)
      return render(BadgeCell, {
        label: quitacao ? formatDate(quitacao, 'dd/MM/yyyy') : '—',
        color: 'green',
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
