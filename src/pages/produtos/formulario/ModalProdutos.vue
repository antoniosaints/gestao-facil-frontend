<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useDebounceFn } from '@vueuse/core'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import VarianteImagemField from '@/pages/produtos/formulario/VarianteImagemField.vue'
import CollapsibleSection from './CollapsibleSection.vue'
import ProdutoFiscalFields from './ProdutoFiscalFields.vue'
import IaTextAssistant from '@/components/ia/IaTextAssistant.vue'
import { IaRepository } from '@/repositories/ia-repository'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { ProdutoRepository, ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { BadgePlus, CircleDollarSign, FileText, LoaderCircle, Lock, Settings2, Sparkles, Tag } from 'lucide-vue-next'
import { moneyMaskOptions } from '@/lib/imaska'
import { vMaska } from 'maska/vue'
import { formatToNumberValue } from '@/utils/formatters'
import ModalCategoriaProduto from './ModalCategoriaProduto.vue'

const store = useProdutoStore()
const toast = useToast()

function isBlank(value: string | number | null | undefined) {
  return String(value ?? '').trim() === ''
}

function toNullableNumber(value: unknown): number | null {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

const title = computed(() => (store.form.id ? 'Editar produto' : 'Novo produto'))
const description = computed(() =>
  store.form.id
    ? 'Atualize os dados do produto base e da variante padrão principal.'
    : 'Cadastre o produto base primeiro. A variante padrão inicial será criada automaticamente com os dados abaixo.',
)

const estoqueReadonly = computed(() => store.form.id != null)
const controlaEstoqueAtivo = computed(() => store.form.controlaEstoque)

// Bloqueia o botão salvar enquanto o produto + upload de imagem estão em andamento.
const saving = ref(false)

// Estado de abertura das seções colapsáveis.
const secPrecos = ref(true)
const secDescricao = ref(true)
const secControle = ref(false)

// Erros de validação por campo (todos exibidos de uma vez, inline).
const errors = reactive<Record<string, string>>({})
function clearError(field: string) {
  if (errors[field]) delete errors[field]
}

// Intenção de mudança de imagem da variante padrão, persistida após salvar o produto.
const imagemChange = ref<{ file: File | null; remove: boolean }>({ file: null, remove: false })
watch(
  () => store.openModal,
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

// Gera o SKU automaticamente ao digitar o nome (apenas em produto novo, código vazio e não bloqueado).
const autoGerarSku = useDebounceFn(() => {
  if (store.form.id || store.form.skuBloqueado) return
  if (!isBlank(store.form.codigo)) return
  if (isBlank(store.form.nome)) return
  store.gerarSkuProduto()
}, 600)

watch(
  () => store.form.nome,
  () => {
    if (!store.openModal) return
    autoGerarSku()
  },
)

// Geração da descrição do produto com IA (usada pelo IaTextAssistant).
async function gerarDescricaoIa(modo: 'gerar' | 'melhorar' | 'resumir') {
  const atributos = [
    store.form.unidade ? `Unidade: ${store.form.unidade}` : null,
    store.form.categoria ? `Categoria: ${store.form.categoria}` : null,
  ]
    .filter(Boolean)
    .join(', ')
  const r = await IaRepository.descricaoProduto({
    nome: store.form.nome,
    atributos: atributos || null,
    descricaoAtual: modo === 'melhorar' ? store.form.descricao : null,
  })
  return r.text
}

function buildPayload() {
  return {
    ...store.form,
    nome: store.form.nome.trim(),
    nomeVariante: store.form.nomeVariante.trim() || 'Padrao',
    descricao: store.form.descricao?.trim() || null,
    codigo: store.form.codigo?.trim() || undefined,
    unidade: store.form.unidade || 'un',
    preco: formatToNumberValue(store.form.preco),
    precoPromocional: isBlank(store.form.precoPromocional) ? null : formatToNumberValue(store.form.precoPromocional),
    precoCompra: isBlank(store.form.precoCompra) ? undefined : formatToNumberValue(store.form.precoCompra),
    estoque: Number(store.form.estoque),
    minimo: Number(store.form.minimo),
    entradas: store.form.entradas,
    saidas: store.form.saidas,
    controlaEstoque: store.form.controlaEstoque,
    producaoLocal: store.form.producaoLocal,
    mostrarNoPdv: store.form.mostrarNoPdv,
    materiaPrima: store.form.materiaPrima,
    custoMedioProducao: isBlank(store.form.custoMedioProducao)
      ? undefined
      : Number(store.form.custoMedioProducao),
    // Fiscais (normalizados)
    ncm: store.form.ncm?.toString().trim() || null,
    cest: store.form.cest?.toString().trim() || null,
    cfop: store.form.cfop?.toString().trim() || null,
    codigoProduto: store.form.codigoProduto?.toString().trim() || null,
    origem: store.form.origem ?? null,
    aliquotaIcms: toNullableNumber(store.form.aliquotaIcms),
    aliquotaIpi: toNullableNumber(store.form.aliquotaIpi),
    aliquotaPis: toNullableNumber(store.form.aliquotaPis),
    aliquotaCofins: toNullableNumber(store.form.aliquotaCofins),
    issAliquota: toNullableNumber(store.form.issAliquota),
  }
}

function validateForm() {
  Object.keys(errors).forEach((k) => delete errors[k])

  if (!store.form.nome.trim()) errors.nome = 'Informe o nome do produto'
  if (!store.form.nomeVariante.trim()) errors.nomeVariante = 'Informe o nome da variante padrão'
  if (!store.form.unidade) errors.unidade = 'Selecione a unidade'
  if (formatToNumberValue(store.form.preco) <= 0) errors.preco = 'Informe um preço de venda válido'
  if (
    !isBlank(store.form.precoPromocional) &&
    formatToNumberValue(store.form.precoPromocional) >= formatToNumberValue(store.form.preco)
  ) {
    errors.precoPromocional = 'O preço promocional deve ser menor que o preço de venda'
  }
  if (Number(store.form.estoque) < 0) errors.estoque = 'O estoque inicial não pode ser negativo'
  if (Number(store.form.minimo) < 0) errors.minimo = 'O estoque mínimo não pode ser negativo'

  // Abre a seção que contém campo com erro, para o usuário enxergar.
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

    const base = store.form.id
      ? await ProdutoRepository.update(payload, store.form.id)
      : await ProdutoRepository.save(payload)

    // Persiste a imagem (upload/remoção) na variante padrão do produto.
    const varianteId = base?.variantePadraoId ?? store.idMutation
    if (varianteId && (imagemChange.value.file || imagemChange.value.remove)) {
      try {
        await ProdutoVarianteRepository.persistImagem(varianteId, imagemChange.value)
      } catch (imgError) {
        console.log(imgError)
        toast.error('Produto salvo, mas não foi possível atualizar a imagem.')
      }
    }

    toast.success(store.form.id ? 'Produto atualizado com sucesso' : 'Produto salvo com sucesso')

    store.reset()
    store.updateTable()
    store.openModal = false
  } catch (error: any) {
    console.log(error)
    const errs = error?.response?.data?.data
      ? error.response.data.data.map((item: any) => item.message).join('\n')
      : 'Ocorreu um erro ao salvar o produto'
    toast.error(errs)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <ModalView v-model:open="store.openModal" :title="title" :description="description" size="5xl">
      <form @submit.prevent="submit" class="grid gap-4 px-4 pb-1">
        <!-- ESSENCIAL -->
        <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div class="md:col-span-7">
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Nome do produto <span class="text-red-500">*</span>
            </label>
            <Input v-model="store.form.nome" type="text" placeholder="Ex: Camiseta Dry Fit"
              :class="['bg-background dark:bg-background/60', errors.nome && 'border-danger']"
              @update:model-value="clearError('nome')" />
            <p v-if="errors.nome" class="mt-1 text-xs text-danger">{{ errors.nome }}</p>
          </div>

          <div class="md:col-span-5">
            <label class="mb-1.5 block text-sm font-medium text-foreground">Categoria</label>
            <div class="flex items-center gap-2">
              <Select2Ajax v-model:model-value="store.form.categoriaId" class="w-full"
                url="/produtos/categorias/select2" :allow-clear="true" placeholder="Selecione a categoria" />
              <Button type="button" variant="outline" class="shrink-0" @click="store.openSaveCategoria">
                <BadgePlus class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div class="md:col-span-5">
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Nome da variante <span class="text-red-500">*</span>
            </label>
            <Input v-model="store.form.nomeVariante" type="text" placeholder="Ex: Padrão, Azul G, 1L"
              :class="['bg-background dark:bg-background/60', errors.nomeVariante && 'border-danger']"
              @update:model-value="clearError('nomeVariante')" />
            <p v-if="errors.nomeVariante" class="mt-1 text-xs text-danger">{{ errors.nomeVariante }}</p>
          </div>

          <div class="md:col-span-4">
            <label class="mb-1.5 flex items-center gap-1 text-sm font-medium text-foreground">
              SKU / Código
              <Lock v-if="store.form.skuBloqueado" class="h-3.5 w-3.5 text-amber-500" />
            </label>
            <div class="flex gap-2">
              <Input v-model="store.form.codigo" type="text" placeholder="Gerado automaticamente se vazio"
                :disabled="store.form.skuBloqueado" class="bg-background dark:bg-background/60" />
              <Button type="button" variant="outline" size="icon" v-tooltip="'Gerar SKU automaticamente'"
                :disabled="store.form.skuBloqueado" @click="store.gerarSkuProduto()">
                <Sparkles class="h-4 w-4" />
              </Button>
            </div>
            <p v-if="store.form.skuBloqueado" class="mt-1 text-xs text-amber-600 dark:text-amber-400">
              SKU bloqueado: existem vendas ou ordens de serviço vinculadas. Remova essas conexões para poder alterar.
            </p>
          </div>

          <div class="md:col-span-3">
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Unidade <span class="text-red-500">*</span>
            </label>
            <Select v-model="store.form.unidade" @update:model-value="clearError('unidade')">
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
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div class="md:col-span-4">
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Preço de venda <span class="text-red-500">*</span>
            </label>
            <Input v-model="store.form.preco" v-maska="moneyMaskOptions" type="text" placeholder="0,00"
              :class="['bg-background dark:bg-background/70', errors.preco && 'border-danger']"
              @update:model-value="clearError('preco')" />
            <p v-if="errors.preco" class="mt-1 text-xs text-danger">{{ errors.preco }}</p>
          </div>

          <div class="md:col-span-4">
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Estoque inicial <span class="text-red-500">* <span class="text-xs" v-if="estoqueReadonly">Não
                  editável.</span></span>
            </label>
            <Input v-model="store.form.estoque" :readonly="estoqueReadonly" :disabled="!controlaEstoqueAtivo"
              :class="['bg-background read-only:cursor-not-allowed read-only:bg-muted disabled:cursor-not-allowed disabled:bg-muted dark:bg-background/70', errors.estoque && 'border-danger']"
              type="number" min="0" @update:model-value="clearError('estoque')" />
            <p v-if="errors.estoque" class="mt-1 text-xs text-danger">{{ errors.estoque }}</p>
          </div>

          <div class="md:col-span-4">
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Estoque mínimo <span class="text-red-500">*</span>
            </label>
            <Input v-model="store.form.minimo" type="number" min="0" :disabled="!controlaEstoqueAtivo"
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
              <Input v-model="store.form.precoCompra" v-maska="moneyMaskOptions" type="text" placeholder="0,00"
                class="bg-background dark:bg-background/70" />
            </div>

            <div class="md:col-span-4">
              <label class="mb-1.5 flex items-center gap-1 text-sm font-medium text-foreground">
                Preço promocional
                <Tag class="h-3.5 w-3.5 text-red-500" />
              </label>
              <Input v-model="store.form.precoPromocional" v-maska="moneyMaskOptions" type="text" placeholder="0,00"
                :class="['bg-background dark:bg-background/70', errors.precoPromocional && 'border-danger']"
                @update:model-value="clearError('precoPromocional')" />
              <p v-if="errors.precoPromocional" class="mt-1 text-xs text-danger">{{ errors.precoPromocional }}</p>
              <p v-else class="mt-1 text-xs text-muted-foreground">Ativa a seção "Promoções" na loja online.</p>
            </div>

            <div class="md:col-span-4">
              <label class="mb-1.5 block text-sm font-medium text-foreground">Custo médio produção</label>
              <Input placeholder="0,00" v-model="store.form.custoMedioProducao" type="number" min="0" step="0.01"
                class="bg-background dark:bg-background/70" />
            </div>
          </div>
        </CollapsibleSection>

        <!-- DESCRIÇÃO E IMAGEM -->
        <CollapsibleSection v-model:open="secDescricao" title="Descrição e imagem" :icon="FileText">
          <div class="grid gap-4">
            <div>
              <div class="mb-1.5 flex items-center justify-between gap-2">
                <label class="block text-sm font-medium text-foreground">Descrição</label>
                <IaTextAssistant v-model="store.form.descricao" :modos="['gerar', 'melhorar']"
                  title="Descrição do produto com IA" button-label="Gerar com IA"
                  :custom-generate="gerarDescricaoIa" />
              </div>
              <Textarea v-model="store.form.descricao" rows="4"
                placeholder="Adicione observações ou detalhes sobre o produto"
                class="bg-background dark:bg-background/70" />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-foreground">Imagem da variante</label>
              <VarianteImagemField :key="store.form.id ?? 'novo'" :existing="store.form.imagem"
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
              <Switch v-model:model-value="store.form.controlaEstoque" />
            </label>
            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
              <span>Mostrar no PDV</span>
              <Switch v-model:model-value="store.form.mostrarNoPdv" />
            </label>
            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
              <span>Mostrar no catálogo online</span>
              <Switch v-model:model-value="store.form.mostrarNoCatalogo" />
            </label>
            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
              <span>Permite saídas</span>
              <Switch v-model:model-value="store.form.saidas" />
            </label>
            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
              <span>Permite entradas</span>
              <Switch v-model:model-value="store.form.entradas" />
            </label>
            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
              <span>Produção local</span>
              <Switch v-model:model-value="store.form.producaoLocal" />
            </label>
            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
              <span>Matéria prima</span>
              <Switch v-model:model-value="store.form.materiaPrima" />
            </label>
          </div>
        </CollapsibleSection>

        <!-- FISCAL -->
        <ProdutoFiscalFields :form="store.form" />

        <div class="flex flex-col-reverse gap-2 border-t border-border/70 pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" :disabled="saving" @click="store.openModal = false">Fechar</Button>
          <Button class="text-white" type="submit" :disabled="saving">
            <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            {{ saving ? 'Salvando...' : 'Salvar produto' }}
          </Button>
        </div>
      </form>
    </ModalView>
    <ModalCategoriaProduto />
  </div>
</template>
