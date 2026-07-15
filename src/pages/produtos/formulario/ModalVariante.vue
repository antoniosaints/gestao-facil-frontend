<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import VarianteImagemField from '@/pages/produtos/formulario/VarianteImagemField.vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { moneyMaskOptions } from '@/lib/imaska'
import { vMaska } from 'maska/vue'
import { formatToNumberValue } from '@/utils/formatters'
import { CircleDollarSign, LoaderCircle, Lock, PackagePlus, Settings2, Sparkles, Tag } from 'lucide-vue-next'

const store = useProdutoStore()
const toast = useToast()

const title = computed(() => (store.varianteForm.id ? 'Editar variante' : 'Nova variante'))
const description = computed(() =>
  store.varianteForm.id
    ? 'Atualize os dados da variante vinculada ao produto base selecionado.'
    : 'Selecione o produto base e preencha somente o que muda nesta nova variante.',
)
const controlaEstoqueAtivo = computed(() => store.varianteForm.controlaEstoque)

// Bloqueia o botão salvar enquanto a variante + upload de imagem estão em andamento.
const saving = ref(false)

// Intenção de mudança de imagem (arquivo novo ou remoção), persistida após salvar a variante.
const imagemChange = ref<{ file: File | null; remove: boolean }>({ file: null, remove: false })
watch(
  () => store.openModalVariante,
  (open) => {
    if (open) imagemChange.value = { file: null, remove: false }
  },
)

function isBlank(value: string | number | null | undefined) {
  return String(value ?? '').trim() === ''
}

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
  }
}

function validateForm() {
  if (!store.varianteForm.produtoBaseId) {
    toast.error('Produto base nao informado')
    return false
  }

  if (!store.varianteForm.nomeVariante.trim()) {
    toast.error('Informe o nome da variante')
    return false
  }

  if (!store.varianteForm.unidade) {
    toast.error('Selecione a unidade')
    return false
  }

  if (formatToNumberValue(store.varianteForm.preco) <= 0) {
    toast.error('Informe um preco de venda valido')
    return false
  }

  if (
    !isBlank(store.varianteForm.precoPromocional) &&
    formatToNumberValue(store.varianteForm.precoPromocional) >= formatToNumberValue(store.varianteForm.preco)
  ) {
    toast.error('O preço promocional deve ser menor que o preço de venda')
    return false
  }

  if (Number(store.varianteForm.estoque) < 0) {
    toast.error('O estoque da variante nao pode ser negativo')
    return false
  }

  if (Number(store.varianteForm.minimo) < 0) {
    toast.error('O estoque minimo da variante nao pode ser negativo')
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
    if (payload.produtoBaseId == null) {
      toast.error('Produto base nao informado')
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
    const errors = error?.response?.data?.data
      ? error.response.data.data.map((item: any) => item.message).join('\n')
      : error?.response?.data?.message || 'Erro ao salvar a variante'
    toast.error(errors)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ModalView v-model:open="store.openModalVariante" :title="title" :description="description" size="4xl">
    <form @submit.prevent="submit" class="grid gap-5 px-4 pb-1">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div class="md:col-span-12">
          <label class="mb-1.5 block text-sm font-medium text-foreground">
            Produto base <span class="text-red-500">*</span>
          </label>
          <Select2Ajax v-model:model-value="store.varianteForm.produtoBaseId" class="w-full" url="/produtos/select2"
            :params="[{ key: 'baseOnly', value: true }]" placeholder="Selecione o produto para receber a nova variante"
            :disabled="!!store.varianteForm.id" />
        </div>

        <div class="md:col-span-6">
          <label class="mb-1.5 block text-sm font-medium text-foreground">
            Nome da variante <span class="text-red-500">*</span>
          </label>
          <Input v-model="store.varianteForm.nomeVariante" required type="text" placeholder="Ex: Azul G, Caixa 12un, 1L"
            class="bg-background dark:bg-background/60" />
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
            SKU bloqueado: existem vendas ou ordens de serviço vinculadas. Remova essas conexões para poder alterar.
          </p>
        </div>

        <div class="md:col-span-3">
          <label class="mb-1.5 block text-sm font-medium text-foreground">
            Unidade <span class="text-red-500">*</span>
          </label>
          <Select v-model="store.varianteForm.unidade" required>
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

      <div>
        <label class="mb-1.5 block text-sm font-medium text-foreground">Imagem da variante</label>
        <VarianteImagemField
          :key="store.varianteForm.id ?? 'nova'"
          :existing="store.varianteForm.imagem"
          @change="imagemChange = $event"
        />
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div class="md:col-span-3">
          <label class="mb-1.5 block text-sm font-medium text-foreground">Preco de compra</label>
          <Input v-model="store.varianteForm.precoCompra" v-maska="moneyMaskOptions" type="text" placeholder="0,00"
            class="bg-background dark:bg-background/70" />
        </div>

        <div class="md:col-span-3">
          <label class="mb-1.5 block text-sm font-medium text-foreground">
            Preco de venda <span class="text-red-500">*</span>
          </label>
          <Input v-model="store.varianteForm.preco" v-maska="moneyMaskOptions" required type="text" placeholder="0,00"
            class="bg-background dark:bg-background/70" />
        </div>

        <div class="md:col-span-3">
          <label class="mb-1.5 flex items-center gap-1 text-sm font-medium text-foreground">
            Preço promocional
            <Tag class="h-3.5 w-3.5 text-red-500" />
          </label>
          <Input v-model="store.varianteForm.precoPromocional" v-maska="moneyMaskOptions" type="text" placeholder="0,00"
            class="bg-background dark:bg-background/70" />
        </div>

        <div class="md:col-span-3">
          <label class="mb-1.5 block text-sm font-medium text-foreground">Custo medio producao</label>
          <Input v-model="store.varianteForm.custoMedioProducao" type="number" min="0" step="0.01"
            class="bg-background dark:bg-background/70" />
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div class="md:col-span-6">
          <label class="mb-1.5 block text-sm font-medium text-foreground">
            Estoque <span class="text-red-500">*</span>
          </label>
          <Input v-model="store.varianteForm.estoque" required type="number" min="0" :disabled="!controlaEstoqueAtivo"
            class="bg-background disabled:cursor-not-allowed disabled:bg-muted dark:bg-background/70" />
        </div>

        <div class="md:col-span-6">
          <label class="mb-1.5 block text-sm font-medium text-foreground">
            Estoque minimo <span class="text-red-500">*</span>
          </label>
          <Input v-model="store.varianteForm.minimo" required type="number" min="0" :disabled="!controlaEstoqueAtivo"
            class="bg-background disabled:cursor-not-allowed disabled:bg-muted dark:bg-background/70" />
        </div>
      </div>
      <hr>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label
          class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
          <span>Permite saidas</span>
          <Switch v-model:model-value="store.varianteForm.saidas" />
        </label>

        <label
          class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
          <span>Permite entradas</span>
          <Switch v-model:model-value="store.varianteForm.entradas" />
        </label>

        <label
          class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20">
          <span>Producao local</span>
          <Switch v-model:model-value="store.varianteForm.producaoLocal" />
        </label>

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
          <span>Materia prima</span>
          <Switch v-model:model-value="store.varianteForm.materiaPrima" />
        </label>
      </div>
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
