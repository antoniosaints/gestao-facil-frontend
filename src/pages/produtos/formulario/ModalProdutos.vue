<script lang="ts" setup>
import { computed } from 'vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { BadgePlus, CircleDollarSign, Layers3, Package2, Settings2 } from 'lucide-vue-next'
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
    ? 'Atualize os dados do produto base e da variante padrao.'
    : 'Cadastre o produto base. A variante padrao sera criada automaticamente.',
)

const estoqueReadonly = computed(() => store.form.id != null)

function buildPayload() {
  return {
    ...store.form,
    nome: store.form.nome.trim(),
    nomeVariante: store.form.nomeVariante.trim() || 'Padrao',
    descricao: store.form.descricao?.trim() || null,
    codigo: store.form.codigo?.trim() || undefined,
    unidade: store.form.unidade || 'un',
    preco: formatToNumberValue(store.form.preco),
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
  try {
    if (!validateForm()) return

    const payload = buildPayload()

    if (store.form.id) {
      await ProdutoRepository.update(payload, store.form.id)
      toast.success('Produto atualizado com sucesso')
    } else {
      await ProdutoRepository.save(payload)
      toast.success('Produto salvo com sucesso')
    }

    store.reset()
    store.updateTable()
    store.openModal = false
  } catch (error: any) {
    console.log(error)
    const errors = error?.response?.data?.data
      ? error.response.data.data.map((item: any) => item.message).join('\n')
      : 'Ocorreu um erro ao salvar o produto'
    toast.error(errors)
  }
}
</script>

<template>
  <div>
    <ModalView v-model:open="store.openModal" :title="title" :description="description" size="5xl">
      <form @submit.prevent="submit" class="grid gap-4 px-4 pb-1">
        <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
          <CardHeader class="space-y-1 p-4">
            <CardTitle class="flex items-center gap-2 text-base text-foreground">
              <Package2 class="h-4 w-4 text-primary dark:text-blue-500" />
              Dados do produto
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-2 px-4">
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
          </CardContent>
        </Card>

        <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
          <CardHeader class="space-y-1 p-4">
            <CardTitle class="flex items-center gap-2 text-base text-foreground">
              <Layers3 class="h-4 w-4 text-primary dark:text-blue-500" />
              Variante padrao
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-2 px-4">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div class="md:col-span-5">
                <label class="mb-1.5 block text-sm font-medium text-foreground">
                  Nome da variante <span class="text-red-500">*</span>
                </label>
                <Input v-model="store.form.nomeVariante" required type="text" placeholder="Padrao"
                  class="bg-background dark:bg-background/60" />
              </div>

              <div class="md:col-span-4">
                <label class="mb-1.5 block text-sm font-medium text-foreground">Codigo</label>
                <Input v-model="store.form.codigo" type="text" placeholder="Codigo interno ou SKU"
                  class="bg-background dark:bg-background/60" />
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
          </CardContent>
        </Card>

        <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
          <CardHeader class="space-y-1 p-4">
            <CardTitle class="flex items-center gap-2 text-base text-foreground">
              <CircleDollarSign class="h-4 w-4 text-primary dark:text-blue-500" />
              Preco e estoque
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-2 px-4">
            <div class="rounded-xl">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div class="md:col-span-4">
                  <label class="mb-1.5 block text-sm font-medium text-foreground">Preco de compra</label>
                  <Input v-model="store.form.precoCompra" v-maska="moneyMaskOptions" type="text" placeholder="0,00"
                    class="bg-background dark:bg-background/70" />
                </div>

                <div class="md:col-span-4">
                  <label class="mb-1.5 block text-sm font-medium text-foreground">
                    Preco de venda <span class="text-red-500">*</span>
                  </label>
                  <Input v-model="store.form.preco" v-maska="moneyMaskOptions" required type="text" placeholder="0,00"
                    class="bg-background dark:bg-background/70" />
                </div>

                <div class="md:col-span-4">
                  <label class="mb-1.5 block text-sm font-medium text-foreground">Custo medio producao</label>
                  <Input placeholder="0,00" v-model="store.form.custoMedioProducao" type="number" min="0" step="0.01"
                    class="bg-background dark:bg-background/70" />
                </div>
              </div>
            </div>

            <div class="rounded-xl">
              <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
                <div class="md:col-span-6">
                  <label class="mb-1.5 block text-sm font-medium text-foreground">
                    Estoque inicial <span class="text-red-500">* <span class="text-xs" v-if="estoqueReadonly">Campo não pode ser editado.</span></span>
                  </label>
                  <Input v-model="store.form.estoque" :readonly="estoqueReadonly"
                    class="bg-background read-only:cursor-not-allowed read-only:bg-muted dark:bg-background/70" required
                    type="number" min="0" />
                </div>

                <div class="md:col-span-6">
                  <label class="mb-1.5 block text-sm font-medium text-foreground">
                    Estoque minimo <span class="text-red-500">*</span>
                  </label>
                  <Input v-model="store.form.minimo" required type="number" min="0"
                    class="bg-background dark:bg-background/70" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
          <CardHeader class="space-y-1 p-4">
            <CardTitle class="flex items-center gap-2 text-base text-foreground">
              <Settings2 class="h-4 w-4 text-primary dark:text-blue-500" />
              Regras operacionais
            </CardTitle>
          </CardHeader>
          <CardContent class="space-y-2 px-4">
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
                <span>Materia prima</span>
                <Switch v-model:model-value="store.form.materiaPrima" />
              </label>
            </div>
          </CardContent>
        </Card>

        <div class="flex flex-col-reverse gap-2 border-t border-border/70 pt-1 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" @click="store.openModal = false">Fechar</Button>
          <Button class="text-white" type="submit">Salvar produto</Button>
        </div>
      </form>
    </ModalView>
    <ModalCategoriaProduto />
  </div>
</template>
