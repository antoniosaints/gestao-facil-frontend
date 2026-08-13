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
import { Bot, Clock, FlaskConical, LoaderCircle, Pencil, Plus, Send, Smartphone, Timer, Trash2 } from 'lucide-vue-next'
import { WhatsAppRepository, type WhatsAppAgent, type WhatsAppAgentTestMessage, type WhatsAppInstance } from '@/repositories/whatsapp-repository'
import { useConfirm } from '@/composables/useConfirm'
import { useUiStore } from '@/stores/ui/uiStore'

type AgentTestBubble = WhatsAppAgentTestMessage & { kind?: 'handoff' }

const toast = useToast()
const storeUi = useUiStore()
const isAdmin = computed(() => Boolean(storeUi.permissoes?.admin))

const loading = ref(false)
const saving = ref(false)
const deletingId = ref<number | null>(null)
const agents = ref<WhatsAppAgent[]>([])
const instances = ref<WhatsAppInstance[]>([])
const models = ref<string[]>(['gemini-2.0-flash'])
const testing = ref(false)
const testDialog = reactive<{ open: boolean; agent: WhatsAppAgent | null }>({ open: false, agent: null })
const testActiveAgent = ref<{ id: number; nome: string } | null>(null)
const testText = ref('')
const testMessages = ref<AgentTestBubble[]>([])
const testRestaurantToolsEnabled = ref(false)

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
  delaySegundos: number
  horaInicio: string
  horaFim: string
  dias: number[]
  instanciaIds: number[]
}>({ nome: '', prompt: '', modelo: 'gemini-2.0-flash', ativo: true, delaySegundos: 0, horaInicio: '', horaFim: '', dias: [0, 1, 2, 3, 4, 5, 6], instanciaIds: [] })

const transferTrigger = computed(() => /(?:^|\s)\/transferir(?:\s+[^\n]*)?$/i.exec(form.prompt))
const transferTargets = computed(() => {
  const query = transferTrigger.value?.[0].replace(/^\s*\/transferir\s*/i, '').trim().toLocaleLowerCase('pt-BR') || ''
  return agents.value.filter((agent) => agent.ativo && agent.id !== dialog.editingId && (!query || agent.nome.toLocaleLowerCase('pt-BR').includes(query)))
})

function insertTransfer(agent: WhatsAppAgent) {
  const match = transferTrigger.value
  const command = `/transferir ${agent.id}`
  form.prompt = match && typeof match.index === 'number'
    ? `${form.prompt.slice(0, match.index)}${match[0].startsWith(' ') ? ' ' : ''}${command}`
    : `${form.prompt.trimEnd()}${form.prompt.trim() ? '\n' : ''}${command}`
}

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
    delaySegundos: 0,
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
    delaySegundos: agent.delaySegundos || 0,
    horaInicio: agent.horaInicio || '',
    horaFim: agent.horaFim || '',
    dias: agent.diasSemana.split(',').map(Number).filter((n) => !Number.isNaN(n)),
    instanciaIds: [...agent.instanciaIds],
  })
  dialog.open = true
}

function openTest(agent: WhatsAppAgent) {
  testDialog.agent = agent
  testActiveAgent.value = { id: agent.id, nome: agent.nome }
  testDialog.open = true
  testText.value = ''
  testMessages.value = []
  testRestaurantToolsEnabled.value = false
}

