<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
  Ban,
  CalendarClock,
  CreditCard,
  LoaderCircle,
  Power,
  ShieldCheck,
  Sparkles,
  UserCog,
} from 'lucide-vue-next'

import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  ContaRepository,
  type AssinanteAdminAppItem,
  type ContaAssinanteAdmin,
} from '@/repositories/conta-repository'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'

const props = defineProps<{
  conta: ContaAssinanteAdmin | null
}>()

const emit = defineEmits<{
  saved: []
}>()

const open = defineModel<boolean>('open', { default: false })

const toast = useToast()
const loading = ref(false)
const appsLoading = ref(false)
const appSavingId = ref<number | null>(null)
const status = ref<'ATIVO' | 'INATIVO' | 'BLOQUEADO'>('ATIVO')
const vencimento = ref<Date | null>(new Date())
const apps = ref<AssinanteAdminAppItem[]>([])

const title = computed(() => (props.conta ? `Gerenciar ${props.conta.nome}` : 'Gerenciar conta'))

watch(
  () => props.conta,
  (value) => {
    if (!value) return
    status.value = (value.status as 'ATIVO' | 'INATIVO' | 'BLOQUEADO') || 'ATIVO'
    vencimento.value = value.vencimento ? new Date(value.vencimento) : new Date()
  },
  { immediate: true },
)

watch(
  () => [open.value, props.conta?.id] as const,
  async ([isOpen, contaId]) => {
    if (!isOpen || !contaId) return
    await loadApps(contaId)
  },
  { immediate: true },
)

function aplicarStatus(nextStatus: 'ATIVO' | 'INATIVO' | 'BLOQUEADO') {
  status.value = nextStatus
}

function getAppStatusMeta(app: AssinanteAdminAppItem) {
  if (app.ativo) {
    return {
      label: 'Ativo',
      className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    }
  }

  if (app.pendenteAtivacao || app.cobrancaPendenteAtual) {
    return {
      label: 'Pendente',
      className: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    }
  }

  if (app.cancelamentoAgendado) {
    return {
      label: 'Cancelamento agendado',
      className: 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
    }
  }

  return {
    label: 'Inativo',
    className: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  }
}

async function loadApps(contaId: number) {
  try {
    appsLoading.value = true
    const response = await ContaRepository.listarAppsAssinante(contaId)
    apps.value = response.data || []
  } catch (error: any) {
    console.error(error)
    apps.value = []
    toast.error(error?.response?.data?.message || 'Erro ao carregar os apps da conta')
  } finally {
    appsLoading.value = false
  }
}

async function toggleApp(app: AssinanteAdminAppItem, ativo: boolean) {
  if (!props.conta?.id) return

  try {
    appSavingId.value = app.id
    const response = await ContaRepository.alternarAppAssinante(props.conta.id, app.id, { ativo })
    toast.success(response.message || 'App atualizado com sucesso')
    await loadApps(props.conta.id)
    emit('saved')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao atualizar o app da conta')
  } finally {
    appSavingId.value = null
  }
}

