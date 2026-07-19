<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Archive, CheckCircle2, LoaderCircle, Megaphone, Pencil, Plus, Send, X } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { ContaRepository, type AdminModuloItem } from '@/repositories/conta-repository'
import {
  InformativoRepository,
  type InformativoEscopo,
  type InformativoPayload,
  type InformativoSeveridade,
  type InformativoSistema,
  type InformativoSituacao,
  type InformativoStatus,
} from '@/repositories/informativo-repository'

type ContaSelecionada = { id: number; nome: string }

const toast = useToast()
const loading = ref(false)
const saving = ref(false)
const actionId = ref<number | null>(null)
const items = ref<InformativoSistema[]>([])
const modulos = ref<AdminModuloItem[]>([])
const modalOpen = ref(false)
const editingId = ref<number | null>(null)
const search = ref('')
const statusFilter = ref<'TODOS' | InformativoStatus>('TODOS')
const contaSelecionarId = ref<number | null>(null)
const contaSelecionarLabel = ref('')
const contasSelecionadas = ref<ContaSelecionada[]>([])

const form = ref({
  titulo: '',
  mensagem: '',
  integracao: 'Sistema',
  severidade: 'INFO' as InformativoSeveridade,
  situacao: 'INVESTIGANDO' as InformativoSituacao,
  escopo: 'GLOBAL' as InformativoEscopo,
  moduloCodigo: '',
  inicioEm: '',
  fimEm: '',
})

const filteredItems = computed(() => items.value.filter((item) => {
  const term = search.value.trim().toLowerCase()
  const matchesSearch = !term || `${item.titulo} ${item.mensagem} ${item.integracao}`.toLowerCase().includes(term)
  return matchesSearch && (statusFilter.value === 'TODOS' || item.status === statusFilter.value)
}))

const counters = computed(() => ({
  publicados: items.value.filter((item) => item.status === 'PUBLICADO').length,
  rascunhos: items.value.filter((item) => item.status === 'RASCUNHO').length,
  resolvidos: items.value.filter((item) => item.status === 'RESOLVIDO').length,
}))

