<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { vMaska } from 'maska/vue'
import { moneyMaskOptions } from '@/lib/imaska'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { formatToNumberValue, formatCurrencyBR } from '@/utils/formatters'
import { Plus, Trash2, PackagePlus } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useToast } from 'vue-toastification'

const open = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ (e: 'saved'): void }>()

const toast = useToast()

type ItemLinha = {
  produtoId: number | null
  quantidade: number
  custo: string
}

function novaLinha(): ItemLinha {
  return { produtoId: null, quantidade: 1, custo: '' }
}

const cabecalho = ref({
  fornecedor: undefined as number | undefined,
  data: new Date().toISOString().slice(0, 10),
  notaFiscal: '',
  frete: '',
  desconto: '',
})

const itens = ref<ItemLinha[]>([novaLinha()])
const salvando = ref(false)

function adicionarLinha() {
  itens.value.push(novaLinha())
}

function removerLinha(index: number) {
  itens.value.splice(index, 1)
  if (!itens.value.length) itens.value.push(novaLinha())
}

const subtotalProdutos = computed(() =>
  itens.value.reduce(
    (acc, item) => acc + formatToNumberValue(item.custo) * (Number(item.quantidade) || 0),
    0,
  ),
)

const totalGeral = computed(
  () =>
    subtotalProdutos.value +
    formatToNumberValue(cabecalho.value.frete) -
    formatToNumberValue(cabecalho.value.desconto),
)

function resetar() {
  cabecalho.value = {
    fornecedor: undefined,
    data: new Date().toISOString().slice(0, 10),
    notaFiscal: '',
    frete: '',
    desconto: '',
  }
  itens.value = [novaLinha()]
}

// Pré-preenche as linhas a partir das sugestões da IA e abre o modal. O custo fica em branco
// para o usuário confirmar o valor de compra.
function carregarSugestoes(sugestoes: { produtoId: number; quantidade: number }[]) {
  resetar()
  const linhas = sugestoes
    .filter((s) => s.produtoId && s.quantidade > 0)
    .map((s) => ({ produtoId: s.produtoId, quantidade: s.quantidade, custo: '' }))
  itens.value = linhas.length ? linhas : [novaLinha()]
  open.value = true
}

defineExpose({ carregarSugestoes })

function validar(): boolean {
  const preenchidos = itens.value.filter((item) => item.produtoId)
  if (!preenchidos.length) {
    toast.error('Adicione ao menos um produto para repor.')
    return false
  }
  for (const item of preenchidos) {
    if (!item.quantidade || Number(item.quantidade) < 1) {
      toast.error('Informe uma quantidade válida (mínimo 1) para todos os produtos.')
      return false
    }
    if (formatToNumberValue(item.custo) <= 0) {
      toast.error('Informe o valor unitário de todos os produtos.')
      return false
    }
  }
  const ids = preenchidos.map((item) => item.produtoId)
  if (new Set(ids).size !== ids.length) {
    toast.error('Há produtos repetidos na lista. Some as quantidades em uma única linha.')
    return false
  }
  return true
}

