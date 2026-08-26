<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { Award, CheckCircle2, LoaderCircle, Pencil, Pizza, Plus, Save, Sparkles, Trash2 } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { RestauranteRepository, type RestauranteFidelidadePrograma } from '@/repositories/restaurante-repository'

const toast = useToast()
const confirm = useConfirm()
const loading = ref(true)
const saving = ref(false)
const dialogOpen = ref(false)
const programs = ref<RestauranteFidelidadePrograma[]>([])
const items = ref<Array<{ id: number; nome: string; imagem?: string | null }>>([])
const categories = ref<Array<{ id: number; nome: string }>>([])

function emptyProgram(): RestauranteFidelidadePrograma {
  return { ativo: true, pedidosMeta: 6, categoriaIds: [], catalogoItemIds: [], premioCatalogoItemId: null, descontoPercentual: 100 }
}

const form = reactive<RestauranteFidelidadePrograma>(emptyProgram())
const selectedPrize = computed(() => items.value.find((item) => item.id === form.premioCatalogoItemId) || null)

function ruleSummary(program: RestauranteFidelidadePrograma) {
  const pieces: string[] = []
  if (program.categoriaIds.length) pieces.push(`${program.categoriaIds.length} categoria(s)`)
  if (program.catalogoItemIds.length) pieces.push(`${program.catalogoItemIds.length} produto(s)`)
  return pieces.length ? pieces.join(' ou ') : 'qualquer produto do cardápio'
}

function prizeName(program: RestauranteFidelidadePrograma) {
  return items.value.find((item) => item.id === program.premioCatalogoItemId)?.nome || 'Prêmio não definido'
}

function toggle(list: number[], id: number, checked: boolean) {
  return checked ? [...new Set([...list, id])] : list.filter((current) => current !== id)
}

function openForm(program?: RestauranteFidelidadePrograma) {
  form.id = undefined
  form.version = undefined
  Object.assign(form, emptyProgram(), program ? { ...program, categoriaIds: [...program.categoriaIds], catalogoItemIds: [...program.catalogoItemIds] } : {})
  dialogOpen.value = true
}

async function load() {
  try {
    const [result, options] = await Promise.all([RestauranteRepository.fidelidades(), RestauranteRepository.opcoesFidelidade()])
    programs.value = result
    items.value = options.itens
    categories.value = options.categorias
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar as promoções de fidelidade.')
  } finally {
    loading.value = false
  }
}

async function save() {
  if (form.ativo && !form.premioCatalogoItemId) return toast.info('Selecione o produto que será premiado.')
  try {
    saving.value = true
    const saved = await RestauranteRepository.salvarFidelidade({ ...form })
    const index = programs.value.findIndex((program) => program.id === saved.id)
    if (index >= 0) programs.value.splice(index, 1, saved)
    else programs.value.unshift(saved)
    dialogOpen.value = false
    toast.success('Promoção de fidelidade salva.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar a promoção.')
  } finally {
    saving.value = false
  }
}

async function setActive(program: RestauranteFidelidadePrograma, ativo: boolean) {
  if (ativo && !program.premioCatalogoItemId) return toast.info('Defina o produto premiado antes de ativar a promoção.')
  try {
    const saved = await RestauranteRepository.salvarFidelidade({ ...program, ativo })
    const index = programs.value.findIndex((entry) => entry.id === saved.id)
    if (index >= 0) programs.value.splice(index, 1, saved)
    toast.success(ativo ? 'Promoção ativada.' : 'Promoção desativada.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível alterar a promoção.')
  }
}

async function remove(program: RestauranteFidelidadePrograma) {
  if (!program.id) return
  const accepted = await confirm.confirm({
    title: 'Excluir promoção',
    message: 'Esta promoção será removida. O progresso já registrado deixa de ficar disponível para uso.',
    confirmText: 'Excluir promoção',
    cancelText: 'Cancelar',
    colorButton: 'danger',
  })
  if (!accepted) return
  try {
    await RestauranteRepository.excluirFidelidade(program.id)
    programs.value = programs.value.filter((entry) => entry.id !== program.id)
    toast.success('Promoção excluída.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível excluir a promoção.')
  }
}

onMounted(load)
</script>

