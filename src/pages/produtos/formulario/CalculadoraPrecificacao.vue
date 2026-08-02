<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Calculator, CircleDollarSign, Plus, Trash2, TrendingUp } from 'lucide-vue-next'
import { vMaska } from 'maska/vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { moneyMaskOptions } from '@/lib/imaska'
import { formatCurrencyBR, formatToNumberValue } from '@/utils/formatters'
import { calcularPrecificacao } from './precificacao'

type CustoAdicionalForm = {
  id: number
  descricao: string
  valor: string
}

const open = defineModel<boolean>('open', { default: false })
const props = defineProps<{
  precoCompra?: number | string | null
  custoProducao?: number | string | null
}>()
const emit = defineEmits<{
  aplicar: [payload: { custoCompra: number; custoProducao: number; precoVenda: number }]
}>()

const custoCompra = ref('')
const custoProducao = ref('')
const lucroPercentual = ref(30)
const custosAdicionais = ref<CustoAdicionalForm[]>([])
let nextCustoId = 1

function formatarCampoMonetario(value: number | string | null | undefined) {
  const numero = formatToNumberValue(value ?? 0)
  return numero > 0
    ? numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : ''
}

function novoCustoAdicional() {
  custosAdicionais.value.push({ id: nextCustoId++, descricao: '', valor: '' })
}

function removerCustoAdicional(id: number) {
  custosAdicionais.value = custosAdicionais.value.filter((item) => item.id !== id)
}

function resetar() {
  custoCompra.value = formatarCampoMonetario(props.precoCompra)
  custoProducao.value = formatarCampoMonetario(props.custoProducao)
  lucroPercentual.value = 30
  custosAdicionais.value = []
  nextCustoId = 1
  novoCustoAdicional()
}

watch(open, (isOpen) => {
  if (isOpen) resetar()
})

const resultado = computed(() =>
  calcularPrecificacao({
    custoCompra: formatToNumberValue(custoCompra.value),
    custoProducao: formatToNumberValue(custoProducao.value),
    custosAdicionais: custosAdicionais.value.map((item) => formatToNumberValue(item.valor)),
    lucroPercentual: Number(lucroPercentual.value) || 0,
  }),
)

function aplicarPreco() {
  if (resultado.value.precoVenda <= 0) return

  emit('aplicar', {
    custoCompra: formatToNumberValue(custoCompra.value),
    custoProducao: formatToNumberValue(custoProducao.value),
    precoVenda: resultado.value.precoVenda,
  })
  open.value = false
}
</script>

<template>
  <ModalView
    v-model:open="open"
    title="Calculadora de custo e precificação"
    description="Reúna os custos do produto e defina o lucro desejado para chegar a um preço de venda sustentável."
    size="2xl"
    :icon="Calculator"
  >
    <form class="grid gap-5 px-4 pb-1" @submit.prevent="aplicarPreco">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-foreground">Custo de compra</label>
          <Input
            v-model="custoCompra"
            v-maska="moneyMaskOptions"
            type="text"
            inputmode="decimal"
            placeholder="0,00"
            data-testid="custo-compra"
            class="bg-background dark:bg-background/70"
          />
        </div>
        <div>
          <label class="mb-1.5 block text-sm font-medium text-foreground">Custo de produção</label>
          <Input
            v-model="custoProducao"
            v-maska="moneyMaskOptions"
            type="text"
            inputmode="decimal"
            placeholder="0,00"
            data-testid="custo-producao"
            class="bg-background dark:bg-background/70"
          />
        </div>
      </div>

      <section class="rounded-xl border border-border/70 bg-muted/20 p-4">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 class="text-sm font-semibold text-foreground">Custos adicionais</h3>
            <p class="text-xs text-muted-foreground">
              Inclua embalagem, frete, taxas, mão de obra ou outros gastos.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" @click="novoCustoAdicional">
            <Plus class="mr-1.5 h-4 w-4" /> Adicionar custo
          </Button>
        </div>

        <div class="grid gap-2">
          <div
            v-for="(custo, index) in custosAdicionais"
            :key="custo.id"
            class="grid grid-cols-[minmax(0,1fr)_minmax(110px,0.45fr)_auto] items-center gap-2"
          >
            <Input
              v-model="custo.descricao"
              type="text"
              :aria-label="`Descrição do custo adicional ${index + 1}`"
              placeholder="Ex: Embalagem"
              class="bg-background dark:bg-background/70"
            />
            <Input
              v-model="custo.valor"
              v-maska="moneyMaskOptions"
              type="text"
              inputmode="decimal"
              :aria-label="`Valor do custo adicional ${index + 1}`"
              placeholder="0,00"
              class="bg-background dark:bg-background/70"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              class="text-muted-foreground hover:text-destructive"
              :aria-label="`Remover custo adicional ${index + 1}`"
              :disabled="custosAdicionais.length === 1"
              @click="removerCustoAdicional(custo.id)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-end">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-foreground"
            >Lucro desejado sobre o custo (%)</label
          >
          <p class="text-xs text-muted-foreground">
            Exemplo: 30% acrescenta 30% ao custo total. A margem sobre a venda aparece no resumo.
          </p>
        </div>
        <div class="relative">
          <Input
            v-model.number="lucroPercentual"
            type="number"
            inputmode="decimal"
            min="0"
            step="0.01"
            data-testid="lucro-percentual"
            class="bg-background pr-9 dark:bg-background/70"
          />
          <span
            class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
            >%</span
          >
        </div>
      </div>

      <section class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div class="rounded-xl border border-border/70 bg-card p-3">
          <CircleDollarSign class="mb-2 h-4 w-4 text-muted-foreground" />
          <p class="text-xs text-muted-foreground">Custo total</p>
          <p class="mt-1 break-words text-base font-semibold text-foreground">
            {{ formatCurrencyBR(resultado.custoTotal) }}
          </p>
        </div>
        <div class="rounded-xl border border-border/70 bg-card p-3">
          <TrendingUp class="mb-2 h-4 w-4 text-emerald-500" />
          <p class="text-xs text-muted-foreground">Lucro estimado</p>
          <p
            class="mt-1 break-words text-base font-semibold text-emerald-600 dark:text-emerald-400"
          >
            {{ formatCurrencyBR(resultado.lucroValor) }}
          </p>
        </div>
        <div class="rounded-xl border border-primary/30 bg-primary/5 p-3">
          <Calculator class="mb-2 h-4 w-4 text-primary" />
          <p class="text-xs text-muted-foreground">Preço sugerido</p>
          <p class="mt-1 break-words text-base font-semibold text-primary">
            {{ formatCurrencyBR(resultado.precoVenda) }}
          </p>
        </div>
        <div class="rounded-xl border border-border/70 bg-card p-3">
          <TrendingUp class="mb-2 h-4 w-4 text-blue-500" />
          <p class="text-xs text-muted-foreground">Margem na venda</p>
          <p class="mt-1 text-base font-semibold text-foreground">
            {{ resultado.margemSobreVenda.toFixed(2) }}%
          </p>
        </div>
      </section>

      <p class="text-xs text-muted-foreground">
        Os custos adicionais auxiliam o cálculo nesta tela. Ao aplicar, o preço de compra, o custo
        de produção e o preço sugerido serão preenchidos no produto.
      </p>

      <div
        class="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end"
      >
        <Button type="button" variant="secondary" @click="open = false">Cancelar</Button>
        <Button
          type="submit"
          class="text-white"
          data-testid="aplicar-preco"
          :disabled="resultado.precoVenda <= 0"
        >
          Aplicar preço sugerido
        </Button>
      </div>
    </form>
  </ModalView>
</template>
