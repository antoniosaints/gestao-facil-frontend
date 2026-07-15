<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import VarianteImagemField from '@/pages/produtos/formulario/VarianteImagemField.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { ProdutoRepository, ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { BadgePlus, CircleDollarSign, Layers3, LoaderCircle, Lock, Package2, Settings2, Sparkles, Tag } from 'lucide-vue-next'
import { moneyMaskOptions } from '@/lib/imaska'
import { vMaska } from 'maska/vue'
import { formatToNumberValue } from '@/utils/formatters'
import ModalCategoriaProduto from './ModalCategoriaProduto.vue'

const store = useProdutoStore()
const toast = useToast()

function isBlank(value: string | number | null | undefined) {
  return String(value ?? '').trim() === ''
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

// Intenção de mudança de imagem da variante padrão, persistida após salvar o produto.
const imagemChange = ref<{ file: File | null; remove: boolean }>({ file: null, remove: false })
watch(
  () => store.openModal,
  (open) => {
    if (open) imagemChange.value = { file: null, remove: false }
  },
)

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
  }
}

function validateForm() {
  if (!store.form.nome.trim()) {
    toast.error('Informe o nome do produto')
    return false
  }

  if (!store.form.nomeVariante.trim()) {
    toast.error('Informe o nome da variante padrao')
    return false
  }

  if (!store.form.unidade) {
    toast.error('Selecione a unidade')
    return false
  }

  if (formatToNumberValue(store.form.preco) <= 0) {
    toast.error('Informe um preco de venda valido')
    return false
  }

  if (
    !isBlank(store.form.precoPromocional) &&
    formatToNumberValue(store.form.precoPromocional) >= formatToNumberValue(store.form.preco)
  ) {
    toast.error('O preço promocional deve ser menor que o preço de venda')
    return false
  }

  if (Number(store.form.estoque) < 0) {
    toast.error('O estoque inicial nao pode ser negativo')
    return false
  }

  if (Number(store.form.minimo) < 0) {
    toast.error('O estoque minimo nao pode ser negativo')
    return false
  }

  return true
}

async function submit() {
  if (saving.value) return
  try {
    if (!validateForm()) return
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
    const errors = error?.response?.data?.data
      ? error.response.data.data.map((item: any) => item.message).join('\n')
      : 'Ocorreu um erro ao salvar o produto'
    toast.error(errors)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <ModalView v-model:open="store.openModal" :title="title" :description="description" size="5xl">
      <form @submit.prevent="submit" class="grid gap-4 px-4 pb-1">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div class="md:col-span-7">
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Nome do produto <span class="text-red-500">*</span>
            </label>
            <Input v-model="store.form.nome" required type="text" placeholder="Ex: Camiseta Dry Fit"
              class="bg-background dark:bg-background/60" />
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

        <div class="rounded-xl">
          <label class="mb-1.5 block text-sm font-medium text-foreground">Descricao</label>
          <Textarea v-model="store.form.descricao" rows="4"
            placeholder="Adicione observacoes ou detalhes sobre o produto"
            class="bg-background dark:bg-background/70" />
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-foreground">Imagem da variante</label>
          <VarianteImagemField
            :key="store.form.id ?? 'novo'"
            :existing="store.form.imagem"
            @change="imagemChange = $event"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div class="md:col-span-5">
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Nome da variante <span class="text-red-500">*</span>
            </label>
            <Input v-model="store.form.nomeVariante" required type="text" placeholder="Ex: Padrão, Azul G, 1L"
              class="bg-background dark:bg-background/60" />
          </div>

          <div class="md:col-span-4">
            <label class="mb-1.5 flex items-center gap-1 text-sm font-medium text-foreground">
              SKU / Código
              <Lock v-if="store.form.skuBloqueado" class="h-3.5 w-3.5 text-amber-500" />
            </label>
            <div class="flex gap-2">
              <Input v-model="store.form.codigo" type="text" placeholder="Gerado automaticamente se vazio"
                :disabled="store.form.skuBloqueado" class="bg-background dark:bg-background/60" />
              <Button type="button" variant="outline" size="icon" title="Gerar SKU automaticamente"
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
            <Select v-model="store.form.unidade" required>
              <SelectTrigger class="w-full bg-background dark:bg-background/60">
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
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div class="md:col-span-3">
            <label class="mb-1.5 block text-sm font-medium text-foreground">Preco de compra</label>
            <Input v-model="store.form.precoCompra" v-maska="moneyMaskOptions" type="text" placeholder="0,00"
              class="bg-background dark:bg-background/70" />
          </div>

          <div class="md:col-span-3">
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Preco de venda <span class="text-red-500">*</span>
            </label>
            <Input v-model="store.form.preco" v-maska="moneyMaskOptions" required type="text" placeholder="0,00"
              class="bg-background dark:bg-background/70" />
          </div>

          <div class="md:col-span-3">
            <label class="mb-1.5 flex items-center gap-1 text-sm font-medium text-foreground">
              Preço promocional
              <Tag class="h-3.5 w-3.5 text-red-500" />
            </label>
            <Input v-model="store.form.precoPromocional" v-maska="moneyMaskOptions" type="text" placeholder="0,00"
              class="bg-background dark:bg-background/70" />
            <p class="mt-1 text-xs text-muted-foreground">Ativa a seção "Promoções" na loja online.</p>
          </div>

          <div class="md:col-span-3">
            <label class="mb-1.5 block text-sm font-medium text-foreground">Custo medio producao</label>
            <Input placeholder="0,00" v-model="store.form.custoMedioProducao" type="number" min="0" step="0.01"
              class="bg-background dark:bg-background/70" />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
          <div class="md:col-span-6">
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Estoque inicial <span class="text-red-500">* <span class="text-xs" v-if="estoqueReadonly">Campo não
                  pode ser editado.</span></span>
            </label>
            <Input v-model="store.form.estoque" :readonly="estoqueReadonly" :disabled="!controlaEstoqueAtivo"
              class="bg-background read-only:cursor-not-allowed read-only:bg-muted disabled:cursor-not-allowed disabled:bg-muted dark:bg-background/70"
              required type="number" min="0" />
          </div>

          <div class="md:col-span-6">
            <label class="mb-1.5 block text-sm font-medium text-foreground">
              Estoque minimo <span class="text-red-500">*</span>
            </label>
            <Input v-model="store.form.minimo" required type="number" min="0" :disabled="!controlaEstoqueAtivo"
              class="bg-background disabled:cursor-not-allowed disabled:bg-muted dark:bg-background/70" />
          </div>
        </div>
        <hr>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label
            class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
            <span>Permite saidas</span>
            <Switch v-model:model-value="store.form.saidas" />
          </label>

          <label
            class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
            <span>Permite entradas</span>
            <Switch v-model:model-value="store.form.entradas" />
          </label>

          <label
            class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
            <span>Producao local</span>
            <Switch v-model:model-value="store.form.producaoLocal" />
          </label>

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
            <span>Materia prima</span>
            <Switch v-model:model-value="store.form.materiaPrima" />
          </label>
        </div>

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
