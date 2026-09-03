<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { LoaderCircle, Plus, Wallet } from 'lucide-vue-next'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import RestaurantCashDetailsDialog from '@/components/restaurante/RestaurantCashDetailsDialog.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  RestauranteRepository,
  type RestauranteCaixaContexto,
} from '@/repositories/restaurante-repository'
import { useUiStore } from '@/stores/ui/uiStore'

const route = useRoute()
const toast = useToast()
const uiStore = useUiStore()
const open = ref(false)
const loading = ref(false)
const contexto = ref<RestauranteCaixaContexto | null>(null)
const abrirValor = ref('0')
const abrirObservacao = ref('')
const movimentoAberto = ref<'SANGRIA' | 'REFORCO' | null>(null)
const movimentoValor = ref('')
const movimentoObservacao = ref('')
const fechamentoAberto = ref(false)
const fechamentoValor = ref('')
const fechamentoObservacao = ref('')

const isRestaurantArea = computed(() =>
  route.matched.some((record) => record.meta.modulo === 'restaurante-delivery'),
)
const canOperate = computed(() => uiStore.hasRestaurantCapability('PEDIDOS_OPERAR'))
const caixa = computed(() => contexto.value?.caixa || null)
const caixaAberto = computed(() => caixa.value?.status === 'ABERTO')
const movimentoModalAberto = computed({
  get: () => Boolean(movimentoAberto.value),
  set: (isOpen: boolean) => {
    if (!isOpen) movimentoAberto.value = null
  },
})

function toNumber(value: string) {
  const raw = value.trim()
  return Number(raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw)
}

function notifyCashChange() {
  window.dispatchEvent(new Event('restaurant-cash-change'))
}

async function carregarContexto() {
  try {
    loading.value = true
    contexto.value = await RestauranteRepository.contextoCaixa()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar o caixa.')
  } finally {
    loading.value = false
  }
}

async function abrirModal() {
  open.value = true
  await carregarContexto()
}

async function abrirCaixa() {
  const valorInicial = toNumber(abrirValor.value)
  if (!Number.isFinite(valorInicial) || valorInicial < 0) {
    toast.info('Informe um valor inicial válido.')
    return
  }
  try {
    loading.value = true
    contexto.value = await RestauranteRepository.abrirCaixa({
      valorInicial,
      observacao: abrirObservacao.value.trim() || undefined,
    })
    abrirObservacao.value = ''
    toast.success('Caixa do Restaurante aberto.')
    notifyCashChange()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível abrir o caixa.')
  } finally {
    loading.value = false
  }
}

function abrirMovimento(tipo: 'SANGRIA' | 'REFORCO') {
  movimentoAberto.value = tipo
  movimentoValor.value = ''
  movimentoObservacao.value = ''
}

async function salvarMovimento() {
  const tipo = movimentoAberto.value
  const valor = toNumber(movimentoValor.value)
  if (!tipo || !Number.isFinite(valor) || valor <= 0) {
    toast.info('Informe um valor maior que zero.')
    return
  }
  try {
    loading.value = true
    contexto.value = await RestauranteRepository.movimentarCaixa({
      tipo,
      valor,
      descricao: movimentoObservacao.value.trim() || undefined,
    })
    movimentoAberto.value = null
    toast.success(tipo === 'SANGRIA' ? 'Sangria registrada.' : 'Reforço registrado.')
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message || 'Não foi possível registrar a movimentação.',
    )
  } finally {
    loading.value = false
  }
}

function abrirFechamento() {
  fechamentoValor.value = String(caixa.value?.saldoEsperado || 0)
  fechamentoObservacao.value = ''
  fechamentoAberto.value = true
}

async function fecharCaixa() {
  const valorFechamento = toNumber(fechamentoValor.value)
  if (!Number.isFinite(valorFechamento) || valorFechamento < 0) {
    toast.info('Informe o valor contado em caixa.')
    return
  }
  try {
    loading.value = true
    await RestauranteRepository.fecharCaixa({
      valorFechamento,
      descricao: fechamentoObservacao.value.trim() || undefined,
    })
    contexto.value = null
    fechamentoAberto.value = false
    toast.success('Caixa fechado e pedidos online pausados.')
    notifyCashChange()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível fechar o caixa.')
  } finally {
    loading.value = false
  }
}

watch(
  isRestaurantArea,
  (active) => {
    if (active) void carregarContexto()
    else {
      open.value = false
      contexto.value = null
    }
  },
  { immediate: true },
)
</script>