<template>
  <div class="mx-auto space-y-5 p-4 sm:p-6">
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight"><Award class="h-6 w-6 text-primary" />Promoções de fidelidade</h1>
        <p class="text-sm text-muted-foreground">Crie regras diferentes para premiar os clientes recorrentes.</p>
      </div>
      <Button :disabled="loading" @click="openForm()"><Plus class="mr-2 h-4 w-4" />Nova promoção</Button>
    </div>

    <div v-if="loading" class="flex min-h-64 items-center justify-center text-sm text-muted-foreground"><LoaderCircle class="mr-2 h-5 w-5 animate-spin" />Carregando promoções…</div>
    <template v-else>
      <div v-if="!programs.length" class="rounded-2xl border border-dashed p-10 text-center"><Award class="mx-auto mb-3 h-8 w-8 text-primary" /><p class="font-semibold">Nenhuma promoção cadastrada</p><p class="mt-1 text-sm text-muted-foreground">Crie a primeira regra de fidelidade para começar.</p><Button class="mt-5" @click="openForm()"><Plus class="mr-2 h-4 w-4" />Criar promoção</Button></div>
      <div v-else class="grid gap-4 xl:grid-cols-2">
        <Card v-for="program in programs" :key="program.id" class="overflow-hidden">
          <CardHeader class="pb-3"><div class="flex items-start justify-between gap-3"><div><CardTitle class="flex items-center gap-2 text-lg"><Award class="h-5 w-5 text-primary" />{{ prizeName(program) }}</CardTitle><CardDescription class="mt-1">A cada {{ program.pedidosMeta }} itens com {{ ruleSummary(program) }}.</CardDescription></div><Badge :variant="program.ativo ? 'default' : 'secondary'">{{ program.ativo ? 'Ativa' : 'Desativada' }}</Badge></div></CardHeader>
          <CardContent class="space-y-3"><div class="rounded-xl bg-muted/45 p-3 text-sm"><p class="font-medium">Recompensa</p><p class="mt-1 text-muted-foreground">{{ program.descontoPercentual }}% de desconto em {{ prizeName(program) }}.</p></div><div class="flex items-center justify-between rounded-xl border px-3 py-2"><Label :for="`program-${program.id}`" class="cursor-pointer text-sm">{{ program.ativo ? 'Promoção disponível' : 'Promoção pausada' }}</Label><Switch :id="`program-${program.id}`" :model-value="program.ativo" @update:model-value="setActive(program, Boolean($event))" /></div></CardContent>
          <CardFooter class="justify-end gap-2 border-t bg-muted/20 py-3"><Button variant="outline" size="sm" @click="openForm(program)"><Pencil class="mr-2 h-4 w-4" />Editar</Button><Button variant="destructive" size="sm" @click="remove(program)"><Trash2 class="mr-2 h-4 w-4" />Excluir</Button></CardFooter>
        </Card>
      </div>
    </template>

    <Dialog v-model:open="dialogOpen"><DialogContent class="max-h-[92vh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>{{ form.id ? 'Editar promoção' : 'Nova promoção' }}</DialogTitle><DialogDescription>Escolha quem participa, a quantidade de pedidos e a recompensa.</DialogDescription></DialogHeader>
      <div class="grid gap-5 lg:grid-cols-[1fr_.85fr]"><Card><CardHeader><CardTitle class="flex items-center gap-2 text-lg"><CheckCircle2 class="h-5 w-5 text-blue-600" />Regra para pontuar</CardTitle><CardDescription>Cada unidade elegível de um pedido concluído soma na promoção.</CardDescription></CardHeader><CardContent class="space-y-5"><div class="max-w-xs space-y-2"><Label for="meta">Quantidade de itens</Label><Input id="meta" v-model.number="form.pedidosMeta" type="number" min="2" max="100" /></div><div class="space-y-2"><Label>Categorias elegíveis</Label><p class="text-xs text-muted-foreground">Deixe sem seleção para não limitar por categoria.</p><div class="grid gap-2 sm:grid-cols-2"><label v-for="category in categories" :key="category.id" class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/40"><Checkbox :model-value="form.categoriaIds.includes(category.id)" @update:model-value="form.categoriaIds = toggle(form.categoriaIds, category.id, Boolean($event))" />{{ category.nome }}</label></div></div><div class="space-y-2"><Label>Produtos elegíveis</Label><p class="text-xs text-muted-foreground">Pode combinar produtos e categorias.</p><div class="grid max-h-64 gap-2 overflow-y-auto pr-1 sm:grid-cols-2"><label v-for="item in items" :key="item.id" class="flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm hover:bg-muted/40"><Checkbox :model-value="form.catalogoItemIds.includes(item.id)" @update:model-value="form.catalogoItemIds = toggle(form.catalogoItemIds, item.id, Boolean($event))" /><span class="truncate">{{ item.nome }}</span></label></div></div></CardContent></Card>
        <Card><CardHeader><CardTitle class="flex items-center gap-2 text-lg"><Sparkles class="h-5 w-5 text-primary" />Recompensa</CardTitle><CardDescription>O cliente recebe uma unidade com o desconto definido.</CardDescription></CardHeader><CardContent class="space-y-5"><div class="space-y-2"><Label>Produto premiado</Label><Select :model-value="form.premioCatalogoItemId ? String(form.premioCatalogoItemId) : ''" @update:model-value="form.premioCatalogoItemId = $event ? Number($event) : null"><SelectTrigger><SelectValue placeholder="Selecione no cardápio" /></SelectTrigger><SelectContent><SelectItem v-for="item in items" :key="item.id" :value="String(item.id)">{{ item.nome }}</SelectItem></SelectContent></Select></div><div class="space-y-2"><Label for="desconto">Desconto da recompensa (%)</Label><Input id="desconto" v-model.number="form.descontoPercentual" type="number" min="1" max="100" /></div><div class="rounded-2xl border border-dashed border-primary bg-primary/10 p-5 dark:bg-primary/20"><Pizza class="mb-3 h-6 w-6 text-foreground" /><p class="font-semibold text-foreground">Como aparece para o cliente</p><p v-if="selectedPrize" class="mt-2 text-sm leading-relaxed text-muted-foreground">Acumule {{ form.pedidosMeta }} itens com {{ ruleSummary(form) }} e ganhe <strong>{{ form.descontoPercentual }}% de desconto</strong> em <strong>{{ selectedPrize.nome }}</strong>.</p><p v-else class="mt-2 text-sm text-muted-foreground">Selecione o produto que será dado como prêmio.</p></div><div class="flex items-center justify-between rounded-xl border px-3 py-2"><Label for="fidelidade-ativa" class="cursor-pointer text-sm">Ativar ao salvar</Label><Switch id="fidelidade-ativa" v-model="form.ativo" /></div></CardContent></Card></div>
      <DialogFooter><Button variant="outline" :disabled="saving" @click="dialogOpen = false">Cancelar</Button><Button :disabled="saving" @click="save"><LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" /><Save v-else class="mr-2 h-4 w-4" />Salvar promoção</Button></DialogFooter>
    </DialogContent></Dialog>
  </div>
</template>
