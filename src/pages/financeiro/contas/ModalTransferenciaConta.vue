<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useContasFinanceirasStore } from '@/stores/lancamentos/useContasFinanceiras'
import type { ContaFinanceiraTransferPreviewResponse, ContasFinanceiro, FiltroStatusFinanceiro, FiltroTipoFinanceiro } from '@/types/schemas'
import { formatCurrencyBR, formatDateToPtBR, formatToNumberValue } from '@/utils/formatters'
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  contaOrigem: ContasFinanceiro | null
  filtros?: {
    inicio?: Date | string | null
    fim?: Date | string | null
    tipo?: FiltroTipoFinanceiro
    status?: FiltroStatusFinanceiro
    search?: string
  }
}>()

const emit = defineEmits<{
  completed: []
}>()

const toast = useToast()
const contasStore = useContasFinanceirasStore()
const loading = ref(false)
const loadingContas = ref(false)
const loadingPreview = ref(false)
const contas = ref<ContasFinanceiro[]>([])
const preview = ref<ContaFinanceiraTransferPreviewResponse['preview'] | null>(null)
const form = ref({
  modo: 'GERAR_FINANCEIRO' as 'GERAR_FINANCEIRO' | 'MOVER_LANCAMENTOS',
  contaDestinoId: '',
  valor: '',
  data: new Date() as Date | string,
  descricao: '',
})

const title = computed(() => `Transferir valores • ${props.contaOrigem?.nome || 'Conta de origem'}`)
const description = computed(() =>
  form.value.modo === 'GERAR_FINANCEIRO'
    ? 'Gera uma saída na conta de origem e uma entrada na conta de destino, mantendo rastreabilidade no financeiro.'
    : 'Move apenas a conta financeira dos lançamentos filtrados, sem criar novos lançamentos e sem poluir a listagem.',
)

const contasDestino = computed(() =>
  contas.value.filter((conta) => Number(conta.id) !== Number(props.contaOrigem?.id)),
)

const resumoFiltros = computed(() => {
  const filtros = props.filtros
  if (!filtros) return [] as string[]

  const chips: string[] = []
  if (filtros.inicio && filtros.fim) {
    chips.push(`Período: ${formatDateToPtBR(filtros.inicio)} até ${formatDateToPtBR(filtros.fim)}`)
  }
  if (filtros.tipo && filtros.tipo !== 'TODOS') {
    chips.push(`Tipo: ${filtros.tipo === 'RECEITA' ? 'Entradas' : 'Saídas'}`)
  }
  if (filtros.status && filtros.status !== 'TODOS') {
    chips.push(`Status: ${filtros.status}`)
  }
  if (filtros.search?.trim()) {
    chips.push(`Busca: ${filtros.search.trim()}`)
  }
  return chips
})

const transferenciaAfetaTudo = computed(() => !resumoFiltros.value.length)

async function loadContas() {
  try {
    loadingContas.value = true
    const response = await LancamentosRepository.listarContas()
    contas.value = (response.data ?? []).map((item: ContasFinanceiro) => ({
      id: Number(item.id),
      Uid: item.Uid,
      nome: item.nome,
      saldoInicial: item.saldoInicial ?? 0,
    }))
  } catch (error) {
    console.log(error)
    toast.error('Não foi possível carregar as contas de destino.')
  } finally {
    loadingContas.value = false
  }
}

async function loadPreview() {
  if (!props.contaOrigem?.id || form.value.modo !== 'MOVER_LANCAMENTOS') {
    preview.value = null
    return
  }

  try {
    loadingPreview.value = true
    const response = await LancamentosRepository.previewTransferirContaFinanceira({
      contaOrigemId: Number(props.contaOrigem.id),
      filtros: {
        inicio: props.filtros?.inicio ? new Date(props.filtros.inicio).toISOString() : undefined,
        fim: props.filtros?.fim ? new Date(props.filtros.fim).toISOString() : undefined,
        tipo: props.filtros?.tipo,
        status: props.filtros?.status,
        search: props.filtros?.search?.trim() || undefined,
      },
    })
    preview.value = response.data.preview
  } catch (error: any) {
    console.log(error)
    preview.value = null
    toast.error(error?.response?.data?.message || 'Não foi possível calcular a prévia da transferência.')
  } finally {
    loadingPreview.value = false
  }
}

function resetForm() {
  preview.value = null
  form.value = {
    modo: 'GERAR_FINANCEIRO',
    contaDestinoId: '',
    valor: '',
    data: new Date(),
    descricao: '',
  }
}

async function submit() {
  if (!props.contaOrigem?.id) {
    toast.error('Conta de origem não informada.')
    return
  }

  if (!form.value.contaDestinoId) {
    toast.error('Selecione a conta de destino.')
    return
  }

  if (form.value.modo === 'GERAR_FINANCEIRO' && formatToNumberValue(form.value.valor) <= 0) {
    toast.error('Informe um valor maior que zero para a transferência.')
    return
  }

  if (form.value.modo === 'MOVER_LANCAMENTOS' && !preview.value?.parcelasAfetadas) {
    toast.error('Nenhuma parcela foi encontrada para a transferência com os filtros atuais.')
    return
  }

  try {
    loading.value = true
    await LancamentosRepository.transferirContaFinanceira({
      contaOrigemId: Number(props.contaOrigem.id),
      contaDestinoId: Number(form.value.contaDestinoId),
      modo: form.value.modo,
      valor: form.value.modo === 'GERAR_FINANCEIRO' ? formatToNumberValue(form.value.valor) : undefined,
      data:
        form.value.modo === 'GERAR_FINANCEIRO' && form.value.data
          ? new Date(form.value.data).toISOString()
          : undefined,
      descricao: form.value.descricao.trim() || undefined,
      filtros:
        form.value.modo === 'MOVER_LANCAMENTOS'
          ? {
              inicio: props.filtros?.inicio ? new Date(props.filtros.inicio).toISOString() : undefined,
              fim: props.filtros?.fim ? new Date(props.filtros.fim).toISOString() : undefined,
              tipo: props.filtros?.tipo,
              status: props.filtros?.status,
              search: props.filtros?.search?.trim() || undefined,
            }
          : undefined,
    })

    toast.success(
      form.value.modo === 'GERAR_FINANCEIRO'
        ? 'Transferência registrada com sucesso.'
        : 'Lançamentos transferidos de conta com sucesso.',
    )
    contasStore.updateTable()
    open.value = false
    emit('completed')
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao transferir entre contas.')
  } finally {
    loading.value = false
  }
}