async function submit() {
  if (!validar()) return
  try {
    salvando.value = true
    await ProdutoRepository.reporLote({
      data: cabecalho.value.data,
      notaFiscal: cabecalho.value.notaFiscal?.trim() || undefined,
      fornecedor: cabecalho.value.fornecedor ?? null,
      frete: formatToNumberValue(cabecalho.value.frete),
      desconto: formatToNumberValue(cabecalho.value.desconto),
      itens: itens.value
        .filter((item) => item.produtoId)
        .map((item) => ({
          produtoId: item.produtoId as number,
          quantidade: Number(item.quantidade),
          custo: formatToNumberValue(item.custo),
        })),
    })
    toast.success('Reposição em massa registrada com sucesso!')
    resetar()
    open.value = false
    emit('saved')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao registrar a reposição em massa.')
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="open"
    :icon="PackagePlus"
    title="Nova reposição de estoque"
    size="4xl"
    description="Registre entradas de estoque em massa informando nota fiscal, fornecedor, frete e desconto."
  >
    <form @submit.prevent="submit" class="grid gap-5 px-4">
      <!-- Dados da nota -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div class="md:col-span-4">
          <label class="mb-1 block text-sm font-medium">Fornecedor</label>
          <Select2Ajax
            url="/clientes/select2"
            :params="[{ key: 'fornecedor', value: true }]"
            v-model:model-value="cabecalho.fornecedor"
            :allow-clear="true"
          />
        </div>
        <div class="md:col-span-3">
          <label class="mb-1 block text-sm font-medium">Data</label>
          <Calendarpicker v-model="cabecalho.data" :teleport="true" />
        </div>
        <div class="md:col-span-5">
          <label class="mb-1 block text-sm font-medium">Nota fiscal</label>
          <Input v-model="cabecalho.notaFiscal" placeholder="Número da nota fiscal" />
        </div>
        <div class="md:col-span-6">
          <label class="mb-1 block text-sm font-medium">Frete total (R$)</label>
          <Input type="text" v-maska="moneyMaskOptions" v-model="cabecalho.frete" placeholder="Ex: 10,00" />
        </div>
        <div class="md:col-span-6">
          <label class="mb-1 block text-sm font-medium">Desconto total (R$)</label>
          <Input type="text" v-maska="moneyMaskOptions" v-model="cabecalho.desconto" placeholder="Ex: 5,00" />
        </div>
      </div>

      <!-- Itens -->
      <div class="rounded-lg border border-border">
        <div class="flex items-center justify-between border-b border-border px-3 py-2">
          <span class="text-sm font-semibold text-foreground">Produtos a repor</span>
          <Button type="button" size="sm" variant="outline" @click="adicionarLinha">
            <Plus class="h-4 w-4" /> Adicionar produto
          </Button>
        </div>

        <div class="divide-y divide-border">
          <div
            v-for="(item, index) in itens"
            :key="index"
            class="grid grid-cols-1 items-end gap-3 px-3 py-3 md:grid-cols-12"
          >
            <div class="md:col-span-6">
              <label class="mb-1 block text-xs font-medium text-muted-foreground">Produto</label>
              <Select2Ajax
                url="/produtos/select2"
                :params="[{ key: 'withStock', value: true }]"
                v-model:model-value="item.produtoId"
                :allow-clear="true"
                placeholder="Selecione o produto"
              />
            </div>
            <div class="md:col-span-2">
              <label class="mb-1 block text-xs font-medium text-muted-foreground">Quantidade</label>
              <Input type="number" min="1" v-model.number="item.quantidade" placeholder="Ex: 50" />
            </div>
            <div class="md:col-span-3">
              <label class="mb-1 block text-xs font-medium text-muted-foreground">Valor unitário (R$)</label>
              <Input type="text" v-maska="moneyMaskOptions" v-model="item.custo" placeholder="Ex: 12,50" />
            </div>
            <div class="flex md:col-span-1 md:justify-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                class="text-red-500 hover:text-red-600"
                v-tooltip="'Remover linha'"
                @click="removerLinha(index)"
              >
                <Trash2 class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <!-- Totais -->
      <div class="flex flex-col items-end gap-1 text-sm">
        <div class="flex w-full max-w-xs justify-between text-muted-foreground">
          <span>Subtotal produtos</span>
          <span>{{ formatCurrencyBR(subtotalProdutos) }}</span>
        </div>
        <div class="flex w-full max-w-xs justify-between text-muted-foreground">
          <span>Frete</span>
          <span>{{ formatCurrencyBR(formatToNumberValue(cabecalho.frete)) }}</span>
        </div>
        <div class="flex w-full max-w-xs justify-between text-muted-foreground">
          <span>Desconto</span>
          <span>- {{ formatCurrencyBR(formatToNumberValue(cabecalho.desconto)) }}</span>
        </div>
        <div class="flex w-full max-w-xs justify-between border-t border-border pt-1 text-base font-semibold text-foreground">
          <span>Total</span>
          <span>{{ formatCurrencyBR(totalGeral) }}</span>
        </div>
      </div>

      <div class="flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="open = false">Fechar</Button>
        <Button class="text-white" type="submit" :disabled="salvando">
          {{ salvando ? 'Registrando...' : 'Registrar reposição' }}
        </Button>
      </div>
    </form>
  </ModalView>
</template>
