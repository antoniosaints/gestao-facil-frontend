<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import VarianteImagemField from '@/pages/produtos/formulario/VarianteImagemField.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { useConfirm } from '@/composables/useConfirm'
import { moneyMaskOptions } from '@/lib/imaska'
import { ComboRepository, type Combo, type ComboComponentType, type ComboPayload } from '@/repositories/combo-repository'
import { resolveFileUrl } from '@/utils/fileUrl'
import { formatToNumberValue } from '@/utils/formatters'
import { Boxes, Layers3, PackagePlus, Pencil, Plus, RefreshCw, Search, Trash2, Wrench, X } from 'lucide-vue-next'
import { vMaska } from 'maska/vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'

type FormComponent = {
  tipo: ComboComponentType
  id: number | null
  label: string
  quantidade: number
}

const toast = useToast()
const confirm = useConfirm()
const items = ref<Combo[]>([])
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const page = ref(1)
const totalPages = ref(1)
const modalOpen = ref(false)
const editingId = ref<number | null>(null)
const imagemChange = ref<{ file: File | null; remove: boolean }>({ file: null, remove: false })
const imageFieldKey = ref(0)

const form = reactive<ComboPayload>({
  nome: '',
  descricao: '',
  imagem: '',
  preco: '',
  ativo: true,
  mostrarNoPdv: true,
  mostrarOnline: true,
  componentes: [],
})
const components = ref<FormComponent[]>([])

const modalTitle = computed(() => editingId.value ? 'Editar combo' : 'Novo combo')

function resetForm() {
  editingId.value = null
  Object.assign(form, {
    nome: '',
    descricao: '',
    imagem: '',
    preco: '',
    ativo: true,
    mostrarNoPdv: true,
    mostrarOnline: true,
    componentes: [],
  })
  components.value = [{ tipo: 'PRODUTO', id: null, label: '', quantidade: 1 }]
  imagemChange.value = { file: null, remove: false }
  imageFieldKey.value += 1
}

function openCreate() {
  resetForm()
  modalOpen.value = true
}

function openEdit(combo: Combo) {
  imageFieldKey.value += 1
  imagemChange.value = { file: null, remove: false }
  editingId.value = combo.id
  Object.assign(form, {
    nome: combo.nome,
    descricao: combo.descricao || '',
    imagem: combo.imagem || '',
    preco: String(combo.preco).replace('.', ','),
    ativo: combo.ativo,
    mostrarNoPdv: combo.mostrarNoPdv,
    mostrarOnline: combo.mostrarOnline,
  })
  components.value = combo.componentes.map((item) => ({
    tipo: item.tipo,
    id: item.produtoId ?? item.servicoId ?? null,
    label: item.Produto
      ? `${item.Produto.nome}${item.Produto.nomeVariante ? ` / ${item.Produto.nomeVariante}` : ''}`
      : item.Servico?.nome || '',
    quantidade: item.quantidade,
  }))
  modalOpen.value = true
}

function addComponent() {
  components.value.push({ tipo: 'PRODUTO', id: null, label: '', quantidade: 1 })
}

function changeType(item: FormComponent, tipo: ComboComponentType) {
  item.tipo = tipo
  item.id = null
  item.label = ''
}

async function load() {
  loading.value = true
  try {
    const response = await ComboRepository.list({ search: search.value || undefined, page: page.value, limit: 20 })
    items.value = response.items
    totalPages.value = Math.max(1, response.totalPages)
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível carregar os combos.')
  } finally {
    loading.value = false
  }
}

async function submit() {
  const valid = components.value.filter((item) => item.id && item.quantidade > 0)
  const preco = formatToNumberValue(form.preco)
  if (!form.nome.trim() || preco <= 0 || valid.length !== components.value.length) {
    toast.error('Informe nome, preço e todos os componentes do combo.')
    return
  }
  saving.value = true
  try {
    const combo = await ComboRepository.save({
      ...form,
      nome: form.nome.trim(),
      descricao: form.descricao?.trim() || null,
      imagem: form.imagem?.trim() || null,
      preco,
      componentes: valid.map((item) => ({
        tipo: item.tipo,
        id: Number(item.id),
        quantidade: Number(item.quantidade),
      })),
    }, editingId.value || undefined)
    try {
      await ComboRepository.persistImagem(combo.id, imagemChange.value)
    } catch (error: any) {
      toast.warning(error?.response?.data?.message || 'O combo foi salvo, mas não foi possível atualizar a imagem.')
    }
    toast.success(editingId.value ? 'Combo atualizado.' : 'Combo criado.')
    modalOpen.value = false
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível salvar o combo.')
  } finally {
    saving.value = false
  }
}

