<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Award, CheckCircle2, LoaderCircle, Pizza, Save, Sparkles } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { RestauranteRepository, type RestauranteFidelidadePrograma } from '@/repositories/restaurante-repository'

const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const items = ref<Array<{ id: number; nome: string; imagem?: string | null }>>([])
const categories = ref<Array<{ id: number; nome: string }>>([])
const form = reactive<RestauranteFidelidadePrograma>({
  ativo: false,
  pedidosMeta: 6,
  categoriaIds: [],
  catalogoItemIds: [],
  premioCatalogoItemId: null,
  descontoPercentual: 100,
})

const selectedPrize = computed(() => items.value.find((item) => item.id === form.premioCatalogoItemId) || null)
const ruleSummary = computed(() => {
  const pieces: string[] = []
  if (form.categoriaIds.length) pieces.push(`${form.categoriaIds.length} categoria(s)`)
  if (form.catalogoItemIds.length) pieces.push(`${form.catalogoItemIds.length} produto(s)`)
  return pieces.length ? pieces.join(' ou ') : 'qualquer produto do cardápio'
})

function toggle(list: number[], id: number, checked: boolean) {
  const next = checked ? [...new Set([...list, id])] : list.filter((current) => current !== id)
  return next
}

async function load() {
  try {
    const [program, options] = await Promise.all([RestauranteRepository.fidelidade(), RestauranteRepository.opcoesFidelidade()])
    items.value = options.itens
    categories.value = options.categorias
    if (program) Object.assign(form, program)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar a fidelidade.')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (form.ativo && !form.premioCatalogoItemId) return toast.info('Selecione o produto que será premiado.')
  try {
    saving.value = true
    Object.assign(form, await RestauranteRepository.salvarFidelidade({ ...form }))
    toast.success('Programa de fidelidade salvo.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar a fidelidade.')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto space-y-5 p-4 sm:p-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Award class="h-6 w-6 text-primary" />Fidelidade do restaurante
        </h1>
        <p class="text-sm text-muted-foreground">
          Transforme pedidos recorrentes em uma recompensa clara para o cliente. Uma recompensa clara para o cliente.
        </p>
      </div>
      <Button :disabled="loading || saving" @click="save"><LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" /><Save v-else class="mr-2 h-4 w-4" />Salvar programa</Button>
    </div>

    <div v-if="loading" class="flex min-h-64 items-center justify-center text-sm text-muted-foreground"><LoaderCircle class="mr-2 h-5 w-5 animate-spin" />Carregando fidelidade…</div>
    <template v-else>
      <Card class="overflow-hidden border-primary/70 bg-gradient-to-br from-primary/10 via-background to-primary/10 dark:from-primary/30 dark:to-background">
        <CardContent class="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-4"><span class="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20"><Award class="h-7 w-7" /></span><div><p class="font-semibold">Programa {{ form.ativo ? 'ativo' : 'em rascunho' }}</p><p class="mt-0.5 text-sm text-muted-foreground">A cada {{ form.pedidosMeta }} pedidos com {{ ruleSummary }}, o cliente recebe uma recompensa.</p></div></div>
          <div class="flex items-center gap-3 rounded-xl bg-background/80 px-4 py-3 shadow-sm"><Label for="fidelidade-ativa" class="font-medium">Ativar fidelidade</Label><Switch id="fidelidade-ativa" v-model:checked="form.ativo" /></div>
        </CardContent>
      </Card>

      <div class="grid gap-5 lg:grid-cols-[1fr_.85fr]">
        <Card><CardHeader><CardTitle class="flex items-center gap-2 text-lg"><CheckCircle2 class="h-5 w-5 text-blue-600" />Regra para pontuar</CardTitle><CardDescription>O pedido concluído conta uma vez quando contiver pelo menos uma das escolhas abaixo.</CardDescription></CardHeader><CardContent class="space-y-6">
          <div class="max-w-xs space-y-2"><Label for="meta">Quantidade de pedidos</Label><Input id="meta" v-model.number="form.pedidosMeta" type="number" min="2" max="100" /></div>
          <div class="space-y-2"><Label>Categorias elegíveis</Label><p class="text-xs text-muted-foreground">Deixe sem seleção para não limitar por categoria.</p><div class="grid gap-2 sm:grid-cols-2"><label v-for="category in categories" :key="category.id" class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/40"><Checkbox :checked="form.categoriaIds.includes(category.id)" @update:checked="form.categoriaIds = toggle(form.categoriaIds, category.id, Boolean($event))" />{{ category.nome }}</label></div></div>
          <div class="space-y-2"><Label>Produtos elegíveis</Label><p class="text-xs text-muted-foreground">Pode combinar produtos e categorias.</p><div class="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2"><label v-for="item in items" :key="item.id" class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/40"><Checkbox :checked="form.catalogoItemIds.includes(item.id)" @update:checked="form.catalogoItemIds = toggle(form.catalogoItemIds, item.id, Boolean($event))" /><span class="truncate">{{ item.nome }}</span></label></div></div>
        </CardContent></Card>
        <Card><CardHeader><CardTitle class="flex items-center gap-2 text-lg"><Sparkles class="h-5 w-5 text-primary" />Recompensa</CardTitle><CardDescription>O cliente recebe uma unidade do produto escolhido com o desconto definido.</CardDescription></CardHeader><CardContent class="space-y-5">
          <div class="space-y-2"><Label>Produto premiado</Label><Select :model-value="form.premioCatalogoItemId ? String(form.premioCatalogoItemId) : ''" @update:model-value="form.premioCatalogoItemId = $event ? Number($event) : null"><SelectTrigger><SelectValue placeholder="Selecione no cardápio" /></SelectTrigger><SelectContent><SelectItem v-for="item in items" :key="item.id" :value="String(item.id)">{{ item.nome }}</SelectItem></SelectContent></Select></div>
          <div class="space-y-2"><Label for="desconto">Desconto da recompensa (%)</Label><Input id="desconto" v-model.number="form.descontoPercentual" type="number" min="1" max="100" /></div>
          <div class="rounded-2xl border border-dashed border-primary bg-primary/10 p-5 dark:bg-primary/20"><Pizza class="mb-3 h-6 w-6 text-foreground" /><p class="font-semibold text-foreground">Como aparece para o cliente</p><p v-if="selectedPrize" class="mt-2 text-sm leading-relaxed text-muted-foreground">Faça {{ form.pedidosMeta }} pedidos com {{ ruleSummary }} e ganhe <strong>{{ form.descontoPercentual }}% de desconto</strong> em <strong>{{ selectedPrize.nome }}</strong>.</p><p v-else class="mt-2 text-sm text-muted-foreground">Selecione o produto que será dado como prêmio.</p><Badge class="mt-4 border-0 primary">Recompensa por pedido concluído</Badge></div>
        </CardContent></Card>
      </div>
    </template>
  </div>
</template>
