<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { KeyRound, LoaderCircle, Pencil, Plus, Star, Trash2 } from 'lucide-vue-next'
import { IaAdminRepository, type IaChaveApi, type IaChavePayload } from '@/repositories/ia-admin-repository'
import { useConfirm } from '@/composables/useConfirm'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const busyId = ref<number | null>(null)
const chaves = ref<IaChaveApi[]>([])

const dialog = reactive<{ open: boolean; editingId: number | null }>({ open: false, editingId: null })
const form = reactive<{ nome: string; apiKey: string; provider: string; ativo: boolean; isPadrao: boolean }>({
  nome: '',
  apiKey: '',
  provider: 'gemini',
  ativo: true,
  isPadrao: false,
})

async function load() {
  try {
    loading.value = true
    chaves.value = await IaAdminRepository.listChaves()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao carregar as chaves.')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialog.editingId = null
  Object.assign(form, { nome: '', apiKey: '', provider: 'gemini', ativo: true, isPadrao: false })
  dialog.open = true
}

function openEdit(chave: IaChaveApi) {
  dialog.editingId = chave.id
  Object.assign(form, { nome: chave.nome, apiKey: '', provider: chave.provider, ativo: chave.ativo, isPadrao: chave.isPadrao })
  dialog.open = true
}

async function save() {
  if (!form.nome.trim()) return toast.warning('Informe o nome da chave.')
  if (!dialog.editingId && form.apiKey.trim().length < 10) return toast.warning('Informe a chave de API.')
  const payload: IaChavePayload = {
    nome: form.nome.trim(),
    provider: form.provider.trim() || 'gemini',
    ativo: form.ativo,
    isPadrao: form.isPadrao,
  }
  if (form.apiKey.trim()) payload.apiKey = form.apiKey.trim()
  try {
    saving.value = true
    if (dialog.editingId) await IaAdminRepository.updateChave(dialog.editingId, payload)
    else await IaAdminRepository.createChave(payload)
    dialog.open = false
    toast.success('Chave salva.')
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível salvar a chave.')
  } finally {
    saving.value = false
  }
}

async function setPadrao(chave: IaChaveApi) {
  try {
    busyId.value = chave.id
    await IaAdminRepository.updateChave(chave.id, { isPadrao: true })
    toast.success(`"${chave.nome}" agora é a chave usada pelos assinantes.`)
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao definir a chave padrão.')
  } finally {
    busyId.value = null
  }
}

async function toggleAtivo(chave: IaChaveApi, ativo: boolean) {
  try {
    busyId.value = chave.id
    await IaAdminRepository.updateChave(chave.id, { ativo })
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao atualizar a chave.')
    await load()
  } finally {
    busyId.value = null
  }
}

async function remove(chave: IaChaveApi) {
  const confirmed = await useConfirm().confirm({
    title: 'Remover chave',
    message: `Remover a chave "${chave.nome}"? Agentes que a usam ficarão sem IA até você definir outra padrão.`,
    confirmText: 'Sim, remover',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    busyId.value = chave.id
    await IaAdminRepository.deleteChave(chave.id)
    chaves.value = chaves.value.filter((item) => item.id !== chave.id)
    toast.success('Chave removida.')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível remover a chave.')
  } finally {
    busyId.value = null
  }
}

onMounted(load)
</script>

<template>
  <div class="container mx-auto flex flex-col gap-4 py-4">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <KeyRound class="h-6 w-6" />
        </div>
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Chaves de API (IA)</h1>
          <p class="text-sm text-muted-foreground">
            Chaves que os assinantes usam nos agentes. Marque uma como padrão — é ela que será usada por todos.
          </p>
        </div>
      </div>
      <Button class="text-white" @click="openCreate"><Plus class="mr-1 h-4 w-4" /> Nova chave</Button>
    </header>

    <div v-if="loading && !chaves.length" class="flex items-center justify-center p-10 text-sm text-muted-foreground">
      <LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Carregando...
    </div>
    <div v-else-if="!chaves.length" class="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
      Nenhuma chave cadastrada.
    </div>

    <div v-else class="grid gap-3 md:grid-cols-2">
      <div v-for="chave in chaves" :key="chave.id" class="flex flex-col gap-3 rounded-lg border p-4">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="truncate font-medium">{{ chave.nome }}</p>
              <Badge v-if="chave.isPadrao" class="h-5 gap-1 bg-amber-500 px-2 text-[10px] text-white">
                <Star class="h-3 w-3" /> Padrão
              </Badge>
              <Badge :class="chave.ativo ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'" class="h-5 px-2 text-[10px]">
                {{ chave.ativo ? 'Ativa' : 'Inativa' }}
              </Badge>
            </div>
            <p class="mt-0.5 font-mono text-xs text-muted-foreground">{{ chave.provider }} · {{ chave.apiKeyMasked }}</p>
          </div>
          <div class="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" title="Editar" @click="openEdit(chave)"><Pencil class="h-4 w-4" /></Button>
            <Button
              variant="ghost"
              size="icon"
              class="text-destructive hover:text-destructive"
              title="Remover"
              :disabled="busyId === chave.id"
              @click="remove(chave)"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div class="flex items-center justify-between gap-2">
          <label class="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch :model-value="chave.ativo" :disabled="busyId === chave.id" @update:model-value="(v) => toggleAtivo(chave, Boolean(v))" />
            Ativa
          </label>
          <Button v-if="!chave.isPadrao" variant="outline" size="sm" :disabled="busyId === chave.id" @click="setPadrao(chave)">
            <Star class="mr-1 h-3.5 w-3.5" /> Usar como padrão
          </Button>
        </div>
      </div>
    </div>

    <Dialog v-model:open="dialog.open">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ dialog.editingId ? 'Editar chave' : 'Nova chave' }}</DialogTitle>
          <DialogDescription>A chave é armazenada com segurança e nunca é exibida por completo.</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-1">
            <Label>Nome</Label>
            <Input v-model="form.nome" placeholder="Ex.: Gemini - Produção" />
          </div>
          <div class="space-y-1">
            <Label>Provedor</Label>
            <Input v-model="form.provider" placeholder="gemini" />
          </div>
          <div class="space-y-1">
            <Label>Chave de API</Label>
            <Input v-model="form.apiKey" type="password" :placeholder="dialog.editingId ? 'Deixe em branco para manter a atual' : 'Cole a chave de API'" />
          </div>
          <div class="flex items-center justify-between rounded-md border p-3">
            <Label>Ativa</Label>
            <Switch v-model="form.ativo" />
          </div>
          <div class="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Usar como padrão</Label>
              <p class="text-[11px] text-muted-foreground">Chave usada por todos os assinantes.</p>
            </div>
            <Switch v-model="form.isPadrao" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="dialog.open = false">Cancelar</Button>
          <Button class="text-white" :disabled="saving" @click="save">
            <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" /> Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