<template>
  <div v-if="isRestaurantArea && canOperate">
    <Button
      type="button"
      variant="outline"
      size="sm"
      class="gap-1.5"
      :title="caixaAberto ? `Caixa ${caixa?.codigo} aberto` : 'Abrir caixa do Restaurante'"
      @click="abrirModal"
    >
      <Wallet class="h-4 w-4" :class="caixaAberto ? 'text-emerald-600' : 'text-amber-600'" />
      <span class="hidden lg:inline">{{ caixaAberto ? 'Caixa aberto' : 'Caixa fechado' }}</span>
    </Button>

    <ModalView
      v-if="!caixa"
      v-model:open="open"
      title="Caixa do Restaurante"
      description="Abra um turno para liberar os pedidos online, manuais e de mesa."
      size="md"
    >
      <div v-if="loading" class="grid min-h-40 place-items-center p-6 text-muted-foreground">
        <LoaderCircle class="h-6 w-6 animate-spin" />
      </div>
      <form v-else class="grid gap-4 p-5" @submit.prevent="abrirCaixa">
        <div class="rounded-xl border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
          Nenhum caixa aberto no Restaurante.
        </div>
        <label class="grid gap-1.5 text-sm font-medium"
          >Valor inicial<Input
            v-model="abrirValor"
            type="text"
            inputmode="decimal"
            placeholder="0,00"
        /></label>
        <label class="grid gap-1.5 text-sm font-medium"
          >Observação <span class="font-normal text-muted-foreground">(opcional)</span
          ><Input v-model="abrirObservacao" placeholder="Ex.: abertura do turno"
        /></label>
        <div class="flex justify-end">
          <Button type="submit" :disabled="loading"><Plus class="h-4 w-4" />Abrir caixa</Button>
        </div>
      </form>
    </ModalView>

    <RestaurantCashDetailsDialog
      v-else-if="contexto"
      v-model:open="open"
      :contexto="contexto"
      :loading="loading"
      @sangria="abrirMovimento('SANGRIA')"
      @reforco="abrirMovimento('REFORCO')"
      @fechar="abrirFechamento"
    />

    <ModalView
      v-model:open="movimentoModalAberto"
      :title="movimentoAberto === 'SANGRIA' ? 'Registrar sangria' : 'Registrar reforço'"
      description="Esta movimentação altera apenas o numerário esperado do caixa."
      size="sm"
    >
      <form class="grid gap-4 p-5" @submit.prevent="salvarMovimento">
        <label class="grid gap-1.5 text-sm font-medium"
          >Valor<Input v-model="movimentoValor" type="text" inputmode="decimal" placeholder="0,00"
        /></label>
        <label class="grid gap-1.5 text-sm font-medium"
          >Observação <span class="font-normal text-muted-foreground">(opcional)</span
          ><Input v-model="movimentoObservacao" placeholder="Descreva a movimentação"
        /></label>
        <div class="flex justify-end gap-2">
          <Button type="button" variant="outline" @click="movimentoAberto = null">Cancelar</Button
          ><Button type="submit" :disabled="loading">Registrar</Button>
        </div>
      </form>
    </ModalView>

    <ModalView
      v-model:open="fechamentoAberto"
      title="Fechar caixa"
      description="Informe o valor contado em dinheiro para concluir o turno."
      size="sm"
    >
      <form class="grid gap-4 p-5" @submit.prevent="fecharCaixa">
        <div class="rounded-lg border bg-muted/30 p-3 text-sm">
          <span class="text-muted-foreground">Numerário esperado</span
          ><strong class="mt-1 block">{{
            caixa
              ? caixa.saldoEsperado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
              : 'R$ 0,00'
          }}</strong>
        </div>
        <label class="grid gap-1.5 text-sm font-medium"
          >Valor contado<Input
            v-model="fechamentoValor"
            type="text"
            inputmode="decimal"
            placeholder="0,00"
        /></label>
        <label class="grid gap-1.5 text-sm font-medium"
          >Observação <span class="font-normal text-muted-foreground">(opcional)</span
          ><Input v-model="fechamentoObservacao" placeholder="Conferência do fechamento"
        /></label>
        <div class="flex justify-end gap-2">
          <Button type="button" variant="outline" @click="fechamentoAberto = false">Cancelar</Button
          ><Button type="submit" :disabled="loading">Fechar caixa</Button>
        </div>
      </form>
    </ModalView>
  </div>
</template>
