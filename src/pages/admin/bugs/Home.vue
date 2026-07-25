<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { Bug, CircleCheck, Loader2, RefreshCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ModalView from '@/components/formulario/ModalView.vue'
import BadgeCell from '@/components/tabela/BadgeCell.vue'
import { formatDateToPtBR } from '@/utils/formatters'
import { BugRepository, type RelatoBugStatus } from '@/repositories/bug-repository'
import Tabela from './tabela/Tabela.vue'
import { getSeveridadeBadge, getStatusBadge } from './tabela/columnDef'
import { useBugsAdmin } from './useBugsAdmin'

const toast = useToast()
const { refreshKey, selected, modalOpen, triggerRefresh } = useBugsAdmin()

const status = ref<RelatoBugStatus | 'TODOS'>('TODOS')
const saving = ref(false)

// Formulário do modal de detalhe (status + resposta interna).
const form = reactive<{ status: RelatoBugStatus; respostaAdmin: string }>({
  status: 'ABERTO',
  respostaAdmin: '',
})

const tableFilters = reactive({
  status: 'TODOS',
  update: 0,
})

const statusOptions = [
  { label: 'Todos', value: 'TODOS' },
  { label: 'Abertos', value: 'ABERTO' },
  { label: 'Em análise', value: 'EM_ANALISE' },
  { label: 'Resolvidos', value: 'RESOLVIDO' },
  { label: 'Descartados', value: 'DESCARTADO' },
]

function refreshTable() {
  tableFilters.status = status.value
  tableFilters.update = Date.now()
}

async function salvar() {
  if (!selected.value) return
  saving.value = true
  try {
    await BugRepository.atualizarAdmin(selected.value.id, {
      status: form.status,
      respostaAdmin: form.respostaAdmin || null,
    })
    toast.success('Relato atualizado.')
    modalOpen.value = false
    refreshTable()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao atualizar o relato.')
  } finally {
    saving.value = false
  }
}

watch(status, refreshTable)

// A tabela e as ações da linha disparam refreshKey; refletimos na tabela.
watch(refreshKey, refreshTable)

// Ao abrir o modal de detalhe, pré-carrega o formulário com o relato selecionado.
watch(modalOpen, (open) => {
  if (open && selected.value) {
    form.status = selected.value.status
    form.respostaAdmin = selected.value.respostaAdmin || ''
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div class="flex items-center gap-3">
        <div class="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Bug class="h-5 w-5" />
        </div>
        <div>
          <h2 class="text-2xl font-bold text-foreground">Relatos de bug</h2>
          <p class="text-sm text-muted-foreground">
            Problemas enviados pelos usuários das contas. Acompanhe e defina a resolução.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <Select v-model="status">
          <SelectTrigger class="w-full bg-card sm:w-[180px]">
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" class="gap-2 bg-card" @click="refreshTable">
          <RefreshCcw class="h-4 w-4" /> Atualizar
        </Button>
      </div>
    </div>

    <Tabela :filters="tableFilters" />

    <!-- Modal de detalhe / resposta -->
    <ModalView v-model:open="modalOpen" :icon="Bug" title="Detalhe do relato"
      description="Analise o problema e defina a resolução." size="lg">
      <div v-if="selected" class="space-y-4 px-4">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <h3 class="text-lg font-semibold text-foreground">{{ selected.titulo }}</h3>
            <BadgeCell :label="getSeveridadeBadge(selected.severidade).label"
              :color="getSeveridadeBadge(selected.severidade).color"
              :icon="getSeveridadeBadge(selected.severidade).icon" :capitalize="false" size="sm" />
            <BadgeCell :label="getStatusBadge(selected.status).label" :color="getStatusBadge(selected.status).color"
              :icon="getStatusBadge(selected.status).icon" :capitalize="false" size="sm" />
          </div>
          <p class="text-xs text-muted-foreground">
            {{ selected.Conta?.nome || '—' }} · {{ selected.Usuario?.nome || 'Usuário removido' }} ·
            {{ formatDateToPtBR(selected.createdAt, true) }}
            <span v-if="selected.rota"> · <code class="rounded bg-muted px-1">{{ selected.rota }}</code></span>
          </p>
        </div>

        <div class="rounded-lg border bg-card p-3">
          <p class="whitespace-pre-wrap text-sm text-foreground">{{ selected.descricao }}</p>
        </div>

        <div class="grid gap-4 sm:grid-cols-[180px_1fr]">
          <div class="space-y-1.5">
            <Label>Status</Label>
            <Select v-model="form.status">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ABERTO">Aberto</SelectItem>
                <SelectItem value="EM_ANALISE">Em análise</SelectItem>
                <SelectItem value="RESOLVIDO">Resolvido</SelectItem>
                <SelectItem value="DESCARTADO">Descartado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label>Resposta / observação interna</Label>
            <Textarea v-model="form.respostaAdmin" rows="3"
              placeholder="Opcional: anote a análise ou a resolução." />
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <Button variant="secondary" :disabled="saving" @click="modalOpen = false">Fechar</Button>
          <Button class="text-white" :disabled="saving" @click="salvar">
            <Loader2 v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
            <CircleCheck v-else class="mr-2 h-4 w-4" />
            Salvar
          </Button>
        </div>
      </div>
    </ModalView>
  </div>
</template>