watch(
  () => open.value,
  async (value) => {
    if (!value) return
    resetForm()
    await loadContas()
  },
)

watch(
  () => [open.value, form.value.modo, props.contaOrigem?.id, props.filtros?.inicio, props.filtros?.fim, props.filtros?.tipo, props.filtros?.status, props.filtros?.search] as const,
  async ([isOpen, modo]) => {
    if (!isOpen || modo !== 'MOVER_LANCAMENTOS') return
    await loadPreview()
  },
)
</script>

<template>
  <ModalView v-model:open="open" :title="title" :description="description" size="lg">
    <div class="space-y-4 px-4">
      <div class="rounded-lg border border-border bg-card p-4 text-sm">
        <div class="font-medium text-foreground">Origem</div>
        <div class="text-muted-foreground">{{ contaOrigem?.nome || 'Conta não informada' }}</div>
        <div class="mt-1 text-xs text-muted-foreground">
          Saldo inicial: {{ formatCurrencyBR(Number(contaOrigem?.saldoInicial || 0)) }}
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label class="mb-1 block text-sm font-medium">Modo da transferência</label>
          <Select v-model="form.modo">
            <SelectTrigger>
              <SelectValue placeholder="Escolha o modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GERAR_FINANCEIRO">Gerar financeiro (entrada + saída)</SelectItem>
              <SelectItem value="MOVER_LANCAMENTOS">Mover lançamentos filtrados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">Conta de destino</label>
          <Select v-model="form.contaDestinoId" :disabled="loadingContas">
            <SelectTrigger>
              <SelectValue :placeholder="loadingContas ? 'Carregando contas...' : 'Selecione a conta'" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="conta in contasDestino" :key="conta.id" :value="String(conta.id)">
                {{ conta.nome }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <template v-if="form.modo === 'GERAR_FINANCEIRO'">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-medium">Valor da transferência</label>
            <Input v-model="form.valor" type="number" step="0.01" min="0" placeholder="0,00" />
          </div>
          <div>
            <label class="mb-1 block text-sm font-medium">Data</label>
            <Calendarpicker v-model="form.data" :teleport="true" :required="false" />
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">Descrição</label>
          <Input v-model="form.descricao" placeholder="Ex: Transferência operacional entre contas" />
          <p class="mt-1 text-xs text-muted-foreground">
            Se não informar, o sistema usa uma descrição padrão com origem e destino.
          </p>
        </div>
      </template>

      <template v-else>
        <div class="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          O modo direto <strong>não cria novos lançamentos</strong>. Ele apenas reatribui a conta financeira dos lançamentos/parcelas visíveis no filtro atual.
        </div>

        <div class="space-y-2 rounded-lg border border-border bg-card p-4">
          <div class="text-sm font-medium text-foreground">Filtros aplicados ao movimento direto</div>
          <div v-if="resumoFiltros.length" class="flex flex-wrap gap-2">
            <span v-for="item in resumoFiltros" :key="item" class="rounded-full border border-border px-2 py-1 text-xs text-muted-foreground">
              {{ item }}
            </span>
          </div>
          <div v-else class="text-xs text-muted-foreground">
            Nenhum filtro adicional foi informado. A transferência direta considerará todos os lançamentos vinculados à conta de origem.
          </div>
        </div>

        <div class="rounded-lg border border-border bg-card p-4">
          <div class="text-sm font-medium text-foreground">Prévia do impacto</div>
          <div v-if="loadingPreview" class="mt-2 text-sm text-muted-foreground">Calculando itens afetados...</div>
          <div v-else-if="preview" class="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div class="rounded-lg border border-border p-3">
              <div class="text-xs text-muted-foreground">Parcelas afetadas</div>
              <div class="mt-1 text-lg font-semibold text-foreground">{{ preview.parcelasAfetadas }}</div>
            </div>
            <div class="rounded-lg border border-border p-3">
              <div class="text-xs text-muted-foreground">Lançamentos afetados</div>
              <div class="mt-1 text-lg font-semibold text-foreground">{{ preview.lancamentosAfetados }}</div>
            </div>
          </div>
          <div v-else class="mt-2 text-sm text-muted-foreground">
            Nenhuma parcela encontrada para os filtros atuais.
          </div>
          <p class="mt-2 text-xs text-muted-foreground">
            {{ transferenciaAfetaTudo ? 'Como não há filtros adicionais, a prévia considera toda a conta de origem.' : 'A prévia considera exatamente os filtros ativos informados acima.' }}
          </p>
        </div>
      </template>

      <div class="flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="open = false">Cancelar</Button>
        <Button class="text-white" :disabled="loading || loadingContas || loadingPreview" @click="submit">
          {{ loading ? 'Transferindo...' : 'Confirmar transferência' }}
        </Button>
      </div>
    </div>
  </ModalView>
</template>