async function sendTest() {
  if (!testActiveAgent.value || !testText.value.trim() || testing.value) return
  const text = testText.value.trim()
  const history = testMessages.value
    .filter((item) => item.kind !== 'handoff')
    .map(({ role, text: itemText }) => ({ role, text: itemText }))
  testMessages.value.push({ role: 'user', text })
  testText.value = ''
  try {
    testing.value = true
    const result = await WhatsAppRepository.testAgent(testActiveAgent.value.id, { mensagem: text, historico: history })
    if (result.transferredTo) {
      testMessages.value.push({
        role: 'model',
        kind: 'handoff',
        text: `Triagem transferiu o contexto para ${result.transferredTo.nome}.`,
      })
    }
    testActiveAgent.value = result.agent
    testMessages.value.push({ role: 'model', text: result.text })
    testRestaurantToolsEnabled.value = result.restaurantToolsEnabled
  } catch (error: any) {
    testMessages.value.push({ role: 'model', text: error?.response?.data?.message || 'Não foi possível executar o teste.' })
  } finally {
    testing.value = false
  }
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
  if (!Number.isInteger(Number(form.delaySegundos)) || Number(form.delaySegundos) < 0 || Number(form.delaySegundos) > 120) {
    toast.warning('Informe um atraso inteiro entre 0 e 120 segundos.')
    return
  }
  const payload = {
    nome: form.nome.trim(),
    prompt: form.prompt.trim(),
    modelo: form.modelo,
    ativo: form.ativo,
    delaySegundos: Number(form.delaySegundos) || 0,
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

      <div v-else-if="!agents.length" class="rounded-lg border bg-background dark:bg-card border-dashed p-10 text-center">
        <Bot class="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
        <p class="text-sm text-muted-foreground">Nenhum agente criado ainda. Crie um para iniciar o autoatendimento.</p>
      </div>

      <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div v-for="agent in agents" :key="agent.id" class="flex flex-col gap-3 rounded-lg border bg-background dark:bg-card p-4">
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
              <Button variant="ghost" size="icon" v-tooltip="'Testar agente'" @click="openTest(agent)"><FlaskConical class="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" v-tooltip="'Editar'" @click="openEdit(agent)"><Pencil class="h-4 w-4" /></Button>
              <Button
                variant="ghost"
                size="icon"
                class="text-destructive hover:text-destructive"
                v-tooltip="'Remover'"
                :disabled="deletingId === agent.id"
                @click="removeAgent(agent)"
              >
                <LoaderCircle v-if="deletingId === agent.id" class="h-4 w-4 animate-spin" />
                <Trash2 v-else class="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p class="line-clamp-2 text-xs text-muted-foreground">{{ agent.prompt }}</p>
          <p class="text-[11px] text-muted-foreground">Pode transferir silenciosamente para outro agente ativo usando <code>/transferir</code>.</p>

          <div class="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span class="flex items-center gap-1"><Clock class="h-3.5 w-3.5" /> {{ scheduleLabel(agent) }}</span>
            <span class="flex items-center gap-1"><Timer class="h-3.5 w-3.5" /> {{ agent.delaySegundos || 0 }}s antes de responder</span>
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
      <DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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

          <div class="space-y-2">
            <div class="flex items-center justify-between gap-3">
              <Label>Prompt / comportamento</Label>
              <span class="text-[11px] text-muted-foreground">Digite <code class="rounded bg-muted px-1 py-0.5">/transferir</code> para escolher um especialista</span>
            </div>
            <Textarea
              v-model="form.prompt"
              :rows="5"
              placeholder="Descreva como o agente deve se comportar, o que oferecer, tom de voz, informações da empresa, etc."
            />
            <p class="text-[11px] text-muted-foreground">O agente entende imagens, PDFs e áudios enviados pelo cliente.</p>

            <div v-if="transferTrigger" class="overflow-hidden rounded-xl border border-primary/25 bg-primary/[0.035] shadow-sm">
              <div class="flex items-center gap-2 border-b border-primary/15 px-3 py-2 text-xs">
                <div class="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-primary"><Bot class="h-3.5 w-3.5" /></div>
                <div class="min-w-0">
                  <p class="font-medium text-foreground">Transferir para um agente</p>
                  <p class="text-muted-foreground">O cliente não vê essa instrução; o contexto da conversa é preservado.</p>
                </div>
              </div>
              <div v-if="transferTargets.length" class="grid gap-1 p-1.5 sm:grid-cols-2">
                <button v-for="agent in transferTargets" :key="agent.id" type="button" class="group flex items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-background" @click="insertTransfer(agent)">
                  <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"><Bot class="h-3.5 w-3.5" /></span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-xs font-medium">{{ agent.nome }}</span>
                    <span class="block truncate text-[10px] text-muted-foreground">{{ agent.modelo }}</span>
                  </span>
                  <span class="text-[10px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">Selecionar</span>
                </button>
              </div>
              <p v-else class="px-3 py-3 text-xs text-muted-foreground">Nenhum outro agente ativo encontrado. Crie ou ative outro agente para liberar a transferência.</p>
            </div>

            <div v-else-if="agents.filter((agent) => agent.ativo && agent.id !== dialog.editingId).length" class="flex flex-wrap items-center gap-1.5 rounded-lg border border-dashed px-2.5 py-2 text-[11px] text-muted-foreground">
              <span class="mr-1 font-medium text-foreground">Especialistas disponíveis:</span>
              <button v-for="agent in agents.filter((item) => item.ativo && item.id !== dialog.editingId)" :key="agent.id" type="button" class="rounded-full border bg-background px-2 py-1 transition-colors hover:border-primary/40 hover:text-primary" @click="insertTransfer(agent)">
                {{ agent.nome }}
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Ativo</Label>
              <p class="text-[11px] text-muted-foreground">Se inativo, o agente não atende.</p>
            </div>
            <Switch v-model="form.ativo" />
          </div>

          <div class="rounded-xl border bg-muted/20 p-3">
            <div class="grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_130px]">
              <div>
                <Label for="agent-delay">Atraso entre mensagens</Label>
                <p class="mt-1 text-[11px] text-muted-foreground">Após receber uma mensagem do cliente, o agente aguardará este tempo antes de consultar a IA e responder.</p>
              </div>
              <div class="relative">
                <Input id="agent-delay" v-model.number="form.delaySegundos" type="number" min="0" max="120" step="1" class="pr-9" />
                <span class="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">seg</span>
              </div>
            </div>
            <p class="mt-2 text-[11px] text-muted-foreground">Use 0 para responder imediatamente. Máximo: 120 segundos. Se o cliente escrever novamente durante a espera, a contagem reinicia. O chat de teste não espera esse atraso.</p>
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
            <Label>Agente padrão por instância</Label>
            <p class="text-[11px] text-muted-foreground">
              Cada instância tem um agente padrão. Depois de assumir uma conversa, este agente pode transferi-la silenciosamente para outro especialista ativo.
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

    <Dialog v-model:open="testDialog.open">
      <DialogContent class="flex max-h-[90vh] flex-col sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Testar {{ testDialog.agent?.nome }}</DialogTitle>
          <DialogDescription>Ambiente seguro: consulta o cardápio quando aplicável, mas não envia mensagens, não transfere conversas e não cria pedidos ou Pix.</DialogDescription>
        </DialogHeader>
        <div class="grid min-h-0 flex-1 gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
          <div class="flex min-h-[340px] flex-col rounded-xl border bg-muted/20">
            <div class="flex-1 space-y-3 overflow-y-auto p-4">
              <p v-if="!testMessages.length" class="py-16 text-center text-sm text-muted-foreground">Envie uma mensagem para validar tom, transferência e atendimento de pedidos.</p>
              <div
                v-for="(message, index) in testMessages"
                :key="index"
                :class="message.kind === 'handoff' ? 'mx-auto border-primary/20 bg-primary/[0.06] text-primary' : message.role === 'user' ? 'ml-auto bg-primary text-primary-foreground' : 'mr-auto bg-background'"
                class="max-w-[85%] whitespace-pre-wrap rounded-2xl border px-3 py-2 text-sm shadow-sm"
              >
                <span v-if="message.kind === 'handoff'" class="flex items-center gap-1.5 text-xs font-medium"><Bot class="h-3.5 w-3.5" /> {{ message.text }}</span>
                <template v-else>{{ message.text }}</template>
              </div>
              <div v-if="testing" class="mr-auto flex w-fit items-center gap-2 rounded-2xl border bg-background px-3 py-2 text-sm text-muted-foreground"><LoaderCircle class="h-4 w-4 animate-spin" /> Pensando...</div>
            </div>
            <div class="flex gap-2 border-t p-3">
              <Input v-model="testText" placeholder="Ex.: Quero pedir uma pizza com adicional" :disabled="testing" @keydown.enter.prevent="sendTest" />
              <Button class="text-white" size="icon" :disabled="testing || !testText.trim()" @click="sendTest"><Send class="h-4 w-4" /></Button>
            </div>
          </div>
          <aside class="space-y-3 rounded-xl border bg-muted/20 p-4 text-sm">
            <div class="flex items-center gap-2 font-medium"><FlaskConical class="h-4 w-4 text-primary" /> Sandbox do agente</div>
            <p class="text-xs text-muted-foreground">O contexto do chat é mantido somente nesta simulação.</p>
            <div class="rounded-lg border bg-background p-3 text-xs">
              <p class="font-medium">Atendendo agora</p>
              <p class="mt-1 text-primary">{{ testActiveAgent?.nome || '—' }}</p>
            </div>
            <div class="rounded-lg border bg-background p-3 text-xs">
              <p class="font-medium">Ferramentas Restaurante</p>
              <p :class="testRestaurantToolsEnabled ? 'text-emerald-600' : 'text-muted-foreground'" class="mt-1">{{ testRestaurantToolsEnabled ? 'Consultadas nesta conversa' : 'Não consultadas' }}</p>
            </div>
            <p class="text-xs text-muted-foreground">O agente padrão é definido pelas instâncias. As transferências ficam internas e preservam o contexto.</p>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