async function submit() {
  if (!props.conta?.id) return

  if (!vencimento.value || Number.isNaN(vencimento.value.getTime())) {
    toast.error('Selecione uma data de vencimento válida')
    return
  }

  try {
    loading.value = true
    await ContaRepository.gerenciarAssinante(props.conta.id, {
      status: status.value,
      vencimento: vencimento.value.toISOString(),
    })
    toast.success('Conta atualizada com sucesso')
    open.value = false
    emit('saved')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao atualizar a conta')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="open"
    :title="title"
    description="Ajuste manualmente o status, o vencimento e os apps da conta selecionada."
    size="lg"
    :icon="UserCog"
  >
    <form class="grid gap-4 px-4" @submit.prevent="submit">
      <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
        <CardContent class="grid gap-3 p-4 md:grid-cols-2">
          <div class="rounded-lg border border-border/70 bg-background/70 p-3">
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Conta</div>
            <div class="mt-1 text-sm font-medium text-foreground">{{ conta?.nome || '-' }}</div>
            <div class="mt-1 text-xs text-muted-foreground">{{ conta?.email || '-' }}</div>
          </div>

          <div class="rounded-lg border border-border/70 bg-background/70 p-3">
            <div class="text-[11px] uppercase tracking-wide text-muted-foreground">Vencimento atual</div>
            <div class="mt-1 text-sm font-medium text-foreground">
              {{ conta?.vencimento ? formatDateToPtBR(conta.vencimento) : '-' }}
            </div>
            <div class="mt-1 text-xs text-muted-foreground">Status atual: {{ conta?.status || '-' }}</div>
          </div>
        </CardContent>
      </Card>

      <div class="grid gap-4 md:grid-cols-[1.2fr_1fr]">
        <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
          <CardContent class="space-y-4 p-4">
            <div class="space-y-2">
              <Label>Status da conta</Label>
              <Select v-model="status">
                <SelectTrigger class="w-full bg-background/80">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ATIVO">Ativo</SelectItem>
                  <SelectItem value="INATIVO">Inativo</SelectItem>
                  <SelectItem value="BLOQUEADO">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Vencimento</Label>
              <div class="rounded-lg">
                <Calendarpicker v-model="vencimento" :teleport="true" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
          <CardContent class="space-y-3 p-4">
            <div>
              <div class="text-sm font-medium text-foreground">Ações rápidas</div>
              <div class="text-xs text-muted-foreground">Use um atalho para preparar o status antes de salvar.</div>
            </div>

            <Button type="button" class="w-full justify-start gap-2 text-white" @click="aplicarStatus('ATIVO')">
              <ShieldCheck class="h-4 w-4" />
              Liberar manualmente
            </Button>

            <Button type="button" variant="outline" class="w-full justify-start gap-2" @click="aplicarStatus('INATIVO')">
              <CalendarClock class="h-4 w-4" />
              Desativar conta
            </Button>

            <Button type="button" variant="destructive" class="w-full justify-start gap-2" @click="aplicarStatus('BLOQUEADO')">
              <Ban class="h-4 w-4" />
              Bloquear conta
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
        <CardContent class="space-y-4 p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <div class="text-sm font-medium text-foreground">Apps da conta</div>
              <div class="text-xs text-muted-foreground">
                O superadmin pode ativar ou desativar manualmente os apps vinculados a esta conta.
              </div>
            </div>
            <Button
              v-if="conta?.id"
              type="button"
              variant="outline"
              :disabled="appsLoading"
              @click="loadApps(conta.id)"
            >
              {{ appsLoading ? 'Atualizando...' : 'Atualizar apps' }}
            </Button>
          </div>

          <div v-if="appsLoading" class="flex items-center justify-center rounded-xl border border-dashed p-6 text-sm text-muted-foreground">
            <LoaderCircle class="mr-2 h-4 w-4 animate-spin" />
            Carregando apps da conta...
          </div>

          <div v-else-if="!apps.length" class="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            Nenhum app encontrado para controle.
          </div>

          <div v-else class="grid gap-3 md:grid-cols-2">
            <article
              v-for="app in apps"
              :key="app.id"
              class="rounded-xl border border-border bg-background/70 p-4"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Sparkles class="h-4 w-4 text-primary" />
                    {{ app.nome }}
                  </div>
                  <div class="text-xs text-muted-foreground">{{ app.categoria }} • {{ formatCurrencyBR(app.preco) }}/mês</div>
                </div>
                <span class="rounded-full px-2 py-1 text-[11px] font-medium" :class="getAppStatusMeta(app).className">
                  {{ getAppStatusMeta(app).label }}
                </span>
              </div>

              <p class="mt-3 text-sm text-muted-foreground">
                {{ app.descricao || 'Sem descrição cadastrada.' }}
              </p>

              <div class="mt-3 space-y-1 text-xs text-muted-foreground">
                <div v-if="app.vigenciaAte">Vigência até {{ formatDateToPtBR(app.vigenciaAte) }}</div>
                <div v-if="app.cobrancaAtual">
                  Cobrança {{ app.cobrancaAtual.gateway }} • {{ app.cobrancaAtual.status }}
                </div>
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-2">
                <Button
                  v-if="!app.ativo"
                  type="button"
                  class="gap-2 text-white"
                  :disabled="appSavingId === app.id"
                  @click="toggleApp(app, true)"
                >
                  <LoaderCircle v-if="appSavingId === app.id" class="h-4 w-4 animate-spin" />
                  <Power v-else class="h-4 w-4" />
                  Ativar
                </Button>

                <Button
                  v-else
                  type="button"
                  variant="destructive"
                  class="gap-2"
                  :disabled="appSavingId === app.id"
                  @click="toggleApp(app, false)"
                >
                  <LoaderCircle v-if="appSavingId === app.id" class="h-4 w-4 animate-spin" />
                  <Power v-else class="h-4 w-4" />
                  Desativar
                </Button>

                <a
                  v-if="app.cobrancaAtual?.linkPagamento"
                  :href="app.cobrancaAtual.linkPagamento"
                  target="_blank"
                  rel="noreferrer"
                  class="inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-2"
                >
                  <CreditCard class="h-3.5 w-3.5" />
                  Abrir cobrança
                </a>
              </div>
            </article>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div class="flex justify-end gap-2 pb-1">
        <Button type="button" variant="secondary" :disabled="loading" @click="open = false">Fechar</Button>
        <Button type="submit" class="text-white" :disabled="loading">
          {{ loading ? 'Salvando...' : 'Salvar controle' }}
        </Button>
      </div>
    </form>
  </ModalView>
</template>
