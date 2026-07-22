<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { vMaska } from 'maska/vue'

import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { moneyMaskOptions } from '@/lib/imaska'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { formatToNumberValue } from '@/utils/formatters'
import type { FrequenciaRecorrencia, LancamentoRecorrencia } from '@/types/schemas'

const props = defineProps<{
  lancamentoId: number
  recorrencia?: LancamentoRecorrencia | null
  /// Valor sugerido quando o lançamento ainda não tem recorrência configurada.
  valorSugerido?: number | string | null
}>()

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ (e: 'saved'): void }>()

const toast = useToast()
const salvando = ref(false)
const erros = ref<Record<string, string>>({})

const form = ref({
  valorParcela: '' as number | string,
  frequencia: 'MENSAL' as FrequenciaRecorrencia,
  intervaloDias: null as number | string | null,
  dataInicio: null as Date | string | null,
  dataFim: null as Date | string | null,
  minimoGerado: 1 as number | string,
  maximoEmAberto: 6 as number | string,
  geracaoAutomatica: false,
  diasAntecedencia: 30 as number | string,
})

const isPersonalizado = computed(() => form.value.frequencia === 'PERSONALIZADO')
const isNova = computed(() => !props.recorrencia)

// Grade em 12 colunas onde cada linha fecha exatamente 12 nas duas combinações
// (com/sem intervalo personalizado, com/sem geração automática).
const colValor = 'col-span-12 md:col-span-4'
const colFrequencia = computed(() =>
  isPersonalizado.value ? 'col-span-12 md:col-span-4' : 'col-span-12 md:col-span-8',
)
const colIntervalo = 'col-span-12 md:col-span-4'
const colData = 'col-span-6 md:col-span-6'
const colLimite = computed(() =>
  form.value.geracaoAutomatica ? 'col-span-4 md:col-span-2' : 'col-span-6 md:col-span-3',
)
const colAutomacao = 'col-span-12 md:col-span-6'

function preencherFormulario() {
  const atual = props.recorrencia

  form.value = {
    valorParcela: Number(atual?.valorParcela ?? props.valorSugerido ?? 0).toFixed(2).replace('.', ','),
    frequencia: (atual?.frequencia as FrequenciaRecorrencia) || 'MENSAL',
    intervaloDias: atual?.intervaloDias ?? null,
    dataInicio: atual?.dataInicio ? new Date(atual.dataInicio) : null,
    dataFim: atual?.dataFim ? new Date(atual.dataFim) : null,
    minimoGerado: atual?.minimoGerado ?? 1,
    maximoEmAberto: atual?.maximoEmAberto ?? 6,
    geracaoAutomatica: Boolean(atual?.geracaoAutomatica),
    diasAntecedencia: atual?.diasAntecedencia ?? 30,
  }
  erros.value = {}
}

watch(open, (aberto) => {
  if (aberto) preencherFormulario()
})

function validar() {
  erros.value = {}

  if (formatToNumberValue(form.value.valorParcela) <= 0) {
    erros.value.valorParcela = 'Informe um valor maior que zero.'
  }

  if (isPersonalizado.value && Number(form.value.intervaloDias || 0) < 1) {
    erros.value.intervaloDias = 'Informe a quantidade de dias.'
  }

  if (Number(form.value.minimoGerado || 0) < 1) {
    erros.value.minimoGerado = 'O mínimo em aberto deve ser de ao menos 1.'
  }

  if (Number(form.value.maximoEmAberto || 0) < Number(form.value.minimoGerado || 1)) {
    erros.value.maximoEmAberto = 'O máximo não pode ser menor que o mínimo.'
  }

  if (
    form.value.dataFim &&
    form.value.dataInicio &&
    new Date(form.value.dataFim) < new Date(form.value.dataInicio)
  ) {
    erros.value.dataFim = 'A data de fim deve ser posterior ao início.'
  }

  return Object.keys(erros.value).length === 0
}

