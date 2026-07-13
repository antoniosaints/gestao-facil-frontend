<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Bot, Clock, LoaderCircle, Pencil, Plus, Smartphone, Trash2 } from 'lucide-vue-next'
import { WhatsAppRepository, type WhatsAppAgent, type WhatsAppInstance } from '@/repositories/whatsapp-repository'
import { useConfirm } from '@/composables/useConfirm'
import { useUiStore } from '@/stores/ui/uiStore'

const toast = useToast()
const storeUi = useUiStore()
const isAdmin = computed(() => Boolean(storeUi.permissoes?.admin))

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const agents = ref<WhatsAppAgent[]>([])
const instances = ref<WhatsAppInstance[]>([])
const models = ref<string[]>(['gemini-2.0-flash'])

const DIAS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

const dialog = reactive<{ open: boolean; editingId: number | null }>({ open: false, editingId: null })
const form = reactive<{
  nome: string
  prompt: string
  modelo: string
  ativo: boolean
  horaInicio: string
  horaFim: string
  dias: number[]
  instanciaIds: number[]
}>({ nome: '', prompt: '', modelo: 'gemini-2.0-flash', ativo: true, horaInicio: '', horaFim: '', dias: [0, 1, 2, 3, 4, 5, 6], instanciaIds: [] })

function instanceName(id: number) {
  return instances.value.find((i) => i.id === id)?.nome || `Instância ${id}`
}

function scheduleLabel(agent: WhatsAppAgent) {
  const dias = agent.diasSemana
    .split(',')
    .map((d) => DIAS.find((item) => item.value === Number(d))?.label)
    .filter(Boolean)
    .join(', ')
  const horario = agent.horaInicio && agent.horaFim ? `${agent.horaInicio}–${agent.horaFim}` : '24h'
  return `${dias || 'nenhum dia'} · ${horario}`
}

