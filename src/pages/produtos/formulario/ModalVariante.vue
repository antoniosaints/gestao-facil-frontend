<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { moneyMaskOptions } from '@/lib/imaska'
import { vMaska } from 'maska/vue'
import { formatToNumberValue } from '@/utils/formatters'
import { CircleDollarSign, PackagePlus, Settings2 } from 'lucide-vue-next'

const store = useProdutoStore()
const toast = useToast()

const title = computed(() => (store.varianteForm.id ? 'Editar variante' : 'Nova variante'))

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
  try {
    if (!validateForm()) return

    const payload = buildPayload()
    if (payload.produtoBaseId == null) {
      toast.error('Produto base nao informado')
      return
    }

    await ProdutoVarianteRepository.save({
      ...payload,
      produtoBaseId: payload.produtoBaseId,
    })

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
  }
}
</script>

<template>
  <ModalView
    v-model:open="store.openModalVariante"
    :title="title"
    description="Cadastre uma variante vinculada ao produto base selecionado."
    size="4xl"
  >
    <form @submit.prevent="submit" class="grid gap-5 px-4 pb-1">
      <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
        <CardHeader class="space-y-1">
          <CardTitle class="flex items-center gap-2 text-base text-foreground">
            <PackagePlus class="h-4 w-4 text-primary" />
            Identificacao da variante
          </CardTitle>
          <CardDescription class="text-muted-foreground">
            Configure os dados que diferenciam essa variante nas selecoes e listagens.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
            <div class="md:col-span-6">
              <label class="mb-1.5 block text-sm font-medium text-foreground">
                Nome da variante <span class="text-red-500">*</span>
              </label>
              <Input
                v-model="store.varianteForm.nomeVariante"
                required
                type="text"
                placeholder="Ex: Azul G"
                class="bg-background dark:bg-background/60"
              />
            </div>

            <div class="md:col-span-3">
              <label class="mb-1.5 block text-sm font-medium text-foreground">Codigo</label>
              <Input
                v-model="store.varianteForm.codigo"
                type="text"
                placeholder="SKU ou codigo interno"
                class="bg-background dark:bg-background/60"
              />
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
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
        <CardHeader class="space-y-1">
          <CardTitle class="flex items-center gap-2 text-base text-foreground">
            <CircleDollarSign class="h-4 w-4 text-primary" />
            Preco e estoque
          </CardTitle>
          <CardDescription class="text-muted-foreground">
            Mantenha os dados comerciais e o estoque da variante organizados por bloco.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="rounded-xl">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div class="md:col-span-4">
                <label class="mb-1.5 block text-sm font-medium text-foreground">Preco de compra</label>
                <Input
                  v-model="store.varianteForm.precoCompra"
                  v-maska="moneyMaskOptions"
                  type="text"
                  placeholder="0,00"
                  class="bg-background dark:bg-background/70"
                />
              </div>

              <div class="md:col-span-4">
                <label class="mb-1.5 block text-sm font-medium text-foreground">
                  Preco de venda <span class="text-red-500">*</span>
                </label>
                <Input
                  v-model="store.varianteForm.preco"
                  v-maska="moneyMaskOptions"
                  required
                  type="text"
                  placeholder="0,00"
                  class="bg-background dark:bg-background/70"
                />
              </div>

              <div class="md:col-span-4">
                <label class="mb-1.5 block text-sm font-medium text-foreground">Custo medio producao</label>
                <Input
                  v-model="store.varianteForm.custoMedioProducao"
                  type="number"
                  min="0"
                  step="0.01"
                  class="bg-background dark:bg-background/70"
                />
              </div>
            </div>
          </div>

          <div class="rounded-xl">
            <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
              <div class="md:col-span-6">
                <label class="mb-1.5 block text-sm font-medium text-foreground">
                  Estoque <span class="text-red-500">*</span>
                </label>
                <Input
                  v-model="store.varianteForm.estoque"
                  required
                  type="number"
                  min="0"
                  class="bg-background dark:bg-background/70"
                />
              </div>

              <div class="md:col-span-6">
                <label class="mb-1.5 block text-sm font-medium text-foreground">
                  Estoque minimo <span class="text-red-500">*</span>
                </label>
                <Input
                  v-model="store.varianteForm.minimo"
                  required
                  type="number"
                  min="0"
                  class="bg-background dark:bg-background/70"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
        <CardHeader class="space-y-1">
          <CardTitle class="flex items-center gap-2 text-base text-foreground">
            <Settings2 class="h-4 w-4 text-primary" />
            Regras operacionais
          </CardTitle>
          <CardDescription class="text-muted-foreground">
            Controle a participacao da variante em entradas, saidas, producao e PDV.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20"
            >
              <span>Permite saidas</span>
              <Switch v-model:model-value="store.varianteForm.saidas" />
            </label>

            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20"
            >
              <span>Permite entradas</span>
              <Switch v-model:model-value="store.varianteForm.entradas" />
            </label>

            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20"
            >
              <span>Producao local</span>
              <Switch v-model:model-value="store.varianteForm.producaoLocal" />
            </label>

            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20"
            >
              <span>Controla estoque</span>
              <Switch v-model:model-value="store.varianteForm.controlaEstoque" />
            </label>

            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20"
            >
              <span>Mostrar no PDV</span>
              <Switch v-model:model-value="store.varianteForm.mostrarNoPdv" />
            </label>

            <label
              class="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/40 dark:bg-background/40 dark:hover:bg-muted/20"
            >
              <span>Materia prima</span>
              <Switch v-model:model-value="store.varianteForm.materiaPrima" />
            </label>
          </div>
        </CardContent>
      </Card>

      <div class="flex flex-col-reverse gap-2 border-t border-border/70 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" @click="store.openModalVariante = false">Fechar</Button>
        <Button class="text-white" type="submit">Salvar variante</Button>
      </div>
    </form>
  </ModalView>
</template>
