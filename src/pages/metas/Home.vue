<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import {
  Activity,
  BarChart3,
  CalendarDays,
  CircleDollarSign,
  Edit,
  Flag,
  Plus,
  RefreshCw,
  Target,
  Trash2,
  Trophy,
} from 'lucide-vue-next'

import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import BarChart from '@/components/graficos/BarChart.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { useConfirm } from '@/composables/useConfirm'
import { MetasRepository, type MetaPayload, type MetaResumo } from '@/repositories/metas-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'

const toast = useToast()
const uiStore = useUiStore()

const loading = ref(false)
const openModal = ref(false)
const metas = ref<MetaResumo[]>([])
const editingId = ref<number | null>(null)

const form = reactive({
  nome: '',
  descricao: '',
  tipo: 'VENDAS' as MetaPayload['tipo'],
  metrica: 'VALOR' as MetaPayload['metrica'],
  periodicidade: 'MENSAL' as MetaPayload['periodicidade'],
  financeiroTipo: 'RECEITA' as NonNullable<MetaPayload['financeiroTipo']>,
  valorAlvo: '',
  dataInicio: new Date(),
  dataFim: null as Date | null,
  ativo: true,
})

const canManage = computed(() => uiStore.permissoes.admin)

const metasAtivas = computed(() => metas.value.filter((meta) => meta.ativo))
const metasBatidas = computed(() => metas.value.filter((meta) => meta.atingida).length)
const progressoMedio = computed(() => {
  if (!metas.value.length) return 0
  return metas.value.reduce((acc, meta) => acc + Number(meta.percentual || 0), 0) / metas.value.length
})

