<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useDebounceFn } from '@vueuse/core'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import VarianteImagemField from '@/pages/produtos/formulario/VarianteImagemField.vue'
import CollapsibleSection from './CollapsibleSection.vue'
import ProdutoFiscalFields from './ProdutoFiscalFields.vue'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { moneyMaskOptions } from '@/lib/imaska'
import { vMaska } from 'maska/vue'
import { formatToNumberValue } from '@/utils/formatters'
import { CircleDollarSign, FileText, LoaderCircle, Lock, Settings2, Sparkles, Tag } from 'lucide-vue-next'

const store = useProdutoStore()
const toast = useToast()

const title = computed(() => (store.varianteForm.id ? 'Editar variante' : 'Nova variante'))
const description = computed(() =>
  store.varianteForm.id
    ? 'Atualize os dados da variante vinculada ao produto base selecionado.'
    : 'Selecione o produto base e preencha somente o que muda nesta nova variante.',
)
const controlaEstoqueAtivo = computed(() => store.varianteForm.controlaEstoque)

const saving = ref(false)

// Estado das seções colapsáveis.
const secPrecos = ref(true)
const secDescricao = ref(true)
const secControle = ref(false)

// Erros de validação por campo.
const errors = reactive<Record<string, string>>({})
function clearError(field: string) {
  if (errors[field]) delete errors[field]
}

// Intenção de mudança de imagem (arquivo novo ou remoção), persistida após salvar a variante.
const imagemChange = ref<{ file: File | null; remove: boolean }>({ file: null, remove: false })
watch(
  () => store.openModalVariante,
  (open) => {
    if (open) {
      imagemChange.value = { file: null, remove: false }
      Object.keys(errors).forEach((k) => delete errors[k])
      secPrecos.value = true
      secDescricao.value = true
      secControle.value = false
    }
  },
)

function isBlank(value: string | number | null | undefined) {
  return String(value ?? '').trim() === ''
}

function toNullableNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

// Gera o SKU automaticamente ao definir base + nome da variante (variante nova, código vazio, não bloqueado).
const autoGerarSku = useDebounceFn(() => {
  if (store.varianteForm.id || store.varianteForm.skuBloqueado) return
  if (!isBlank(store.varianteForm.codigo)) return
  if (!store.varianteForm.produtoBaseId || isBlank(store.varianteForm.nomeVariante)) return
  store.gerarSkuVariante()
}, 600)

watch(
  () => [store.varianteForm.nomeVariante, store.varianteForm.produtoBaseId],
  () => {
    if (!store.openModalVariante) return
    autoGerarSku()
  },
)

function buildPayload() {
  return {
    id: store.varianteForm.id,
    produtoBaseId: store.varianteForm.produtoBaseId,
    status: store.varianteForm.status,
    nomeVariante: store.varianteForm.nomeVariante.trim(),
    codigo: store.varianteForm.codigo?.trim() || undefined,
    unidade: store.varianteForm.unidade || 'un',
    descricao: store.varianteForm.descricao?.trim() || null,
    preco: formatToNumberValue(store.varianteForm.preco),
    precoPromocional: isBlank(store.varianteForm.precoPromocional)
      ? null
      : formatToNumberValue(store.varianteForm.precoPromocional),
    precoCompra: isBlank(store.varianteForm.precoCompra)
      ? undefined
      : formatToNumberValue(store.varianteForm.precoCompra),
    estoque: Number(store.varianteForm.estoque),
    minimo: Number(store.varianteForm.minimo),
    entradas: store.varianteForm.entradas,
    saidas: store.varianteForm.saidas,
    controlaEstoque: store.varianteForm.controlaEstoque,
    producaoLocal: store.varianteForm.producaoLocal,
    mostrarNoPdv: store.varianteForm.mostrarNoPdv,
    mostrarNoCatalogo: store.varianteForm.mostrarNoCatalogo,
    materiaPrima: store.varianteForm.materiaPrima,
    categoriaId: store.varianteForm.categoriaId,
    custoMedioProducao: isBlank(store.varianteForm.custoMedioProducao)
      ? undefined
      : Number(store.varianteForm.custoMedioProducao),
    // Fiscais (normalizados)
    ncm: store.varianteForm.ncm?.toString().trim() || null,
    cest: store.varianteForm.cest?.toString().trim() || null,
    cfop: store.varianteForm.cfop?.toString().trim() || null,
    codigoProduto: store.varianteForm.codigoProduto?.toString().trim() || null,
    origem: store.varianteForm.origem ?? null,
    aliquotaIcms: toNullableNumber(store.varianteForm.aliquotaIcms),
    aliquotaIpi: toNullableNumber(store.varianteForm.aliquotaIpi),
    aliquotaPis: toNullableNumber(store.varianteForm.aliquotaPis),
    aliquotaCofins: toNullableNumber(store.varianteForm.aliquotaCofins),
    issAliquota: toNullableNumber(store.varianteForm.issAliquota),
  }
}