async function load() {
  try {
    loading.value = true
    const [informativos, responseModulos] = await Promise.all([
      InformativoRepository.listarAdmin(),
      ContaRepository.listarModulosAdmin(),
    ])
    items.value = informativos
    modulos.value = responseModulos.data || []
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao carregar os informativos')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  editingId.value = null
  form.value = {
    titulo: '', mensagem: '', integracao: 'Sistema', severidade: 'INFO', situacao: 'INVESTIGANDO',
    escopo: 'GLOBAL', moduloCodigo: '', inicioEm: '', fimEm: '',
  }
  contasSelecionadas.value = []
  contaSelecionarId.value = null
  contaSelecionarLabel.value = ''
}

function openCreate() {
  resetForm()
  modalOpen.value = true
}

function toLocalInput(value?: string | null) {
  if (!value) return ''
  const date = new Date(value)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function openEdit(item: InformativoSistema) {
  editingId.value = item.id
  form.value = {
    titulo: item.titulo,
    mensagem: item.mensagem,
    integracao: item.integracao,
    severidade: item.severidade,
    situacao: item.situacao,
    escopo: item.escopo,
    moduloCodigo: item.moduloCodigo || '',
    inicioEm: toLocalInput(item.inicioEm),
    fimEm: toLocalInput(item.fimEm),
  }
  contasSelecionadas.value = (item.contas || []).map((entry) => ({ id: entry.Conta.id, nome: entry.Conta.nome }))
  modalOpen.value = true
}

function addConta() {
  const id = Number(contaSelecionarId.value)
  if (!id || contasSelecionadas.value.some((item) => item.id === id)) return
  contasSelecionadas.value.push({ id, nome: contaSelecionarLabel.value || `Conta #${id}` })
  contaSelecionarId.value = null
  contaSelecionarLabel.value = ''
}

function payload(): InformativoPayload {
  return {
    ...form.value,
    moduloCodigo: form.value.escopo === 'MODULO' ? form.value.moduloCodigo : null,
    contaIds: form.value.escopo === 'CONTAS' ? contasSelecionadas.value.map((item) => item.id) : [],
    inicioEm: form.value.inicioEm ? new Date(form.value.inicioEm).toISOString() : null,
    fimEm: form.value.fimEm ? new Date(form.value.fimEm).toISOString() : null,
  }
}

async function save() {
  if (!form.value.titulo.trim() || !form.value.mensagem.trim()) {
    toast.error('Informe título e mensagem.')
    return
  }
  if (form.value.escopo === 'MODULO' && !form.value.moduloCodigo) {
    toast.error('Selecione o app afetado.')
    return
  }
  if (form.value.escopo === 'CONTAS' && !contasSelecionadas.value.length) {
    toast.error('Selecione ao menos uma conta.')
    return
  }
  try {
    saving.value = true
    if (editingId.value) await InformativoRepository.atualizar(editingId.value, payload())
    else await InformativoRepository.criar(payload())
    toast.success(editingId.value ? 'Informativo atualizado' : 'Rascunho criado')
    modalOpen.value = false
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao salvar o informativo')
  } finally {
    saving.value = false
  }
}

async function runAction(item: InformativoSistema, action: 'publicar' | 'resolver' | 'arquivar') {
  try {
    actionId.value = item.id
    if (action === 'publicar') await InformativoRepository.publicar(item.id)
    if (action === 'resolver') await InformativoRepository.resolver(item.id)
    if (action === 'arquivar') await InformativoRepository.arquivar(item.id)
    toast.success(action === 'publicar' ? 'Informativo publicado' : action === 'resolver' ? 'Informativo resolvido' : 'Informativo arquivado')
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao atualizar o informativo')
  } finally {
    actionId.value = null
  }
}

function statusLabel(status: InformativoStatus) {
  return { RASCUNHO: 'Rascunho', PUBLICADO: 'Publicado', RESOLVIDO: 'Resolvido', ARQUIVADO: 'Arquivado' }[status]
}

function statusClass(status: InformativoStatus) {
  return {
    RASCUNHO: 'bg-slate-500/10 text-slate-600',
    PUBLICADO: 'bg-amber-500/10 text-amber-600',
    RESOLVIDO: 'bg-emerald-500/10 text-emerald-600',
    ARQUIVADO: 'bg-muted text-muted-foreground',
  }[status]
}

function scopeLabel(item: InformativoSistema) {
  if (item.escopo === 'GLOBAL') return 'Todas as contas'
  if (item.escopo === 'MODULO') return `App: ${item.moduloCodigo}`
  return `${item.contas?.length || 0} conta(s)`
}

onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Megaphone class="h-6 w-6" /></div>
        <div>
          <h2 class="text-xl font-bold text-foreground">Informativos da plataforma</h2>
          <p class="text-sm text-muted-foreground">Comunique instabilidades sem interromper a operação dos clientes.</p>
        </div>
      </div>
      <Button class="text-white" @click="openCreate"><Plus class="mr-2 h-4 w-4" /> Novo informativo</Button>
    </header>

    <section class="grid grid-cols-3 gap-3">
      <Card><CardContent class="p-4"><div class="text-xs text-muted-foreground">Publicados</div><div class="mt-1 text-2xl font-bold">{{ counters.publicados }}</div></CardContent></Card>
      <Card><CardContent class="p-4"><div class="text-xs text-muted-foreground">Rascunhos</div><div class="mt-1 text-2xl font-bold">{{ counters.rascunhos }}</div></CardContent></Card>
      <Card><CardContent class="p-4"><div class="text-xs text-muted-foreground">Resolvidos</div><div class="mt-1 text-2xl font-bold">{{ counters.resolvidos }}</div></CardContent></Card>
    </section>

    <div class="grid gap-3 rounded-xl border bg-card p-3 md:grid-cols-[1fr_12rem_auto]">
      <Input v-model="search" placeholder="Buscar por título, mensagem ou integração..." />
      <Select v-model="statusFilter"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
        <SelectItem value="TODOS">Todos os status</SelectItem><SelectItem value="RASCUNHO">Rascunhos</SelectItem>
        <SelectItem value="PUBLICADO">Publicados</SelectItem><SelectItem value="RESOLVIDO">Resolvidos</SelectItem><SelectItem value="ARQUIVADO">Arquivados</SelectItem>
      </SelectContent></Select>
      <Button variant="outline" :disabled="loading" @click="load"><LoaderCircle class="mr-2 h-4 w-4" :class="loading ? 'animate-spin' : ''" /> Atualizar</Button>
    </div>

    <div v-if="loading && !items.length" class="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Carregando informativos...</div>
    <div v-else-if="!filteredItems.length" class="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Nenhum informativo encontrado.</div>
    <section v-else class="grid gap-4 lg:grid-cols-2">
      <Card v-for="item in filteredItems" :key="item.id" class="overflow-hidden">
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0"><div class="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ item.integracao }}</div><CardTitle class="text-base">{{ item.titulo }}</CardTitle></div>
            <span class="shrink-0 rounded-full px-2 py-1 text-xs font-medium" :class="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
          </div>
        </CardHeader>
        <CardContent class="space-y-3">
          <p class="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{{ item.mensagem }}</p>
          <div class="flex flex-wrap gap-2 text-xs">
            <Badge variant="outline">{{ item.severidade }}</Badge><Badge variant="outline">{{ item.situacao }}</Badge><Badge variant="outline">{{ scopeLabel(item) }}</Badge>
          </div>
          <p class="text-xs text-muted-foreground">Atualizado em {{ new Date(item.updatedAt).toLocaleString('pt-BR') }}<span v-if="item.CriadoPor"> por {{ item.CriadoPor.nome }}</span></p>
        </CardContent>
        <CardFooter class="flex flex-wrap justify-end gap-2 border-t py-3">
          <Button size="sm" variant="outline" @click="openEdit(item)"><Pencil class="mr-1.5 h-3.5 w-3.5" /> Editar</Button>
          <Button v-if="item.status === 'RASCUNHO' || item.status === 'RESOLVIDO'" size="sm" class="text-white" :disabled="actionId === item.id" @click="runAction(item, 'publicar')"><Send class="mr-1.5 h-3.5 w-3.5" /> Publicar</Button>
          <Button v-if="item.status === 'PUBLICADO'" size="sm" variant="outline" class="text-emerald-600" :disabled="actionId === item.id" @click="runAction(item, 'resolver')"><CheckCircle2 class="mr-1.5 h-3.5 w-3.5" /> Resolver</Button>
          <Button v-if="item.status !== 'ARQUIVADO'" size="sm" variant="ghost" :disabled="actionId === item.id" @click="runAction(item, 'arquivar')"><Archive class="mr-1.5 h-3.5 w-3.5" /> Arquivar</Button>
        </CardFooter>
      </Card>
    </section>

    <ModalView v-model:open="modalOpen" :title="editingId ? 'Editar informativo' : 'Novo informativo'" description="O conteúdo aparece de forma discreta no status dos serviços." size="2xl" :icon="Megaphone">
      <form class="space-y-4 px-4" @submit.prevent="save">
        <div class="grid gap-4 md:grid-cols-2"><div class="space-y-1.5"><Label for="inf-titulo">Título</Label><Input id="inf-titulo" v-model="form.titulo" maxlength="120" required /></div><div class="space-y-1.5"><Label for="inf-integracao">Integração/área</Label><Input id="inf-integracao" v-model="form.integracao" maxlength="60" placeholder="WhatsApp" required /></div></div>
        <div class="space-y-1.5"><Label for="inf-mensagem">Mensagem</Label><Textarea id="inf-mensagem" v-model="form.mensagem" rows="5" maxlength="2000" required /><p class="text-xs text-muted-foreground">Texto simples, sem HTML. Seja objetivo e informe o impacto real.</p></div>
        <div class="rounded-xl border border-blue-500/25 bg-blue-500/5 p-3">
          <div class="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Prévia no cliente · {{ form.integracao || 'Sistema' }}</div>
          <div class="mt-1 text-sm font-semibold">{{ form.titulo || 'Título do informativo' }}</div>
          <p class="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{{ form.mensagem || 'A mensagem será exibida aqui sem interromper a operação.' }}</p>
        </div>
        <div class="grid gap-4 md:grid-cols-3">
          <div class="space-y-1.5"><Label>Severidade</Label><Select v-model="form.severidade"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INFO">Informativo</SelectItem><SelectItem value="ATENCAO">Atenção</SelectItem><SelectItem value="INDISPONIBILIDADE">Indisponibilidade</SelectItem></SelectContent></Select></div>
          <div class="space-y-1.5"><Label>Situação</Label><Select v-model="form.situacao"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INVESTIGANDO">Investigando</SelectItem><SelectItem value="MONITORANDO">Monitorando</SelectItem><SelectItem value="RESOLVIDO">Resolvido</SelectItem></SelectContent></Select></div>
          <div class="space-y-1.5"><Label>Público</Label><Select v-model="form.escopo"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="GLOBAL">Todas as contas</SelectItem><SelectItem value="MODULO">Contas por app</SelectItem><SelectItem value="CONTAS">Contas específicas</SelectItem></SelectContent></Select></div>
        </div>
        <div v-if="form.escopo === 'MODULO'" class="space-y-1.5"><Label>App afetado</Label><Select v-model="form.moduloCodigo"><SelectTrigger><SelectValue placeholder="Selecione o app" /></SelectTrigger><SelectContent><SelectItem v-for="modulo in modulos" :key="modulo.id" :value="modulo.codigo">{{ modulo.nome }}</SelectItem></SelectContent></Select></div>
        <div v-if="form.escopo === 'CONTAS'" class="space-y-2"><Label>Contas específicas</Label><div class="flex gap-2"><Select2Ajax v-model="contaSelecionarId" v-model:label="contaSelecionarLabel" class="flex-1" url="/admin/faturas/contas/select2" placeholder="Buscar assinante" /><Button type="button" variant="outline" @click="addConta">Adicionar</Button></div><div class="flex flex-wrap gap-2"><span v-for="conta in contasSelecionadas" :key="conta.id" class="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs">{{ conta.nome }}<button type="button" @click="contasSelecionadas = contasSelecionadas.filter((item) => item.id !== conta.id)"><X class="h-3 w-3" /></button></span></div></div>
        <div class="grid gap-4 md:grid-cols-2"><div class="space-y-1.5"><Label for="inf-inicio">Início programado (opcional)</Label><Input id="inf-inicio" v-model="form.inicioEm" type="datetime-local" /></div><div class="space-y-1.5"><Label for="inf-fim">Encerramento programado (opcional)</Label><Input id="inf-fim" v-model="form.fimEm" type="datetime-local" /></div></div>
        <div class="flex justify-end gap-2 border-t py-4"><Button type="button" variant="secondary" @click="modalOpen = false">Cancelar</Button><Button type="submit" class="text-white" :disabled="saving"><LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" /> {{ editingId ? 'Salvar alterações' : 'Salvar rascunho' }}</Button></div>
      </form>
    </ModalView>
  </div>
</template>