const chartData = computed(() => {
  const principal = metas.value[0]
  if (!principal) {
    return { labels: [], datasets: [] }
  }

  return {
    labels: principal.historico.map((item) => item.label),
    datasets: [
      {
        label: principal.nome,
        data: principal.historico.map((item) => item.percentual),
        backgroundColor: principal.historico.map((item) => item.atingida ? '#10b981' : '#f59e0b'),
        borderRadius: 6,
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      max: 100,
      ticks: {
        callback: (value: number) => `${value}%`,
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
}

function resetForm() {
  editingId.value = null
  form.nome = ''
  form.descricao = ''
  form.tipo = 'VENDAS'
  form.metrica = 'VALOR'
  form.periodicidade = 'MENSAL'
  form.financeiroTipo = 'RECEITA'
  form.valorAlvo = ''
  form.dataInicio = new Date()
  form.dataFim = null
  form.ativo = true
}

function openCreate() {
  resetForm()
  openModal.value = true
}

function openEdit(meta: MetaResumo) {
  editingId.value = meta.id
  form.nome = meta.nome
  form.descricao = meta.descricao || ''
  form.tipo = meta.tipo
  form.metrica = meta.metrica
  form.periodicidade = meta.periodicidade
  form.financeiroTipo = meta.financeiroTipo || 'RECEITA'
  form.valorAlvo = String(meta.valorAlvo || '')
  form.dataInicio = new Date(meta.periodoAtual.inicio)
  form.dataFim = meta.periodicidade === 'PERSONALIZADO' ? new Date(meta.periodoAtual.fim) : null
  form.ativo = meta.ativo
  openModal.value = true
}

async function loadMetas(showFeedback = false) {
  try {
    loading.value = true
    const response = await MetasRepository.listar()
    metas.value = response.data || []
    if (showFeedback) toast.info('Metas atualizadas.')
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao carregar metas.')
    metas.value = []
  } finally {
    loading.value = false
  }
}

async function salvarMeta() {
  const valorAlvo = Number(String(form.valorAlvo).replace(',', '.'))
  if (!form.nome.trim()) return toast.error('Informe o nome da meta.')
  if (!valorAlvo || valorAlvo <= 0) return toast.error('Informe um alvo maior que zero.')
  if (form.periodicidade === 'PERSONALIZADO' && !form.dataFim) return toast.error('Informe a data final da meta.')

  try {
    const payload: MetaPayload = {
      id: editingId.value,
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      tipo: form.tipo,
      metrica: form.metrica,
      periodicidade: form.periodicidade,
      valorAlvo,
      dataInicio: form.dataInicio.toISOString(),
      dataFim: form.dataFim ? form.dataFim.toISOString() : null,
      financeiroTipo: form.tipo === 'FINANCEIRO' ? form.financeiroTipo : null,
      ativo: form.ativo,
    }

    const response = await MetasRepository.salvar(payload)
    toast.success(response.message || 'Meta salva com sucesso.')
    openModal.value = false
    await loadMetas()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao salvar meta.')
  }
}

async function excluirMeta(meta: MetaResumo) {
  const confirm = await useConfirm().confirm({
    title: 'Excluir meta',
    message: `Deseja excluir a meta "${meta.nome}"?`,
    confirmText: 'Sim, excluir',
  })
  if (!confirm) return

  try {
    const response = await MetasRepository.excluir(meta.id)
    toast.success(response.message || 'Meta excluída com sucesso.')
    await loadMetas()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao excluir meta.')
  }
}

function formatMetaValue(meta: Pick<MetaResumo, 'metrica'>, value: number) {
  return meta.metrica === 'QUANTIDADE' ? String(Math.round(value || 0)) : formatCurrencyBR(value || 0)
}

function getTipoLabel(meta: MetaResumo | typeof form) {
  if (meta.tipo === 'SERVICOS') return 'Serviços'
  if (meta.tipo === 'FINANCEIRO') return meta.financeiroTipo === 'DESPESA' ? 'Despesas' : 'Receitas'
  return 'Vendas'
}

function getTipoIcon(tipo: MetaResumo['tipo']) {
  if (tipo === 'SERVICOS') return Activity
  if (tipo === 'FINANCEIRO') return CircleDollarSign
  return Trophy
}

onMounted(() => loadMetas())
</script>

<template>
  <div class="space-y-4 pb-20 md:pb-0">
    <div class="flex flex-col justify-between gap-3 md:flex-row md:items-center">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Target class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Metas
        </h2>
        <p class="text-sm text-muted-foreground">Acompanhe alvos de vendas, serviços e financeiro por período.</p>
      </div>
      <div class="hidden items-center gap-2 md:flex">
        <Button variant="outline" @click="loadMetas(true)">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </Button>
        <Button v-if="canManage" @click="openCreate">
          <Plus class="h-4 w-4" />
          Nova meta
        </Button>
      </div>
    </div>

    <section class="grid gap-4 md:grid-cols-3">
      <Card class="border-border/70 shadow-sm">
        <CardHeader class="pb-2">
          <CardDescription>Metas ativas</CardDescription>
          <CardTitle class="text-2xl">{{ metasAtivas.length }}</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">Monitoradas no período atual.</CardContent>
      </Card>
      <Card class="border-border/70 shadow-sm">
        <CardHeader class="pb-2">
          <CardDescription>Batidas agora</CardDescription>
          <CardTitle class="text-2xl text-emerald-600">{{ metasBatidas }}</CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">Metas com 100% ou mais.</CardContent>
      </Card>
      <Card class="border-border/70 shadow-sm">
        <CardHeader class="pb-2">
          <CardDescription>Progresso médio</CardDescription>
          <CardTitle class="text-2xl">{{ progressoMedio.toFixed(1) }}%</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="h-2 rounded-full bg-muted">
            <div class="h-2 rounded-full bg-primary transition-all" :style="{ width: `${Math.min(progressoMedio, 100)}%` }" />
          </div>
        </CardContent>
      </Card>
    </section>

    <div class="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <Card class="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <BarChart3 class="h-5 w-5 text-primary" />
            Histórico da meta em destaque
          </CardTitle>
          <CardDescription>Meses/períodos em verde foram batidos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="metas.length" class="h-[280px]">
            <BarChart :data="chartData" :options="chartOptions" />
          </div>
          <div v-else class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            Nenhuma meta cadastrada.
          </div>
        </CardContent>
      </Card>

      <Card class="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-lg">
            <Flag class="h-5 w-5 text-primary" />
            Leitura rápida
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-3">
          <div
            v-for="meta in metas.slice(0, 4)"
            :key="meta.id"
            class="rounded-xl border p-3"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <p class="text-sm font-medium">{{ meta.nome }}</p>
                <p class="text-xs text-muted-foreground">{{ meta.periodoAtual.label }} • {{ getTipoLabel(meta) }}</p>
              </div>
              <Badge :class="meta.atingida ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-100 text-amber-700 hover:bg-amber-100'">
                {{ meta.atingida ? 'Batida' : `${meta.percentual}%` }}
              </Badge>
            </div>
            <div class="mt-3 h-2 rounded-full bg-muted">
              <div class="h-2 rounded-full" :class="meta.atingida ? 'bg-emerald-500' : 'bg-amber-500'" :style="{ width: `${Math.min(meta.percentual, 100)}%` }" />
            </div>
          </div>
          <div v-if="!metas.length" class="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Crie uma meta para iniciar o acompanhamento.
          </div>
        </CardContent>
      </Card>
    </div>

    <section class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Card
        v-for="meta in metas"
        :key="meta.id"
        class="border-border/70 shadow-sm"
      >
        <CardHeader class="pb-3">
          <div class="flex items-start justify-between gap-3">
            <div class="flex items-start gap-3">
              <span class="rounded-xl bg-primary/10 p-2 text-primary">
                <component :is="getTipoIcon(meta.tipo)" class="h-5 w-5" />
              </span>
              <div>
                <CardTitle class="text-base">{{ meta.nome }}</CardTitle>
                <CardDescription>{{ getTipoLabel(meta) }} • {{ meta.periodicidade }}</CardDescription>
              </div>
            </div>
            <Badge variant="outline">{{ meta.ativo ? 'Ativa' : 'Inativa' }}</Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div>
            <div class="mb-2 flex items-center justify-between text-sm">
              <span class="text-muted-foreground">{{ formatMetaValue(meta, meta.valorAtual) }}</span>
              <span class="font-medium">{{ formatMetaValue(meta, meta.valorAlvo) }}</span>
            </div>
            <div class="h-2.5 rounded-full bg-muted">
              <div class="h-2.5 rounded-full" :class="meta.atingida ? 'bg-emerald-500' : 'bg-primary'" :style="{ width: `${Math.min(meta.percentual, 100)}%` }" />
            </div>
            <p class="mt-2 text-xs text-muted-foreground">
              {{ meta.percentual }}% concluído • falta {{ formatMetaValue(meta, meta.restante) }}
            </p>
          </div>
          <div class="flex items-center justify-between text-xs text-muted-foreground">
            <span class="flex items-center gap-1">
              <CalendarDays class="h-3.5 w-3.5" />
              {{ formatDateToPtBR(meta.periodoAtual.inicio) }} - {{ formatDateToPtBR(meta.periodoAtual.fim) }}
            </span>
            <span>{{ meta.historico.filter((item) => item.atingida).length }} período(s) batido(s)</span>
          </div>
          <div v-if="canManage" class="flex justify-end gap-2">
            <Button variant="outline" size="sm" @click="openEdit(meta)">
              <Edit class="h-4 w-4" />
              Editar
            </Button>
            <Button variant="outline" size="sm" class="text-rose-600 hover:text-rose-700" @click="excluirMeta(meta)">
              <Trash2 class="h-4 w-4" />
              Excluir
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>

    <ModalView
      v-model:open="openModal"
      size="lg"
      :title="editingId ? 'Editar meta' : 'Nova meta'"
      description="Configure o alvo e o período de acompanhamento."
    >
      <form class="grid gap-3 px-4" @submit.prevent="salvarMeta">
        <div class="grid gap-3 md:grid-cols-2">
          <div class="md:col-span-2">
            <Label>Nome</Label>
            <Input v-model="form.nome" required placeholder="Ex.: Meta mensal de vendas" />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select v-model="form.tipo">
              <SelectTrigger><SelectValue placeholder="Tipo" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VENDAS">Vendas</SelectItem>
                <SelectItem value="SERVICOS">Serviços</SelectItem>
                <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Métrica</Label>
            <Select v-model="form.metrica">
              <SelectTrigger><SelectValue placeholder="Métrica" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="VALOR">Valor</SelectItem>
                <SelectItem value="QUANTIDADE">Quantidade</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div v-if="form.tipo === 'FINANCEIRO'">
            <Label>Financeiro</Label>
            <Select v-model="form.financeiroTipo">
              <SelectTrigger><SelectValue placeholder="Financeiro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RECEITA">Receitas recebidas</SelectItem>
                <SelectItem value="DESPESA">Despesas pagas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Periodicidade</Label>
            <Select v-model="form.periodicidade">
              <SelectTrigger><SelectValue placeholder="Periodicidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MENSAL">Mensal</SelectItem>
                <SelectItem value="TRIMESTRAL">Trimestral</SelectItem>
                <SelectItem value="ANUAL">Anual</SelectItem>
                <SelectItem value="PERSONALIZADO">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Alvo</Label>
            <Input v-model="form.valorAlvo" type="number" min="0" step="0.01" required placeholder="4000" />
          </div>
          <div>
            <Label>Início</Label>
            <Calendarpicker v-model="form.dataInicio" :teleport="true" required />
          </div>
          <div v-if="form.periodicidade === 'PERSONALIZADO'">
            <Label>Fim</Label>
            <Calendarpicker v-model="form.dataFim" :teleport="true" required />
          </div>
          <div class="md:col-span-2">
            <Label>Descrição</Label>
            <Textarea v-model="form.descricao" placeholder="Opcional" />
          </div>
          <label class="flex items-center justify-between rounded-xl border p-3 md:col-span-2">
            <span>
              <span class="block text-sm font-medium">Meta ativa</span>
              <span class="text-xs text-muted-foreground">Metas inativas ficam salvas, mas saem do slider da dashboard.</span>
            </span>
            <Switch v-model="form.ativo" />
          </label>
        </div>
        <div class="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" @click="openModal = false">Cancelar</Button>
          <Button type="submit" class="text-white">Salvar</Button>
        </div>
      </form>
    </ModalView>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="loadMetas(true)">
        <RefreshCw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
      <button v-if="canManage" type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="openCreate">
        <Plus class="h-5 w-5" />
        <span class="text-xs">Nova</span>
      </button>
    </MobileBottomBar>
  </div>
</template>
