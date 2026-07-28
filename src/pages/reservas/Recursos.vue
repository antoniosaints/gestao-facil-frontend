<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { ReservationsRepository, type ReservationResource } from '@/repositories/reservas-gerais-repository'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { CalendarOff, Clock, LucidePanelsRightBottom, Pencil, Plus, ToolCaseIcon, Trash2, UsersRound } from 'lucide-vue-next'

const toast = useToast()
const confirm = useConfirm()
const resources = ref<ReservationResource[]>([])
const selected = ref<ReservationResource | null>(null)
const resourceOpen = ref(false)
const scheduleOpen = ref(false)
const blockOpen = ref(false)
const saving = ref(false)
const resourceForm = reactive({ id: undefined as number | undefined, nome: '', descricao: '', tipo: 'PROFISSIONAL', ativo: true, publico: true, ordem: 0 })
const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const ranges = ref<Array<{ weekday: number; start: string; end: string; enabled: boolean }>>(
  days.map((_, weekday) => ({ weekday, start: '08:00', end: '18:00', enabled: weekday > 0 && weekday < 6 })),
)
const block = reactive({ startAt: '', endAt: '', reason: '' })

function minutes(value: string) {
  const [hours, mins] = value.split(':').map(Number)
  return hours * 60 + mins
}
function clock(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}
async function load() {
  resources.value = await ReservationsRepository.listResources()
}
function openResource(resource?: ReservationResource) {
  Object.assign(resourceForm, resource ? {
    id: resource.id, nome: resource.nome, descricao: resource.descricao || '', tipo: resource.tipo,
    ativo: resource.ativo, publico: resource.publico, ordem: resource.ordem,
  } : { id: undefined, nome: '', descricao: '', tipo: 'PROFISSIONAL', ativo: true, publico: true, ordem: 0 })
  resourceOpen.value = true
}
async function saveResource() {
  try {
    saving.value = true
    await ReservationsRepository.saveResource(resourceForm as any)
    toast.success('Recurso salvo.')
    resourceOpen.value = false
    await load()
  } catch (error: any) { toast.error(error?.response?.data?.message || 'Não foi possível salvar.') }
  finally { saving.value = false }
}
async function deleteResource(resource: ReservationResource) {
  const confirmed = await confirm.confirm({
    title: 'Excluir recurso',
    message: `Deseja excluir “${resource.nome}”? Horários, folgas e vínculos com serviços também serão removidos.`,
    confirmText: 'Sim, excluir',
    cancelText: 'Cancelar',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    saving.value = true
    await ReservationsRepository.deleteResource(resource.id)
    toast.success('Recurso excluído.')
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível excluir o recurso.')
  } finally {
    saving.value = false
  }
}
function openSchedule(resource: ReservationResource) {
  selected.value = resource
  ranges.value = days.map((_, weekday) => {
    const current = resource.Disponibilidades?.find((item) => item.diaSemana === weekday)
    return { weekday, start: current ? clock(current.inicioMinuto) : '08:00', end: current ? clock(current.fimMinuto) : '18:00', enabled: Boolean(current) }
  })
  scheduleOpen.value = true
}
async function saveSchedule() {
  if (!selected.value) return
  const invalidRange = ranges.value.find((item) => item.enabled && minutes(item.end) <= minutes(item.start))
  if (invalidRange) {
    toast.error(`O horário final de ${days[invalidRange.weekday]} deve ser posterior ao inicial.`)
    return
  }
  try {
    saving.value = true
    await ReservationsRepository.saveAvailability(selected.value.id, ranges.value.filter((item) => item.enabled).map((item) => ({
      weekday: item.weekday, startMinute: minutes(item.start), endMinute: minutes(item.end),
    })))
    toast.success('Disponibilidade atualizada.')
    scheduleOpen.value = false
    await load()
  } catch (error: any) { toast.error(error?.response?.data?.message || 'Não foi possível salvar a disponibilidade.') }
  finally { saving.value = false }
}
function openBlock(resource: ReservationResource) {
  selected.value = resource
  Object.assign(block, { startAt: '', endAt: '', reason: '' })
  blockOpen.value = true
}
async function saveBlock() {
  if (!selected.value) return
  if (new Date(block.endAt) <= new Date(block.startAt)) {
    toast.error('O fim do bloqueio deve ser posterior ao início.')
    return
  }
  try {
    saving.value = true
    await ReservationsRepository.saveException({
      resourceId: selected.value.id,
      startAt: new Date(block.startAt).toISOString(),
      endAt: new Date(block.endAt).toISOString(),
      type: 'BLOQUEADO',
      reason: block.reason,
    })
    toast.success('Bloqueio adicionado.')
    blockOpen.value = false
  } catch (error: any) { toast.error(error?.response?.data?.message || 'Não foi possível criar o bloqueio.') }
  finally { saving.value = false }
}
onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-col gap-2 sm:flex-row sm:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <UsersRound class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Recursos e horários
        </h2>
        <p class="text-sm text-muted-foreground">Profissionais, salas e equipamentos disponíveis para reserva.</p>
      </div>
      <Button @click="openResource()"><Plus class="mr-2 h-4 w-4" />Novo recurso</Button>
    </header>
    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card v-for="resource in resources" :key="resource.id">
        <CardContent class="p-5">
          <div class="flex items-start justify-between gap-3">
            <span class="rounded-xl bg-primary/10 p-3 text-primary">
              <UsersRound v-if="resource.tipo === 'PROFISSIONAL'" />
              <LucidePanelsRightBottom v-else-if="resource.tipo === 'SALA'" />
              <ToolCaseIcon v-else />
            </span>
            <div class="flex flex-wrap justify-end gap-1">
              <Badge variant="outline">{{ resource.tipo }}</Badge>
              <Badge :variant="resource.ativo ? 'default' : 'secondary'">{{ resource.ativo ? 'Ativo' : 'Inativo' }}</Badge>
            </div>
          </div>
          <h2 class="mt-4 truncate text-xl font-bold">{{ resource.nome }}</h2>
          <p class="min-h-10 break-words text-sm text-muted-foreground">{{ resource.descricao || 'Sem descrição.' }}</p>
          <p class="mt-3 text-xs text-muted-foreground">{{ resource.Disponibilidades?.length || 0 }} faixas semanais · {{ resource.publico ? 'visível ao público' : 'uso interno' }}</p>
          <div class="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" @click="openResource(resource)"><Pencil class="mr-1 h-4 w-4" />Editar</Button><Button size="sm" variant="outline" @click="openSchedule(resource)"><Clock class="mr-1 h-4 w-4" />Horários</Button><Button size="sm" variant="ghost" @click="openBlock(resource)"><CalendarOff class="mr-1 h-4 w-4" />Folga</Button><Button size="sm" variant="ghost" class="text-destructive hover:text-destructive" :disabled="saving" @click="deleteResource(resource)"><Trash2 class="mr-1 h-4 w-4" />Excluir</Button></div>
        </CardContent>
      </Card>
      <div v-if="!resources.length" class="col-span-full rounded-2xl border border-dashed py-20 text-center text-muted-foreground">Cadastre o primeiro recurso para começar.</div>
    </div>

    <Dialog v-model:open="resourceOpen">
      <DialogContent>
        <DialogHeader><DialogTitle>{{ resourceForm.id ? 'Editar' : 'Novo' }} recurso</DialogTitle><p class="text-sm text-muted-foreground">Cadastre quem ou o que receberá as reservas.</p></DialogHeader>
        <form class="space-y-4" @submit.prevent="saveResource">
          <div class="space-y-1.5"><Label for="recurso-nome">Nome</Label><Input id="recurso-nome" v-model="resourceForm.nome" name="nome" autocomplete="off" placeholder="Ex.: Dra. Ana, Sala 2 ou Projetor…" required /></div>
          <div class="space-y-1.5"><Label for="recurso-descricao">Descrição</Label><Textarea id="recurso-descricao" v-model="resourceForm.descricao" name="descricao" autocomplete="off" placeholder="Ex.: Atendimento especializado em avaliação inicial…" /></div>
          <div class="space-y-1.5"><Label>Tipo</Label><Select v-model="resourceForm.tipo"><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger><SelectContent><SelectItem value="PROFISSIONAL">Profissional</SelectItem><SelectItem value="SALA">Sala</SelectItem><SelectItem value="EQUIPAMENTO">Equipamento</SelectItem></SelectContent></Select></div>
          <div class="grid gap-3 sm:grid-cols-2">
            <div class="flex items-center justify-between rounded-lg border p-3"><Label for="recurso-ativo">Recurso ativo</Label><Switch id="recurso-ativo" v-model="resourceForm.ativo" /></div>
            <div class="flex items-center justify-between rounded-lg border p-3"><Label for="recurso-publico">Visível ao público</Label><Switch id="recurso-publico" v-model="resourceForm.publico" /></div>
          </div>
          <div class="flex justify-end gap-2"><Button type="button" variant="outline" @click="resourceOpen = false">Cancelar</Button><Button type="submit" :disabled="saving">Salvar recurso</Button></div>
        </form>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="scheduleOpen">
      <DialogContent class="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>Disponibilidade · {{ selected?.nome }}</DialogTitle><p class="text-sm text-muted-foreground">Ative os dias e informe o início e o fim do atendimento.</p></DialogHeader>
        <div class="space-y-2">
          <div v-for="range in ranges" :key="range.weekday" class="grid gap-3 rounded-lg border p-3 sm:grid-cols-[140px_1fr_1fr] sm:items-center">
            <div class="flex items-center gap-3"><Switch :id="`dia-${range.weekday}`" v-model="range.enabled" /><Label :for="`dia-${range.weekday}`">{{ days[range.weekday] }}</Label></div>
            <div class="space-y-1"><Label :for="`inicio-${range.weekday}`" class="text-xs sm:sr-only">Início</Label><Input :id="`inicio-${range.weekday}`" v-model="range.start" type="time" :disabled="!range.enabled" /></div>
            <div class="space-y-1"><Label :for="`fim-${range.weekday}`" class="text-xs sm:sr-only">Fim</Label><Input :id="`fim-${range.weekday}`" v-model="range.end" type="time" :disabled="!range.enabled" /></div>
          </div>
        </div>
        <div class="flex justify-end gap-2"><Button variant="outline" @click="scheduleOpen = false">Cancelar</Button><Button :disabled="saving" @click="saveSchedule">Salvar horários</Button></div>
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="blockOpen">
      <DialogContent>
        <DialogHeader><DialogTitle>Adicionar folga ou bloqueio</DialogTitle><p class="text-sm text-muted-foreground">O período ficará indisponível para novas reservas.</p></DialogHeader>
        <form class="space-y-4" @submit.prevent="saveBlock">
          <div class="space-y-1.5"><Label for="bloqueio-inicio">Início</Label><Input id="bloqueio-inicio" v-model="block.startAt" name="inicio" type="datetime-local" required /></div>
          <div class="space-y-1.5"><Label for="bloqueio-fim">Fim</Label><Input id="bloqueio-fim" v-model="block.endAt" name="fim" type="datetime-local" required /></div>
          <div class="space-y-1.5"><Label for="bloqueio-motivo">Motivo</Label><Input id="bloqueio-motivo" v-model="block.reason" name="motivo" autocomplete="off" placeholder="Ex.: férias, manutenção ou evento interno…" /></div>
          <div class="flex justify-end gap-2"><Button type="button" variant="outline" @click="blockOpen = false">Cancelar</Button><Button type="submit" :disabled="saving">Adicionar bloqueio</Button></div>
        </form>
      </DialogContent>
    </Dialog>
  </div>
</template>