function validateForm() {
  Object.keys(errors).forEach((k) => delete errors[k])

  if (!store.varianteForm.produtoBaseId) errors.produtoBaseId = 'Selecione o produto base'
  if (!store.varianteForm.nomeVariante.trim()) errors.nomeVariante = 'Informe o nome da variante'
  if (!store.varianteForm.unidade) errors.unidade = 'Selecione a unidade'
  if (formatToNumberValue(store.varianteForm.preco) <= 0) errors.preco = 'Informe um preço de venda válido'
  if (
    !isBlank(store.varianteForm.precoPromocional) &&
    formatToNumberValue(store.varianteForm.precoPromocional) >= formatToNumberValue(store.varianteForm.preco)
  ) {
    errors.precoPromocional = 'O preço promocional deve ser menor que o preço de venda'
  }
  if (Number(store.varianteForm.estoque) < 0) errors.estoque = 'O estoque não pode ser negativo'
  if (Number(store.varianteForm.minimo) < 0) errors.minimo = 'O estoque mínimo não pode ser negativo'

  if (errors.precoPromocional) secPrecos.value = true

  return Object.keys(errors).length === 0
}

async function submit() {
  if (saving.value) return
  try {
    if (!validateForm()) {
      toast.error('Revise os campos destacados')
      return
    }
    saving.value = true

    const payload = buildPayload()
    if (payload.produtoBaseId == null) {
      toast.error('Produto base não informado')
      return
    }

    const saved = await ProdutoVarianteRepository.save({
      ...payload,
      produtoBaseId: payload.produtoBaseId,
    })

    // Persiste a imagem (upload/remoção) usando o id da variante salva.
    const varianteId = saved?.id ?? store.varianteForm.id
    if (varianteId && (imagemChange.value.file || imagemChange.value.remove)) {
      try {
        await ProdutoVarianteRepository.persistImagem(varianteId, imagemChange.value)
      } catch (imgError) {
        console.log(imgError)
        toast.error('Variante salva, mas não foi possível atualizar a imagem.')
      }
    }

    toast.success(store.varianteForm.id ? 'Variante atualizada com sucesso' : 'Variante criada com sucesso')
    store.resetVariante(store.varianteForm.produtoBaseId)
    store.openModalVariante = false
    store.updateTable()
  } catch (error: any) {
    console.log(error)
    const errs = error?.response?.data?.data
      ? error.response.data.data.map((item: any) => item.message).join('\n')
      : error?.response?.data?.message || 'Erro ao salvar a variante'
    toast.error(errs)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ModalView v-model:open="store.openModalVariante" :title="title" :description="description" size="4xl">
    <form @submit.prevent="submit" class="grid gap-4 px-4 pb-1">
      <!-- ESSENCIAL -->
      <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div class="md:col-span-12">
          <label class="mb-1.5 block text-sm font-medium text-foreground">
            Produto base <span class="text-red-500">*</span>
          </label>
          <Select2Ajax v-model:model-value="store.varianteForm.produtoBaseId" class="w-full" url="/produtos/select2"
            :params="[{ key: 'baseOnly', value: true }]" placeholder="Selecione o produto para receber a nova variante"
            :disabled="!!store.varianteForm.id" @update:model-value="clearError('produtoBaseId')" />
          <p v-if="errors.produtoBaseId" class="mt-1 text-xs text-danger">{{ errors.produtoBaseId }}</p>
        </div>

        <div class="md:col-span-6">
          <label class="mb-1.5 block text-sm font-medium text-foreground">
            Nome da variante <span class="text-red-500">*</span>
          </label>
          <Input v-model="store.varianteForm.nomeVariante" type="text" placeholder="Ex: Azul G, Caixa 12un, 1L"
            :class="['bg-background dark:bg-background/60', errors.nomeVariante && 'border-danger']"
            @update:model-value="clearError('nomeVariante')" />
          <p v-if="errors.nomeVariante" class="mt-1 text-xs text-danger">{{ errors.nomeVariante }}</p>
        </div>

        <div class="md:col-span-3">
          <label class="mb-1.5 flex items-center gap-1 text-sm font-medium text-foreground">
            SKU / Código
            <Lock v-if="store.varianteForm.skuBloqueado" class="h-3.5 w-3.5 text-amber-500" />
          </label>
          <div class="flex gap-2">
            <Input v-model="store.varianteForm.codigo" type="text" placeholder="Gerado automaticamente se vazio"
              :disabled="store.varianteForm.skuBloqueado" class="bg-background dark:bg-background/60" />
            <Button type="button" variant="outline" size="icon" title="Gerar SKU automaticamente"
              :disabled="store.varianteForm.skuBloqueado" @click="store.gerarSkuVariante()">
              <Sparkles class="h-4 w-4" />
            </Button>
          </div>
          <p v-if="store.varianteForm.skuBloqueado" class="mt-1 text-xs text-amber-600 dark:text-amber-400">
            SKU bloqueado: existem vendas ou ordens de serviço vinculadas.
          </p>
        </div>

        <div class="md:col-span-3">
          <label class="mb-1.5 block text-sm font-medium text-foreground">
            Unidade <span class="text-red-500">*</span>
          </label>
          <Select v-model="store.varianteForm.unidade" @update:model-value="clearError('unidade')">
            <SelectTrigger class="w-full bg-background dark:bg-background/60" :class="errors.unidade && 'border-danger'">
              <SelectValue placeholder="Selecione a unidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="un">Unidade</SelectItem>
                <SelectItem value="kg">Quilograma</SelectItem>
                <SelectItem value="l">Litro</SelectItem>
                <SelectItem value="m">Metro</SelectItem>
                <SelectItem value="g">Gramas</SelectItem>
                <SelectItem value="cm">Centimetros</SelectItem>
                <SelectItem value="mm">Milimetros</SelectItem>
                <SelectItem value="mg">Miligramas</SelectItem>
                <SelectItem value="ml">Mililitro</SelectItem>
                <SelectItem value="cx">Caixa</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <p v-if="errors.unidade" class="mt-1 text-xs text-danger">{{ errors.unidade }}</p>
        </div>

        <div class="md:col-span-4">
          <label class="mb-1.5 block text-sm font-medium text-foreground">
            Preço de venda <span class="text-red-500">*</span>
          </label>
          <Input v-model="store.varianteForm.preco" v-maska="moneyMaskOptions" type="text" placeholder="0,00"
            :class="['bg-background dark:bg-background/70', errors.preco && 'border-danger']"
            @update:model-value="clearError('preco')" />
          <p v-if="errors.preco" class="mt-1 text-xs text-danger">{{ errors.preco }}</p>
        </div>

        <div class="md:col-span-4">
          <label class="mb-1.5 block text-sm font-medium text-foreground">
            Estoque <span class="text-red-500">*</span>
          </label>
          <Input v-model="store.varianteForm.estoque" type="number" min="0" :disabled="!controlaEstoqueAtivo"
            :class="['bg-background disabled:cursor-not-allowed disabled:bg-muted dark:bg-background/70', errors.estoque && 'border-danger']"
            @update:model-value="clearError('estoque')" />
          <p v-if="errors.estoque" class="mt-1 text-xs text-danger">{{ errors.estoque }}</p>
        </div>

        <div class="md:col-span-4">
          <label class="mb-1.5 block text-sm font-medium text-foreground">
            Estoque mínimo <span class="text-red-500">*</span>
          </label>
          <Input v-model="store.varianteForm.minimo" type="number" min="0" :disabled="!controlaEstoqueAtivo"
            :class="['bg-background disabled:cursor-not-allowed disabled:bg-muted dark:bg-background/70', errors.minimo && 'border-danger']"
            @update:model-value="clearError('minimo')" />
          <p v-if="errors.minimo" class="mt-1 text-xs text-danger">{{ errors.minimo }}</p>
        </div>
      </div>

      <!-- PREÇOS E CUSTOS -->
      <CollapsibleSection v-model:open="secPrecos" title="Preços e custos" :icon="CircleDollarSign">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div class="md:col-span-4">
            <label class="mb-1.5 block text-sm font-medium text-foreground">Preço de compra</label>
            <Input v-model="store.varianteForm.precoCompra" v-maska="moneyMaskOptions" type="text" placeholder="0,00"
              class="bg-background dark:bg-background/70" />
          </div>
          <div class="md:col-span-4">
            <label class="mb-1.5 flex items-center gap-1 text-sm font-medium text-foreground">
              Preço promocional
              <Tag class="h-3.5 w-3.5 text-red-500" />
            </label>
            <Input v-model="store.varianteForm.precoPromocional" v-maska="moneyMaskOptions" type="text" placeholder="0,00"
              :class="['bg-background dark:bg-background/70', errors.precoPromocional && 'border-danger']"
              @update:model-value="clearError('precoPromocional')" />
            <p v-if="errors.precoPromocional" class="mt-1 text-xs text-danger">{{ errors.precoPromocional }}</p>
          </div>
          <div class="md:col-span-4">
            <label class="mb-1.5 block text-sm font-medium text-foreground">Custo médio produção</label>
            <Input v-model="store.varianteForm.custoMedioProducao" type="number" min="0" step="0.01" placeholder="0,00"
              class="bg-background dark:bg-background/70" />
          </div>
        </div>
      </CollapsibleSection>

      <!-- DESCRIÇÃO E IMAGEM -->
      <CollapsibleSection v-model:open="secDescricao" title="Descrição e imagem" :icon="FileText">
        <div class="grid gap-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-foreground">Descrição</label>
            <Textarea v-model="store.varianteForm.descricao" rows="4"
              placeholder="Descreva esta variante: detalhes, medidas, composição, diferenciais"
              class="bg-background dark:bg-background/60" />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-medium text-foreground">Imagem da variante</label>
            <VarianteImagemField :key="store.varianteForm.id ?? 'nova'" :existing="store.varianteForm.imagem"
              @change="imagemChange = $event" />
          </div>
        </div>
      </CollapsibleSection>

      <!-- CONTROLE E VISIBILIDADE -->
      <CollapsibleSection v-model:open="secControle" title="Controle e visibilidade" :icon="Settings2">
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label
            class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
            <span>Controla estoque</span>
            <Switch v-model:model-value="store.varianteForm.controlaEstoque" />
          </label>
          <label
            class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
            <span>Mostrar no PDV</span>
            <Switch v-model:model-value="store.varianteForm.mostrarNoPdv" />
          </label>
          <label
            class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
            <span>Mostrar no catálogo online</span>
            <Switch v-model:model-value="store.varianteForm.mostrarNoCatalogo" />
          </label>
          <label
            class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
            <span>Permite saídas</span>
            <Switch v-model:model-value="store.varianteForm.saidas" />
          </label>
          <label
            class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
            <span>Permite entradas</span>
            <Switch v-model:model-value="store.varianteForm.entradas" />
          </label>
          <label
            class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
            <span>Produção local</span>
            <Switch v-model:model-value="store.varianteForm.producaoLocal" />
          </label>
          <label
            class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
            <span>Matéria prima</span>
            <Switch v-model:model-value="store.varianteForm.materiaPrima" />
          </label>
        </div>
      </CollapsibleSection>

      <!-- FISCAL -->
      <ProdutoFiscalFields :form="store.varianteForm" />

      <div class="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" :disabled="saving" @click="store.openModalVariante = false">Fechar</Button>
        <Button class="text-white" type="submit" :disabled="saving">
          <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
          {{ saving ? 'Salvando...' : 'Salvar variante' }}
        </Button>
      </div>
    </form>
  </ModalView>
</template>