async function remove(combo: Combo) {
  const accepted = await confirm.confirm({
    title: 'Excluir combo',
    message: `Deseja excluir “${combo.nome}”? Combos com histórico não podem ser apagados.`,
    confirmText: 'Excluir',
    colorButton: 'danger',
  })
  if (!accepted) return
  try {
    await ComboRepository.remove(combo.id)
    toast.success('Combo excluído.')
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível excluir o combo.')
  }
}

async function changePage(value: number) {
  page.value = Math.min(totalPages.value, Math.max(1, value))
  await load()
}

onMounted(load)
</script>

<template>
  <section class="space-y-5">
    <header class="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div class="flex items-start gap-3">
        <div class="grid h-11 w-11 place-items-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
          <Layers3 class="h-6 w-6" />
        </div>
        <div>
          <h1 class="text-2xl font-bold text-foreground">Combos</h1>
          <p class="text-sm text-muted-foreground">Agrupe produtos e serviços com preço próprio e baixa automática.</p>
        </div>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" size="icon" title="Atualizar" @click="load"><RefreshCw class="h-4 w-4" /></Button>
        <Button class="gap-2 text-white" @click="openCreate"><Plus class="h-4 w-4" /> Novo combo</Button>
      </div>
    </header>

    <div class="relative max-w-md">
      <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input v-model="search" class="pl-9" placeholder="Buscar por nome ou código" @keyup.enter="page = 1; load()" />
    </div>

    <div v-if="loading" class="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground">Carregando combos…</div>
    <div v-else-if="!items.length" class="rounded-xl border border-dashed border-border bg-card p-12 text-center">
      <Layers3 class="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
      <h2 class="font-semibold">Nenhum combo cadastrado</h2>
      <p class="mb-4 text-sm text-muted-foreground">Crie uma oferta combinando produtos e serviços já existentes.</p>
      <Button class="text-white" @click="openCreate">Criar primeiro combo</Button>
    </div>
    <div v-else class="grid gap-3">
      <article v-for="combo in items" :key="combo.id" class="group rounded-xl border border-border bg-card p-4 transition hover:border-blue-500/40 hover:shadow-sm">
        <div class="flex flex-col gap-4 md:flex-row md:items-center">
          <div class="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
            <img v-if="combo.imagem" :src="resolveFileUrl(combo.imagem)" :alt="combo.nome" class="h-full w-full object-cover" />
            <PackagePlus v-else class="h-6 w-6 text-muted-foreground" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h2 class="truncate font-semibold text-foreground">{{ combo.nome }}</h2>
              <span class="rounded-full px-2 py-0.5 text-xs" :class="combo.ativo ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'">
                {{ combo.ativo ? 'Ativo' : 'Inativo' }}
              </span>
              <span v-if="combo.mostrarNoPdv" class="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs text-blue-600">PDV</span>
              <span v-if="combo.mostrarOnline" class="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-700">Online</span>
            </div>
            <p class="mt-1 truncate text-sm text-muted-foreground">
              {{ combo.componentes.map((item) => `${item.quantidade}× ${item.Produto?.nome || item.Servico?.nome}`).join(' • ') }}
            </p>
          </div>
          <div class="flex items-center justify-between gap-4 md:justify-end">
            <strong class="text-lg text-foreground">{{ Number(combo.preco).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</strong>
            <Button variant="outline" size="icon" title="Editar" @click="openEdit(combo)"><Pencil class="h-4 w-4" /></Button>
            <Button variant="outline" size="icon" title="Excluir" class="text-destructive" @click="remove(combo)"><Trash2 class="h-4 w-4" /></Button>
          </div>
        </div>
      </article>
    </div>

    <div v-if="totalPages > 1" class="flex items-center justify-center gap-3">
      <Button variant="outline" :disabled="page <= 1" @click="changePage(page - 1)">Anterior</Button>
      <span class="text-sm text-muted-foreground">Página {{ page }} de {{ totalPages }}</span>
      <Button variant="outline" :disabled="page >= totalPages" @click="changePage(page + 1)">Próxima</Button>
    </div>

    <ModalView v-model:open="modalOpen" :title="modalTitle" description="Defina o preço e os itens entregues pelo combo." size="3xl">
      <form class="space-y-5 px-4 pb-5" @submit.prevent="submit">
        <div class="grid gap-4 md:grid-cols-2">
          <label class="grid gap-1.5 text-sm">Nome
            <Input v-model="form.nome" maxlength="120" placeholder="Ex.: Presente especial" required />
          </label>
          <label class="grid gap-1.5 text-sm">Preço do combo
            <Input v-model="form.preco" v-maska="moneyMaskOptions" type="text" inputmode="decimal" placeholder="0,00" required />
          </label>
          <label class="grid gap-1.5 text-sm md:col-span-2">Descrição
            <textarea
              v-model="form.descricao"
              rows="3"
              placeholder="Ex.: Embalagem para presente com produto e serviço inclusos"
              class="rounded-md border border-input bg-background px-3 py-2"
            />
          </label>
          <div class="grid gap-1.5 text-sm md:col-span-2">
            <span>Imagem do combo</span>
            <VarianteImagemField
              :key="imageFieldKey"
              :existing="form.imagem"
              :disabled="saving"
              entity-label="combo"
              @change="imagemChange = $event"
            />
          </div>
        </div>

        <div class="rounded-xl border border-border">
          <div class="flex items-center justify-between border-b border-border px-4 py-3">
            <div><h3 class="font-semibold">Composição</h3><p class="text-xs text-muted-foreground">Produtos baixam estoque; serviços ficam registrados no histórico.</p></div>
            <Button type="button" variant="outline" size="sm" class="gap-1" @click="addComponent"><Plus class="h-4 w-4" /> Item</Button>
          </div>
          <div class="grid gap-3 p-4">
            <div v-for="(item, index) in components" :key="index" class="grid items-end gap-2 rounded-lg bg-muted/40 p-3 md:grid-cols-[140px_1fr_110px_40px]">
              <label class="grid gap-1 text-xs">Tipo
                <select :value="item.tipo" class="h-10 rounded-md border border-input bg-background px-3 text-sm" @change="changeType(item, ($event.target as HTMLSelectElement).value as ComboComponentType)">
                  <option value="PRODUTO">Produto</option><option value="SERVICO">Serviço</option>
                </select>
              </label>
              <label class="grid gap-1 text-xs">{{ item.tipo === 'PRODUTO' ? 'Variante' : 'Serviço' }}
                <Select2Ajax v-model="item.id" v-model:label="item.label" :url="item.tipo === 'PRODUTO' ? '/produtos/select2' : '/servicos/select2'" :allow-clear="true" />
              </label>
              <label class="grid gap-1 text-xs">Quantidade <Input v-model.number="item.quantidade" type="number" min="1" step="1" /></label>
              <Button type="button" variant="ghost" size="icon" title="Remover" :disabled="components.length === 1" @click="components.splice(index, 1)"><X class="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        <div class="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-3">
          <label class="flex items-center justify-between gap-2 text-sm"><span>Combo ativo</span><Switch v-model="form.ativo" /></label>
          <label class="flex items-center justify-between gap-2 text-sm"><span>Mostrar no PDV</span><Switch v-model="form.mostrarNoPdv" /></label>
          <label class="flex items-center justify-between gap-2 text-sm"><span>Mostrar online</span><Switch v-model="form.mostrarOnline" /></label>
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="outline" @click="modalOpen = false">Cancelar</Button>
          <Button type="submit" class="text-white" :disabled="saving">{{ saving ? 'Salvando…' : 'Salvar combo' }}</Button>
        </div>
      </form>
    </ModalView>
  </section>
</template>