async function submit() {
  if (!validar()) return

  try {
    salvando.value = true
    await LancamentosRepository.salvarRecorrencia(props.lancamentoId, {
      valorParcela: formatToNumberValue(form.value.valorParcela),
      frequencia: form.value.frequencia,
      intervaloDias: isPersonalizado.value ? Number(form.value.intervaloDias || 0) : null,
      dataInicio: form.value.dataInicio,
      dataFim: form.value.dataFim,
      minimoGerado: Number(form.value.minimoGerado || 1),
      maximoEmAberto: Number(form.value.maximoEmAberto || 6),
      geracaoAutomatica: form.value.geracaoAutomatica,
      diasAntecedencia: Number(form.value.diasAntecedencia || 0),
    })
    toast.success('Recorrência salva com sucesso.')
    open.value = false
    emit('saved')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível salvar a recorrência.')
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="open"
    :title="isNova ? 'Transformar em recorrente' : 'Editar recorrência'"
    description="O valor vale para as próximas ocorrências; as parcelas já geradas não são alteradas."
    size="3xl"
  >
    <form class="space-y-4 px-4" @submit.prevent="submit">
      <div class="grid grid-cols-12 gap-3">
        <div :class="colValor">
          <label class="mb-1 block text-sm font-medium">Valor de cada ocorrência *</label>
          <Input v-model="form.valorParcela" v-maska="moneyMaskOptions" type="text" placeholder="0,00" />
          <p v-if="erros.valorParcela" class="text-sm text-red-600">{{ erros.valorParcela }}</p>
        </div>

        <div :class="colFrequencia">
          <label class="mb-1 block text-sm font-medium">Frequência *</label>
          <Select v-model="form.frequencia">
            <SelectTrigger>
              <SelectValue placeholder="Frequência" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MENSAL">Mensal</SelectItem>
              <SelectItem value="SEMANAL">Semanal</SelectItem>
              <SelectItem value="DIARIO">Diário</SelectItem>
              <SelectItem value="QUINZENAL">Quinzenal</SelectItem>
              <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
              <SelectItem value="SEMESTRAL">Semestral</SelectItem>
              <SelectItem value="ANUAL">Anual</SelectItem>
              <SelectItem value="PERSONALIZADO">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="isPersonalizado" :class="colIntervalo">
          <label class="mb-1 block text-sm font-medium">A cada (dias) *</label>
          <Input
            :model-value="form.intervaloDias ?? ''"
            @update:model-value="(value) => (form.intervaloDias = value as string | number)"
            type="number"
            min="1"
            placeholder="Ex: 45"
          />
          <p v-if="erros.intervaloDias" class="text-sm text-red-600">{{ erros.intervaloDias }}</p>
        </div>

        <div :class="colData">
          <label class="mb-1 block text-sm font-medium">Início da recorrência</label>
          <Calendarpicker
            :teleport="true"
            :required="false"
            :model-value="form.dataInicio ?? null"
            @update:model-value="(value) => (form.dataInicio = value as Date | null)"
          />
        </div>

        <div :class="colData">
          <label class="mb-1 block text-sm font-medium">
            Data de fim <span class="text-xs text-muted-foreground">(opcional)</span>
          </label>
          <Calendarpicker
            :teleport="true"
            :required="false"
            :model-value="form.dataFim ?? null"
            @update:model-value="(value) => (form.dataFim = value as Date | null)"
          />
          <p v-if="erros.dataFim" class="text-sm text-red-600">{{ erros.dataFim }}</p>
        </div>

        <div :class="colLimite">
          <label class="mb-1 block text-sm font-medium">Mínimo *</label>
          <Input v-model="form.minimoGerado" type="number" min="1" placeholder="1" />
          <p v-if="erros.minimoGerado" class="text-sm text-red-600">{{ erros.minimoGerado }}</p>
        </div>

        <div :class="colLimite">
          <label class="mb-1 block text-sm font-medium">Máximo *</label>
          <Input v-model="form.maximoEmAberto" type="number" min="1" placeholder="6" />
          <p v-if="erros.maximoEmAberto" class="text-sm text-red-600">{{ erros.maximoEmAberto }}</p>
        </div>

        <div v-if="form.geracaoAutomatica" :class="colLimite">
          <label class="mb-1 block text-sm font-medium">Antecedência *</label>
          <Input v-model="form.diasAntecedencia" type="number" min="0" placeholder="30" />
        </div>

        <div :class="colAutomacao">
          <span class="mb-1 block text-sm font-medium">Geração automática</span>
          <label
            for="geracaoAutomaticaEdicao"
            class="flex h-[36px] cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 dark:bg-card-dark"
          >
            <span class="truncate text-sm font-medium">Gerar antes do vencimento</span>
            <Switch id="geracaoAutomaticaEdicao" v-model="form.geracaoAutomatica" />
          </label>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="secondary" @click="open = false">Fechar</Button>
        <Button class="text-white" type="submit" :disabled="salvando">
          {{ salvando ? 'Salvando...' : 'Salvar recorrência' }}
        </Button>
      </div>
    </form>
  </ModalView>
</template>
