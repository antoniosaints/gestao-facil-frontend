<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { CheckCircle2, ClipboardList, Clock3, ExternalLink, ListTodo, Plus, Search, Trash2, UserRound, Wrench } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { OuriveRepository, type OuriveCapability } from '@/repositories/ourive-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { moneyMaskOptions } from '@/lib/imaska'
import { formatToNumberValue } from '@/utils/formatters'
import { vMaska } from 'maska/vue'

const router = useRouter()
const toast = useToast()
const ui = useUiStore()
const orders = ref<any[]>([])
const selected = ref<any>()
const team = ref<any[]>([])
const specialties = ref<any[]>([])
const search = ref('')
const showNewStage = ref(false)
const form = reactive<any>({ nome: '', especialidadeId: undefined, prazoPrevisto: null as Date | null, observacao: '', responsavelIds: [] as number[], comissoes: [] as any[] })

const can = (capability: OuriveCapability) => ui.hasOuriveCapability(capability)
const ourives = computed(() => team.value.filter((member) => member.papeis?.includes('OURIVE')))
const responsibleMembers = computed(() => ourives.value.filter((member) => form.responsavelIds.includes(member.id)))
const filteredOrders = computed(() => {
  const term = search.value.trim().toLowerCase()
  return term ? orders.value.filter((order) => `${order.codigoRastreio} ${order.ordemServico?.Cliente?.nome || ''} ${order.ordemServico?.descricao || ''}`.toLowerCase().includes(term)) : orders.value
})
const productionCount = computed(() => orders.value.filter((order) => order.status === 'PRODUCAO').length)
const reviewCount = computed(() => orders.value.filter((order) => order.status === 'REVISAO').length)
const stageCounts = computed(() => ({ total: selected.value?.etapas?.length || 0, completed: selected.value?.etapas?.filter((stage: any) => stage.status === 'APROVADA').length || 0 }))
const specialtyName = (id: number) => specialties.value.find((item) => item.id === id)?.nome || `Especialidade #${id}`
const stageLabel = (status: string) => ({ PENDENTE: 'Pendente', EM_EXECUCAO: 'Em execução', AGUARDANDO_REVISAO: 'Aguardando revisão', APROVADA: 'Aprovada', REPROVADA: 'Reprovada' } as Record<string, string>)[status] || status
const stageBadge = (status: string) => status === 'APROVADA' ? 'default' : status === 'REPROVADA' ? 'destructive' : status === 'EM_EXECUCAO' ? 'secondary' : 'outline'
const orderStatusLabel = (status: string) =>
  (
    {
      RECEBIDA: 'Recebida',
      ORCAMENTO: 'Orçamento',
      AGUARDANDO_MATERIAL: 'Aguardando material',
      PRONTA_PRODUCAO: 'Pronta para produção',
      PRODUCAO: 'Em produção',
      FINALIZADA: 'Finalizada',
      REVISAO: 'Em revisão',
      PRONTA_ENTREGA: 'Pronta para entrega',
      ENTREGUE: 'Entregue',
      RECUSADA: 'Recusada',
      CANCELADA: 'Cancelada',
    } as Record<string, string>
  )[status] || status.replaceAll('_', ' ').toLocaleLowerCase('pt-BR')