async function loadData() {
  try {
    loading.value = true
    const [agentsResp, instancesResp] = await Promise.all([
      WhatsAppRepository.listAgents(),
      WhatsAppRepository.listInstances(),
    ])
    agents.value = agentsResp.items
    models.value = agentsResp.models?.length ? agentsResp.models : models.value
    instances.value = instancesResp
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao carregar os agentes.')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  dialog.editingId = null
  Object.assign(form, {
    nome: '',
    prompt: '',
    modelo: models.value[0] || 'gemini-2.0-flash',
    ativo: true,
    horaInicio: '',
    horaFim: '',
    dias: [0, 1, 2, 3, 4, 5, 6],
    instanciaIds: [],
  })
  dialog.open = true
}

function openEdit(agent: WhatsAppAgent) {
  dialog.editingId = agent.id
  Object.assign(form, {
    nome: agent.nome,
    prompt: agent.prompt,
    modelo: agent.modelo,
    ativo: agent.ativo,
    horaInicio: agent.horaInicio || '',
    horaFim: agent.horaFim || '',
    dias: agent.diasSemana.split(',').map(Number).filter((n) => !Number.isNaN(n)),
    instanciaIds: [...agent.instanciaIds],
  })
  dialog.open = true
}

function toggleDia(value: number, checked: boolean | 'indeterminate') {
  const set = new Set(form.dias)
  checked === true ? set.add(value) : set.delete(value)
  form.dias = Array.from(set).sort((a, b) => a - b)
}

function toggleInstance(id: number, checked: boolean | 'indeterminate') {
  const set = new Set(form.instanciaIds)
  checked === true ? set.add(id) : set.delete(id)
  form.instanciaIds = Array.from(set)
}

async function save() {
  if (!form.nome.trim() || form.prompt.trim().length < 10) {
    toast.warning('Informe o nome e um prompt com pelo menos 10 caracteres.')
    return
  }
  if ((form.horaInicio && !form.horaFim) || (!form.horaInicio && form.horaFim)) {
    toast.warning('Preencha hora de início e fim, ou deixe ambos vazios para 24h.')
    return
  }
  const payload = {
    nome: form.nome.trim(),
    prompt: form.prompt.trim(),
    modelo: form.modelo,
    ativo: form.ativo,
    horaInicio: form.horaInicio || null,
    horaFim: form.horaFim || null,
    diasSemana: form.dias.join(','),
    instanciaIds: form.instanciaIds,
  }
  try {
    saving.value = true
    if (dialog.editingId) {
      await WhatsAppRepository.updateAgent(dialog.editingId, payload)
      toast.success('Agente atualizado.')
    } else {
      await WhatsAppRepository.createAgent(payload)
      toast.success('Agente criado.')
    }
    dialog.open = false
    await loadData()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível salvar o agente.')
  } finally {
    saving.value = false
  }
}

async function removeAgent(agent: WhatsAppAgent) {
  const confirmed = await useConfirm().confirm({
    title: 'Remover agente',
    message: `Remover o agente "${agent.nome}"? As instâncias dele deixarão de ter autoatendimento.`,
    confirmText: 'Sim, remover',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    deletingId.value = agent.id
    await WhatsAppRepository.deleteAgent(agent.id)
    agents.value = agents.value.filter((item) => item.id !== agent.id)
    toast.success('Agente removido.')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível remover o agente.')
  } finally {
    deletingId.value = null
  }
}

onMounted(loadData)
</script>

<template>
  <div class="container mx-auto flex flex-col gap-4 py-4">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Bot class="h-6 w-6" />
        </div>
        <div>
          <h1 class="text-xl font-semibold tracking-tight">Agentes de Atendimento</h1>
          <p class="text-sm text-muted-foreground">
            Agentes de IA que respondem automaticamente enquanto a conversa está em espera, para o cliente não aguardar.
          </p>
        </div>
      </div>
      <Button v-if="isAdmin" class="text-white" @click="openCreate">
        <Plus class="mr-1 h-4 w-4" /> Novo agente
      </Button>
    </header>

    <div v-if="!isAdmin" class="rounded-lg border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
      Apenas administradores podem gerenciar os agentes de atendimento.
    </div>

    <template v-else>
      <div v-if="loading && !agents.length" class="flex items-center justify-center p-10 text-sm text-muted-foreground">
        <LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Carregando agentes...
      </div>

      <div v-else-if="!agents.length" class="rounded-lg border border-dashed p-10 text-center">
        <Bot class="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Nenhum agente criado ainda. Crie um para iniciar o autoatendimento.</p>
      </div>

      <div v-else class="grid gap-3 md:grid-cols-2">
        <div v-for="agent in agents" :key="agent.id" class="flex flex-col gap-3 rounded-lg border p-4">
          <div class="flex items-start justify-between gap-2">
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <p class="truncate font-medium">{{ agent.nome }}</p>
                <Badge :class="agent.ativo ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'" class="h-5 px-2 text-[10px]">
                  {{ agent.ativo ? 'Ativo' : 'Inativo' }}
                </Badge>
              </div>
              <p class="mt-0.5 text-xs text-muted-foreground">{{ agent.modelo }}</p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <Button variant="ghost" size="icon" title="Editar" @click="openEdit(agent)"><Pencil class="h-4 w-4" /></Button>
              <Button
                variant="ghost"
                size="icon"
                class="text-destructive hover:text-destructive"
                title="Remover"
                :disabled="deletingId === agent.id"
                @click="removeAgent(agent)"
              >
                <LoaderCircle v-if="deletingId === agent.id" class="h-4 w-4 animate-spin" />
                <Trash2 v-else class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p class="line-clamp-2 text-xs text-muted-foreground">{{ agent.prompt }}</p>

          <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span class="flex items-center gap-1"><Clock class="h-3.5 w-3.5" /> {{ scheduleLabel(agent) }}</span>
          </div>

          <div class="flex flex-wrap gap-1">
            <template v-if="agent.instanciaIds.length">
              <Badge v-for="id in agent.instanciaIds" :key="id" variant="outline" class="gap-1 text-[10px]">
                <Smartphone class="h-3 w-3" /> {{ instanceName(id) }}
              </Badge>
            </template>
            <span v-else class="text-[11px] text-amber-600">Sem instâncias — não atende ninguém.</span>
          </div>
        </div>
      </div>
    </template>

    <!-- Modal criar/editar agente -->
    <Dialog v-model:open="dialog.open">
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{ dialog.editingId ? 'Editar agente' : 'Novo agente' }}</DialogTitle>
          <DialogDescription>Configure o comportamento, os horários e as instâncias que o agente vai atender.</DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1">
              <Label>Nome</Label>
              <Input v-model="form.nome" placeholder="Ex.: Atendente Virtual" />
            </div>
            <div class="space-y-1">
              <Label>Modelo de IA</Label>
              <select v-model="form.modelo" class="h-9 w-full rounded-md border bg-background px-3 text-sm">
                <option v-for="m in models" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
          </div>

          <div class="space-y-1">
            <Label>Prompt / comportamento</Label>
            <Textarea
              v-model="form.prompt"
              :rows="5"
              placeholder="Descreva como o agente deve se comportar, o que oferecer, tom de voz, informações da empresa, etc."
            />
            <p class="text-[11px] text-muted-foreground">O agente entende imagens, PDFs e áudios enviados pelo cliente.</p>
          </div>

          <div class="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Ativo</Label>
              <p class="text-[11px] text-muted-foreground">Se inativo, o agente não atende.</p>
            </div>
            <Switch v-model="form.ativo" />
          </div>

          <div class="space-y-2">
            <Label>Dias de atendimento</Label>
            <div class="flex flex-wrap gap-3">
              <label v-for="dia in DIAS" :key="dia.value" class="flex items-center gap-1.5 text-sm">
                <Checkbox :model-value="form.dias.includes(dia.value)" @update:model-value="(v) => toggleDia(dia.value, v)" />
                {{ dia.label }}
              </label>
            </div>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div class="space-y-1">
              <Label>Hora início</Label>
              <Input v-model="form.horaInicio" type="time" />
            </div>
            <div class="space-y-1">
              <Label>Hora fim</Label>
              <Input v-model="form.horaFim" type="time" />
            </div>
          </div>
          <p class="-mt-2 text-[11px] text-muted-foreground">Deixe os horários vazios para atender 24h nos dias marcados (fuso de Brasília).</p>

          <div class="space-y-2">
            <Label>Instâncias que este agente atende</Label>
            <p class="text-[11px] text-muted-foreground">
              Cada instância só pode ser atendida por um agente; ao marcar aqui, ela é movida para este agente.
            </p>
            <div v-if="!instances.length" class="text-xs text-muted-foreground">Nenhuma instância cadastrada.</div>
            <div v-else class="grid max-h-40 gap-2 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
              <label v-for="instance in instances" :key="instance.id" class="flex items-center gap-2 text-sm">
                <Checkbox
                  :model-value="form.instanciaIds.includes(instance.id)"
                  @update:model-value="(v) => toggleInstance(instance.id, v)"
                />
                <span class="truncate">{{ instance.nome }}</span>
              </label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="dialog.open = false">Cancelar</Button>
          <Button class="text-white" :disabled="saving" @click="save">
            <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
