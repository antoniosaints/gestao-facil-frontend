<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Coins, Lock } from 'lucide-vue-next'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { MetodoContado } from '@/repositories/caixa-repository'
import type { CaixaSessao } from '@/types/schemas'
import { formatCurrencyBR, formatToNumberValue } from '@/utils/formatters'

const props = withDefaults(defineProps<{
  caixa: CaixaSessao | null
  saldoEsperado: number
  porMetodo: Record<string, number>
  loading?: boolean
  observacaoPlaceholder?: string
}>(), {
  loading: false,
  observacaoPlaceholder: 'Conferência do fechamento',
})

const emit = defineEmits<{
  confirmar: [payload: {
    valorFechamento: number
    descricao?: string
    metodosContados: MetodoContado[]
  }]
}>()

const open = defineModel<boolean>('open', { default: false })
const valorFechamento = ref('')
const descricao = ref('')
const erro = ref('')
const contagemMetodos = ref<Record<string, { habilitado: boolean; contado: string }>>({})

const outrosMetodos = computed(() =>
  Object.entries(props.porMetodo || {})
    .filter(([metodo, valor]) => metodo !== 'DINHEIRO' && Number(valor) > 0)
    .map(([metodo, valor]) => ({
      metodo,
      label: getPaymentMethodLabel(metodo),
      valor: Number(valor),
    })),
)

watch(open, (isOpen) => {
  if (!isOpen) return
  valorFechamento.value = String(Number(props.saldoEsperado || 0))
  descricao.value = ''
  erro.value = ''
  contagemMetodos.value = {}
})

function getPaymentMethodLabel(method?: string | null) {
  switch (method) {
    case 'DINHEIRO': return 'Dinheiro'
    case 'CARTAO': return 'Cartão'
    case 'CREDITO': return 'Crédito'
    case 'DEBITO': return 'Débito'
    case 'CREDIARIO': return 'Crediário'
    case 'PIX': return 'PIX'
    case 'BOLETO': return 'Boleto'
    case 'TRANSFERENCIA': return 'Transferência'
    case 'CHEQUE': return 'Cheque'
    case 'GATEWAY': return 'Gateway'
    case 'OUTRO': return 'Outro'
    default: return method || 'Pagamento'
  }
}

function toggleContagemMetodo(metodo: string, esperado: number) {
  const atual = contagemMetodos.value[metodo]
  contagemMetodos.value[metodo] = atual?.habilitado
    ? { habilitado: false, contado: '' }
    : { habilitado: true, contado: String(esperado ?? '') }
}

function submit() {
  const dinheiroContado = formatToNumberValue(valorFechamento.value)
  if (!Number.isFinite(dinheiroContado) || dinheiroContado < 0) {
    erro.value = 'Informe um valor contado válido.'
    return
  }

  erro.value = ''
  const metodosContados: MetodoContado[] = [
    {
      metodo: 'DINHEIRO',
      esperado: Number(props.saldoEsperado || 0),
      contado: dinheiroContado,
      diferenca: dinheiroContado - Number(props.saldoEsperado || 0),
    },
    ...outrosMetodos.value.map((item) => {
      const estado = contagemMetodos.value[item.metodo]
      const informado = estado?.habilitado && String(estado.contado).trim() !== ''
      const contado = informado ? formatToNumberValue(estado.contado) : item.valor
      return {
        metodo: item.metodo,
        esperado: item.valor,
        contado,
        diferenca: contado - item.valor,
      }
    }),
  ]

  emit('confirmar', {
    valorFechamento: dinheiroContado,
    descricao: descricao.value.trim() || undefined,
    metodosContados,
  })
}
</script>

<template>
  <ModalView v-model:open="open" title="Fechar caixa"
    description="Informe os valores contados para concluir o caixa." size="sm">
    <form class="grid gap-3 px-4" @submit.prevent="submit">
      <div v-if="caixa" class="rounded-md border bg-muted/30 p-3 text-sm">
        <div class="flex justify-between gap-3">
          <span class="text-muted-foreground">Caixa</span>
          <strong>{{ caixa.codigo }}</strong>
        </div>
        <div class="flex justify-between gap-3">
          <span class="text-muted-foreground">Operador</span>
          <span>{{ caixa.abertoPor?.nome || '-' }}</span>
        </div>
      </div>

      <div class="space-y-2">
        <span class="text-xs font-medium text-muted-foreground">Saldo esperado por método</span>
        <div class="overflow-hidden rounded-md border">
          <div class="border-b bg-amber-50 px-3 py-2 dark:bg-amber-950/20">
            <div class="flex items-center justify-between gap-2">
              <div class="flex min-w-0 flex-col">
                <span class="text-sm font-medium">Dinheiro</span>
                <span class="text-[11px] text-amber-600">Conferir em espécie</span>
              </div>
              <strong class="text-sm">{{ formatCurrencyBR(saldoEsperado) }}</strong>
            </div>
            <div class="mt-2">
              <Input v-model="valorFechamento" type="text" class="h-9"
                aria-label="Valor contado em dinheiro" placeholder="Valor contado (espécie)" />
              <p v-if="erro" class="mt-1 text-xs text-rose-600">{{ erro }}</p>
            </div>
          </div>

          <div v-for="metodo in outrosMetodos" :key="metodo.metodo"
            class="border-b bg-background px-3 py-2 last:border-b-0">
            <div class="flex items-center justify-between gap-2">
              <div class="flex min-w-0 flex-col">
                <span class="text-sm">{{ metodo.label }}</span>
                <span class="text-[11px] text-muted-foreground">
                  {{ contagemMetodos[metodo.metodo]?.habilitado
                    ? 'Informe o valor contado' : 'Direto — não precisa contar' }}
                </span>
              </div>
              <div class="flex shrink-0 items-center gap-2">
                <span class="text-sm">{{ formatCurrencyBR(metodo.valor) }}</span>
                <button type="button" :title="`Informar valor contado em ${metodo.label}`"
                  :aria-pressed="Boolean(contagemMetodos[metodo.metodo]?.habilitado)"
                  @click="toggleContagemMetodo(metodo.metodo, metodo.valor)"
                  class="grid h-7 w-7 place-items-center rounded-md border transition"
                  :class="contagemMetodos[metodo.metodo]?.habilitado
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-muted'">
                  <Coins class="h-4 w-4" />
                </button>
              </div>
            </div>
            <div v-if="contagemMetodos[metodo.metodo]?.habilitado" class="mt-2">
              <Input v-model="contagemMetodos[metodo.metodo].contado" type="text" class="h-9"
                :aria-label="`Valor contado em ${metodo.label}`" placeholder="Valor contado (opcional)" />
            </div>
          </div>
        </div>
        <p class="text-[11px] text-muted-foreground">
          Clique no ícone de moeda ao lado de um método para informar o valor contado.
        </p>
      </div>

      <div class="flex flex-col gap-1">
        <label class="text-xs text-muted-foreground" for="fechamento-observacao">Observação</label>
        <Input id="fechamento-observacao" v-model="descricao" :placeholder="observacaoPlaceholder" />
      </div>

      <div class="flex justify-end gap-2">
        <Button type="button" variant="outline" :disabled="loading" @click="open = false">Cancelar</Button>
        <Button type="submit" :disabled="loading">
          <Lock class="h-4 w-4" />
          {{ loading ? 'Fechando...' : 'Fechar caixa' }}
        </Button>
      </div>
    </form>
  </ModalView>
</template>