const usersFor = (ids: number[]) => ids?.map((id) => team.value.find((member) => member.id === id)?.nome || `#${id}`).join(', ') || 'Sem responsável'
const formatDate = (value?: string | Date | null) => value ? new Date(value).toLocaleDateString('pt-BR') : 'Sem prazo definido'
function resetForm() { Object.assign(form, { nome: '', especialidadeId: undefined, prazoPrevisto: null, observacao: '', responsavelIds: [], comissoes: [] }) }
function cancelStageForm() { showNewStage.value = false; resetForm() }
async function load() {
  try {
    const [orderData, specialtyData] = await Promise.all([
      OuriveRepository.ordens().then((data) => data.items.filter((item: any) => !['ENTREGUE', 'RECUSADA', 'CANCELADA'].includes(item.status))),
      OuriveRepository.especialidades(),
    ])
    orders.value = orderData
    specialties.value = specialtyData
    // A equipe é auxiliar para nomes e criação de etapas. Uma permissão antiga
    // no backend não deve impedir o ourive de acessar suas OS atribuídas.
    try { team.value = await OuriveRepository.equipe() } catch { team.value = [] }
    if (orders.value.length) await openOrder(selected.value?.id && orders.value.some((order) => order.id === selected.value.id) ? selected.value.id : orders.value[0].id)
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        'Não foi possível carregar a produção.',
    )
  }
}
async function openOrder(id: number) { try { selected.value = await OuriveRepository.ordem(id); showNewStage.value = false; resetForm() } catch { toast.error('Não foi possível abrir a ordem.') } }
function addSplit() { form.comissoes.push({ usuarioId: form.responsavelIds[0], tipo: 'PERCENTUAL', referencia: 0 }) }
async function saveStage() {
  if (!form.nome || !form.responsavelIds.length || form.comissoes.some((item: any) => !item.usuarioId || formatToNumberValue(item.referencia || 0) <= 0)) return toast.info('Informe etapa, responsáveis e os valores de comissão.')
  try {
    await OuriveRepository.criarEtapa(selected.value.id, { ...form, prazoPrevisto: form.prazoPrevisto || undefined, responsavelIds: form.responsavelIds.map(Number), comissoes: form.comissoes.map((item: any) => ({ ...item, usuarioId: Number(item.usuarioId), referencia: formatToNumberValue(item.referencia) })) })
    await openOrder(selected.value.id)
    toast.success('Etapa criada.')
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível criar a etapa.') }
}
async function action(stage: any, acao: string) {
  const motivoReprovacao = acao === 'REPROVAR' ? window.prompt('Motivo da reprovação:') : undefined
  if (acao === 'REPROVAR' && !motivoReprovacao) return
  try { await OuriveRepository.atualizarEtapa(stage.id, { acao, motivoReprovacao }); await openOrder(selected.value.id); await load(); toast.success('Etapa atualizada.') }
  catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível atualizar a etapa.') }
}
onMounted(load)
</script>

<template>
  <section class="space-y-5">
    <div class="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><h2 class="flex items-center gap-2 text-2xl font-bold"><Wrench class="h-6 w-6 text-primary" />Produção</h2><p class="text-sm text-muted-foreground">Selecione uma OS e avance cada etapa com clareza.</p></div><Button v-if="selected && selected.status === 'PRODUCAO' && can('PRODUCAO')" @click="showNewStage = !showNewStage"><Plus class="mr-2 h-4 w-4" />{{ showNewStage ? 'Fechar formulário' : 'Nova etapa' }}</Button></div>

    <div class="grid gap-3 sm:grid-cols-3"><Card><CardContent class="flex items-center gap-3 p-4"><ClipboardList class="h-5 w-5 text-primary" /><div><p class="text-xs text-muted-foreground">Ordens ativas</p><p class="text-xl font-bold">{{ orders.length }}</p></div></CardContent></Card><Card><CardContent class="flex items-center gap-3 p-4"><Clock3 class="h-5 w-5 text-amber-600" /><div><p class="text-xs text-muted-foreground">Em produção</p><p class="text-xl font-bold">{{ productionCount }}</p></div></CardContent></Card><Card><CardContent class="flex items-center gap-3 p-4"><CheckCircle2 class="h-5 w-5 text-violet-600" /><div><p class="text-xs text-muted-foreground">Aguardando revisão</p><p class="text-xl font-bold">{{ reviewCount }}</p></div></CardContent></Card></div>

    <div class="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <Card class="h-fit xl:sticky xl:top-4"><CardHeader class="pb-3"><CardTitle class="text-base">Ordens em andamento</CardTitle><div class="relative mt-2"><Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input v-model="search" class="pl-9" placeholder="Buscar OS ou cliente" /></div></CardHeader><CardContent class="max-h-[28rem] space-y-2 overflow-y-auto pb-4"><button v-for="order in filteredOrders" :key="order.id" class="w-full min-w-0 overflow-hidden rounded-xl border p-3 text-left transition hover:bg-muted" :class="selected?.id === order.id ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : ''" @click="openOrder(order.id)"><div class="flex min-w-0 items-start justify-between gap-2"><p class="min-w-0 break-words font-semibold">{{ order.codigoRastreio }}</p><Badge class="max-w-[9.5rem] shrink-0 whitespace-normal text-center leading-tight" :variant="order.status === 'REVISAO' ? 'secondary' : 'outline'">{{ orderStatusLabel(order.status) }}</Badge></div><p class="mt-1 truncate text-sm text-muted-foreground">{{ order.ordemServico?.Cliente?.nome || 'Cliente não informado' }}</p><p class="mt-1 line-clamp-2 text-xs text-muted-foreground">{{ order.ordemServico?.descricao || 'Sem solicitação' }}</p></button><p v-if="!filteredOrders.length" class="py-6 text-center text-sm text-muted-foreground">Nenhuma OS em andamento.</p></CardContent></Card>

      <div v-if="selected" class="space-y-5"><Card><CardContent class="p-5"><div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div class="min-w-0"><div class="flex min-w-0 flex-wrap items-center gap-2"><p class="break-words text-xl font-bold">{{ selected.codigoRastreio }}</p><Badge class="max-w-full whitespace-normal text-center leading-tight" :variant="selected.status === 'REVISAO' ? 'secondary' : 'outline'">{{ orderStatusLabel(selected.status) }}</Badge></div><p class="mt-1 font-medium">{{ selected.ordemServico?.Cliente?.nome || 'Cliente não informado' }}</p><p class="mt-1 text-sm text-muted-foreground">{{ selected.ordemServico?.descricao }}</p></div><Button class="shrink-0" variant="outline" size="sm" @click="router.push({ name: 'ourive-ordem', params: { id: selected.id } })"><ExternalLink class="mr-2 h-4 w-4" />Abrir OS</Button></div><div class="mt-5 grid gap-3 border-t pt-4 sm:grid-cols-2"><div class="flex items-center gap-2"><ListTodo class="h-4 w-4 text-primary" /><span class="text-sm">{{ stageCounts.completed }} de {{ stageCounts.total }} etapas aprovadas</span></div><div class="flex items-center gap-2"><UserRound class="h-4 w-4 text-primary" /><span class="text-sm">Acompanhe responsáveis e prazos por etapa</span></div></div></CardContent></Card>

        <Card><CardHeader><CardTitle class="text-base">Etapas da ordem</CardTitle><CardDescription>O fluxo segue de pendente para execução, revisão e aprovação.</CardDescription></CardHeader><CardContent><div v-if="selected.etapas?.length" class="relative space-y-0 before:absolute before:bottom-5 before:left-5 before:top-5 before:w-px before:bg-border"><article v-for="(stage, index) in selected.etapas" :key="stage.id" class="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 pb-5 last:pb-0"><div class="z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background text-sm font-bold" :class="stage.status === 'APROVADA' ? 'border-emerald-500 text-emerald-600' : stage.status === 'REPROVADA' ? 'border-destructive text-destructive' : stage.status === 'EM_EXECUCAO' ? 'border-primary text-primary' : 'border-muted-foreground/40 text-muted-foreground'">{{ index + 1 }}</div><div class="rounded-xl border bg-card p-4"><div class="flex flex-col justify-between gap-3 sm:flex-row"><div><p class="font-semibold">{{ stage.nome }}</p><p class="mt-1 text-xs text-muted-foreground">{{ stage.especialidadeId ? specialtyName(stage.especialidadeId) : 'Sem especialidade' }} · {{ formatDate(stage.prazoPrevisto) }}</p></div><Badge :variant="stageBadge(stage.status)">{{ stageLabel(stage.status) }}</Badge></div><div class="mt-3 grid gap-2 text-sm sm:grid-cols-2"><p><span class="text-muted-foreground">Responsáveis: </span>{{ usersFor(stage.responsavelIds) }}</p><p v-if="stage.observacao"><span class="text-muted-foreground">Observação: </span>{{ stage.observacao }}</p></div><p v-if="stage.motivoReprovacao" class="mt-3 rounded-lg bg-destructive/10 p-2 text-sm text-destructive">Reprovada: {{ stage.motivoReprovacao }}</p><div class="mt-4 flex flex-wrap gap-2"><Button v-if="selected.status === 'PRODUCAO' && can('PRODUCAO') && ['PENDENTE', 'REPROVADA'].includes(stage.status)" size="sm" @click="action(stage, 'INICIAR')">Iniciar etapa</Button><Button v-if="selected.status === 'PRODUCAO' && can('PRODUCAO') && stage.status === 'EM_EXECUCAO'" size="sm" variant="outline" @click="action(stage, 'ENVIAR_REVISAO')">Enviar para revisão</Button><Button v-if="selected.status === 'PRODUCAO' && can('REVISAO') && stage.status === 'AGUARDANDO_REVISAO'" size="sm" @click="action(stage, 'APROVAR')">Aprovar etapa</Button><Button v-if="selected.status === 'PRODUCAO' && can('REVISAO') && stage.status === 'AGUARDANDO_REVISAO'" size="sm" variant="destructive" @click="action(stage, 'REPROVAR')">Reprovar etapa</Button></div></div></article></div><div v-else class="rounded-xl border border-dashed p-8 text-center"><ListTodo class="mx-auto h-7 w-7 text-muted-foreground" /><p class="mt-3 font-medium">Nenhuma etapa cadastrada</p><p class="mt-1 text-sm text-muted-foreground">Crie a primeira etapa para iniciar a organização da produção.</p><Button v-if="selected.status === 'PRODUCAO' && can('PRODUCAO')" class="mt-4" size="sm" @click="showNewStage = true"><Plus class="mr-2 h-4 w-4" />Criar primeira etapa</Button></div></CardContent></Card>

        <Card v-if="showNewStage && can('PRODUCAO')"><CardHeader><CardTitle class="text-base">Nova etapa para {{ selected.codigoRastreio }}</CardTitle><CardDescription>Defina a atividade, responsáveis, prazo e comissão.</CardDescription></CardHeader><CardContent class="space-y-5"><div class="grid gap-3 md:grid-cols-2"><Input v-model="form.nome" placeholder="Ex.: Ajuste de aro" /><select v-model.number="form.especialidadeId" class="h-10 rounded-md border bg-background px-3"><option :value="undefined">Sem especialidade</option><option v-for="specialty in specialties" :key="specialty.id" :value="specialty.id">{{ specialty.nome }}</option></select><Calendarpicker v-model="form.prazoPrevisto" :teleport="true" /><Input v-model="form.observacao" placeholder="Observação da etapa" /></div><div><p class="mb-2 text-sm font-medium">Responsáveis</p><div class="flex flex-wrap gap-2"><label v-for="member in ourives" :key="member.id" class="cursor-pointer rounded-lg border px-3 py-2 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5"><input v-model="form.responsavelIds" class="mr-2" type="checkbox" :value="member.id" />{{ member.nome }}</label><p v-if="!ourives.length" class="text-sm text-muted-foreground">Cadastre profissionais com o papel de Ourive.</p></div></div><div class="rounded-xl border p-4"><div class="flex items-center justify-between"><div><p class="text-sm font-semibold">Comissões</p><p class="text-xs text-muted-foreground">Opcional: distribua a comissão entre responsáveis.</p></div><Button size="sm" variant="outline" :disabled="!form.responsavelIds.length" @click="addSplit"><Plus class="mr-1 h-4 w-4" />Adicionar</Button></div><div v-for="(split, index) in form.comissoes" :key="index" class="mt-3 grid gap-2 sm:grid-cols-[1fr_10rem_8rem_auto]"><select v-model.number="split.usuarioId" class="h-10 rounded-md border bg-background px-3"><option :value="undefined">Responsável</option><option v-for="member in responsibleMembers" :key="member.id" :value="member.id">{{ member.nome }}</option></select><select v-model="split.tipo" class="h-10 rounded-md border bg-background px-3"><option value="PERCENTUAL">Percentual</option><option value="VALOR_FIXO">Valor fixo</option></select><Input v-model="split.referencia" v-maska="moneyMaskOptions" type="text" inputmode="decimal" :placeholder="split.tipo === 'PERCENTUAL' ? 'Ex.: 10,00' : '0,00'" /><Button size="icon" variant="ghost" @click="form.comissoes.splice(index, 1)"><Trash2 class="h-4 w-4" /></Button></div></div><div class="flex justify-end gap-2"><Button variant="outline" @click="cancelStageForm">Cancelar</Button><Button @click="saveStage">Criar etapa</Button></div></CardContent></Card>
      </div>
      <Card v-else><CardContent class="p-12 text-center"><Wrench class="mx-auto h-8 w-8 text-muted-foreground" /><p class="mt-3 font-medium">Selecione uma ordem de serviço</p><p class="mt-1 text-sm text-muted-foreground">As OS em produção e revisão aparecerão aqui.</p></CardContent></Card>
    </div>
  </section>
</template>
