<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Cpu, LoaderCircle, Pencil, Plus, Trash2 } from 'lucide-vue-next'
import { IaAdminRepository, type IaModelo, type IaModeloPayload } from '@/repositories/ia-admin-repository'
import { useConfirm } from '@/composables/useConfirm'

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const busyId = ref<number | null>(null)
const modelos = ref<IaModelo[]>([])

const dialog = reactive<{ open: boolean; editingId: number | null }>({ open: false, editingId: null })
const form = reactive<{
  modelId: string
  nome: string
  provider: string
  ativo: boolean
  custoInputMilhao: number | undefined
  custoOutputMilhao: number | undefined
}>({
  modelId: '',
  nome: '',
  provider: 'gemini',
  ativo: true,
  custoInputMilhao: undefined,
  custoOutputMilhao: undefined,
})

async function load() {
  try {
    loading.value = true
    modelos.value = await IaAdminRepository.listModelos()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao carregar os modelos.')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialog.editingId = null
  Object.assign(form, {
    modelId: '', nome: '', provider: 'gemini', ativo: true,
    custoInputMilhao: undefined, custoOutputMilhao: undefined,
  })
  dialog.open = true
}

function openEdit(modelo: IaModelo) {
  dialog.editingId = modelo.id
  Object.assign(form, {
    modelId: modelo.modelId, nome: modelo.nome, provider: modelo.provider, ativo: modelo.ativo,
    custoInputMilhao: modelo.custoInputMilhao != null ? Number(modelo.custoInputMilhao) : undefined,
    custoOutputMilhao: modelo.custoOutputMilhao != null ? Number(modelo.custoOutputMilhao) : undefined,
  })
  dialog.open = true
}

async function save() {
  if (form.modelId.trim().length < 2 || form.nome.trim().length < 2) {
    return toast.warning('Informe o identificador e o nome do modelo.')
  }
  const payload: IaModeloPayload = {
    modelId: form.modelId.trim(),
    nome: form.nome.trim(),
    provider: form.provider.trim() || 'gemini',
    ativo: form.ativo,
    custoInputMilhao:
      form.custoInputMilhao != null && Number(form.custoInputMilhao) >= 0 ? Number(form.custoInputMilhao) : null,
    custoOutputMilhao:
      form.custoOutputMilhao != null && Number(form.custoOutputMilhao) >= 0 ? Number(form.custoOutputMilhao) : null,
  }
  try {
    saving.value = true
    if (dialog.editingId) await IaAdminRepository.updateModelo(dialog.editingId, payload)
    else await IaAdminRepository.createModelo(payload)
    dialog.open = false
    toast.success('Modelo salvo.')
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível salvar o modelo.')
  } finally {
    saving.value = false
  }
}

async function toggleAtivo(modelo: IaModelo, ativo: boolean) {
  try {
    busyId.value = modelo.id
    await IaAdminRepository.updateModelo(modelo.id, { ativo })
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao atualizar o modelo.')
    await load()
  } finally {
    busyId.value = null
  }
}

async function remove(modelo: IaModelo) {
  const confirmed = await useConfirm().confirm({
    title: 'Remover modelo',
    message: `Remover o modelo "${modelo.nome}" (${modelo.modelId})?`,
    confirmText: 'Sim, remover',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    busyId.value = modelo.id
    await IaAdminRepository.deleteModelo(modelo.id)
    modelos.value = modelos.value.filter((item) => item.id !== modelo.id)
    toast.success('Modelo removido.')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível remover o modelo.')
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
          <Cpu class="h-6 w-6" />
        </div>
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Modelos de IA</h1>
          <p class="text-sm text-muted-foreground">
            Modelos disponíveis para os agentes. Apenas os modelos <strong>ativos</strong> aparecem para os assinantes.
          </p>
        </div>
      </div>
      <Button class="text-white" @click="openCreate"><Plus class="mr-1 h-4 w-4" /> Novo modelo</Button>
    </header>

    <div v-if="loading && !modelos.length" class="flex items-center justify-center p-10 text-sm text-muted-foreground">
      <LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Carregando...
    </div>
    <div v-else-if="!modelos.length" class="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
      Nenhum modelo cadastrado. Enquanto isso, os agentes usam a lista padrão do sistema.
    </div>

    <div v-else class="overflow-hidden rounded-lg border">
      <div v-for="modelo in modelos" :key="modelo.id" class="flex items-center gap-3 border-b px-4 py-3 bg-background dark:bg-card last:border-b-0">
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2">
            <p class="truncate text-sm font-medium">{{ modelo.nome }}</p>
            <Badge :class="modelo.ativo ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'" class="h-5 px-2 text-[10px]">
              {{ modelo.ativo ? 'Ativo' : 'Inativo' }}
            </Badge>
          </div>
          <p class="truncate font-mono text-xs text-muted-foreground">{{ modelo.provider }} · {{ modelo.modelId }}</p>
          <p v-if="modelo.custoInputMilhao != null || modelo.custoOutputMilhao != null"
            class="truncate text-[11px] text-muted-foreground">
            Custo/1M: entrada {{ Number(modelo.custoInputMilhao ?? 0) }} · saída {{ Number(modelo.custoOutputMilhao ?? 0) }}
          </p>
        </div>
        <Switch :model-value="modelo.ativo" :disabled="busyId === modelo.id" @update:model-value="(v) => toggleAtivo(modelo, Boolean(v))" />
        <Button variant="ghost" size="icon" title="Editar" @click="openEdit(modelo)"><Pencil class="h-4 w-4" /></Button>
        <Button
          variant="ghost"
          size="icon"
          class="text-destructive hover:text-destructive"
          title="Remover"
          :disabled="busyId === modelo.id"
          @click="remove(modelo)"
        >
          <Trash2 class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <Dialog v-model:open="dialog.open">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ dialog.editingId ? 'Editar modelo' : 'Novo modelo' }}</DialogTitle>
          <DialogDescription>Cadastre os modelos que os assinantes poderão escolher nos agentes.</DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-1">
            <Label>Identificador do modelo</Label>
            <Input v-model="form.modelId" placeholder="Ex.: gemini-2.0-flash" />
            <p class="text-[11px] text-muted-foreground">Exatamente como a API do provedor espera.</p>
          </div>
          <div class="space-y-1">
            <Label>Nome amigável</Label>
            <Input v-model="form.nome" placeholder="Ex.: Gemini 2.0 Flash" />
          </div>
          <div class="space-y-1">
            <Label>Provedor</Label>
            <Input v-model="form.provider" placeholder="gemini" />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1">
              <Label>Custo entrada / 1M tokens</Label>
              <Input v-model.number="form.custoInputMilhao" type="number" min="0" step="0.000001" placeholder="Ex.: 0.075" />
            </div>
            <div class="space-y-1">
              <Label>Custo saída / 1M tokens</Label>
              <Input v-model.number="form.custoOutputMilhao" type="number" min="0" step="0.000001" placeholder="Ex.: 0.30" />
            </div>
            <p class="col-span-2 text-[11px] text-muted-foreground">
              Custo por 1 milhão de tokens (na sua moeda). Usado para estimar o gasto de IA. Deixe vazio se não quiser rastrear.
            </p>
          </div>
          <div class="flex items-center justify-between rounded-md border p-3">
            <Label>Ativo</Label>
            <Switch v-model="form.ativo" />
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
