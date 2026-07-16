<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
  Ban,
  CalendarClock,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Power,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  UserCog,
} from 'lucide-vue-next'

import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useConfirm } from '@/composables/useConfirm'
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
const confirm = useConfirm()
const loading = ref(false)
const appsLoading = ref(false)
const appSavingId = ref<number | null>(null)
const status = ref<'ATIVO' | 'INATIVO' | 'BLOQUEADO'>('ATIVO')
const vencimento = ref<Date | null>(new Date())
const apps = ref<AssinanteAdminAppItem[]>([])
const iaLimiteTokensMensal = ref<number | null>(null)
const iaUsoMes = ref<{ totalTokens: number; limite: number | null; restante: number | null; custoEstimado: number } | null>(null)

const dados = ref({
  nome: '',
  nomeFantasia: '',
  email: '',
  telefone: '',
  documento: '',
})
const valorBasePlano = ref<number>(0)

// valor total = base + apps ativos (para exibir o efeito da mensalidade base)
const valorAppsAtivos = computed(() =>
  apps.value.filter((app) => app.ativo).reduce((total, app) => total + Number(app.preco || 0), 0),
)
const valorTotalEstimado = computed(() => Number(valorBasePlano.value || 0) + valorAppsAtivos.value)

const novaSenhaRoot = ref('')
const showSenhaRoot = ref(false)
const resettingSenha = ref(false)
const rootResetInfo = ref<{ email: string; nome: string; totalUsuariosRoot: number } | null>(null)

const title = computed(() => (props.conta ? `Gerenciar ${props.conta.nome}` : 'Gerenciar conta'))

watch(
  () => props.conta,
  (value) => {
    novaSenhaRoot.value = ''
    showSenhaRoot.value = false
    rootResetInfo.value = null
    if (!value) return
    status.value = (value.status as 'ATIVO' | 'INATIVO' | 'BLOQUEADO') || 'ATIVO'
    vencimento.value = value.vencimento ? new Date(value.vencimento) : new Date()
    dados.value = {
      nome: value.nome || '',
      nomeFantasia: value.nomeFantasia || '',
      email: value.email || '',
      telefone: value.telefone || '',
      documento: value.documento || '',
    }
    valorBasePlano.value = Number(value.valorBasePlano ?? value.valor ?? 0)
  },
  { immediate: true },
)

function gerarSenhaRoot() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let senha = ''
  for (let i = 0; i < 10; i++) senha += chars[Math.floor(Math.random() * chars.length)]
  novaSenhaRoot.value = senha
  showSenhaRoot.value = true
}

async function resetarSenhaRoot() {
  if (!props.conta?.id) return

  const senha = novaSenhaRoot.value.trim()
  if (senha.length < 6) {
    toast.error('A nova senha precisa de ao menos 6 caracteres')
    return
  }

  const confirmed = await confirm.confirm({
    title: 'Resetar senha do root',
    message: `Isso vai substituir a senha do usuário root da conta "${props.conta.nome}", permitindo recuperar o acesso do cliente. Deseja continuar?`,
    confirmText: 'Sim, redefinir senha',
    colorButton: 'danger',
  })
  if (!confirmed) return

  try {
    resettingSenha.value = true
    const response = await ContaRepository.resetarSenhaRootAdmin(props.conta.id, senha)
    rootResetInfo.value = response.data ?? null
    toast.success(response.message || 'Senha do root redefinida com sucesso')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao redefinir a senha do root')
  } finally {
    resettingSenha.value = false
  }
}

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
    iaLimiteTokensMensal.value = response.resumo?.iaLimiteTokensMensal ?? null
    iaUsoMes.value = response.resumo?.iaUsoMes ?? null
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

  if (!dados.value.nome.trim()) {
    toast.error('Informe o nome do assinante')
    return
  }
  if (!/^\S+@\S+\.\S+$/.test(dados.value.email.trim())) {
    toast.error('Informe um e-mail válido')
    return
  }

  try {
    loading.value = true
    await ContaRepository.gerenciarAssinante(props.conta.id, {
      status: status.value,
      vencimento: vencimento.value.toISOString(),
      nome: dados.value.nome.trim(),
      nomeFantasia: dados.value.nomeFantasia.trim() || null,
      email: dados.value.email.trim(),
      telefone: dados.value.telefone.trim() || null,
      documento: dados.value.documento.trim() || null,
      valorBasePlano: Number(valorBasePlano.value || 0),
      iaLimiteTokensMensal:
        iaLimiteTokensMensal.value != null && Number(iaLimiteTokensMensal.value) > 0
          ? Number(iaLimiteTokensMensal.value)
          : null,
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
    size="4xl"
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
          <CardContent class="space-y-3 p-4">
            <div class="text-sm font-medium text-foreground">Dados do assinante</div>
            <div class="grid gap-3 md:grid-cols-2">
              <div class="space-y-1">
                <Label>Nome</Label>
                <Input v-model="dados.nome" placeholder="Nome da conta" />
              </div>
              <div class="space-y-1">
                <Label>Nome fantasia</Label>
                <Input v-model="dados.nomeFantasia" placeholder="Opcional" />
              </div>
              <div class="space-y-1">
                <Label>E-mail</Label>
                <Input v-model="dados.email" type="email" placeholder="email@cliente.com" />
              </div>
              <div class="space-y-1">
                <Label>Telefone</Label>
                <Input v-model="dados.telefone" placeholder="Opcional" />
              </div>
              <div class="space-y-1 md:col-span-2">
                <Label>Documento (CPF/CNPJ)</Label>
                <Input v-model="dados.documento" placeholder="Opcional" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
          <CardContent class="space-y-3 p-4">
            <div class="text-sm font-medium text-foreground">Mensalidade</div>
            <div class="space-y-1">
              <Label>Valor base do plano (R$)</Label>
              <Input v-model.number="valorBasePlano" type="number" min="0" step="0.01" />
              <p class="text-xs text-muted-foreground">
                Este é o valor base cobrado do cliente. O total soma os apps ativos.
              </p>
            </div>
            <div class="rounded-lg border border-border/70 bg-background/70 p-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Base</span>
                <span class="font-medium">{{ formatCurrencyBR(Number(valorBasePlano || 0)) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Apps ativos</span>
                <span class="font-medium">{{ formatCurrencyBR(valorAppsAtivos) }}</span>
              </div>
              <div class="mt-1 flex items-center justify-between border-t border-border/70 pt-1">
                <span class="font-medium text-foreground">Total estimado / mês</span>
                <span class="font-semibold text-primary">{{ formatCurrencyBR(valorTotalEstimado) }}</span>
              </div>
              <p v-if="Number(conta?.creditoIndicacao || 0) > 0" class="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                Crédito de indicação: {{ formatCurrencyBR(Number(conta?.creditoIndicacao || 0)) }} (abate da próxima mensalidade)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
        <CardContent class="space-y-3 p-4">
          <div class="flex items-center gap-2 text-sm font-medium text-foreground">
            <Sparkles class="h-4 w-4 text-primary" /> Limite de IA (tokens/mês)
          </div>
          <div class="grid gap-3 md:grid-cols-2">
            <div class="space-y-1">
              <Label>Limite mensal desta conta</Label>
              <Input v-model.number="iaLimiteTokensMensal" type="number" min="0" placeholder="Vazio = usa o padrão global" />
              <p class="text-xs text-muted-foreground">Vazio ou 0 = usa o limite padrão definido no Core IA. Salvo junto com "Salvar controle".</p>
            </div>
            <div v-if="iaUsoMes" class="rounded-lg border border-border/70 bg-background/70 p-3 text-sm">
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Consumo do mês</span>
                <span class="font-medium">{{ iaUsoMes.totalTokens.toLocaleString('pt-BR') }} tokens</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Custo estimado</span>
                <span class="font-medium">{{ iaUsoMes.custoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-muted-foreground">Limite efetivo</span>
                <span class="font-medium">{{ iaUsoMes.limite == null ? 'Ilimitado' : iaUsoMes.limite.toLocaleString('pt-BR') }}</span>
              </div>
              <div v-if="iaUsoMes.restante != null" class="mt-1 flex items-center justify-between border-t border-border/70 pt-1">
                <span class="text-muted-foreground">Restante</span>
                <span class="font-semibold" :class="iaUsoMes.restante > 0 ? 'text-primary' : 'text-danger'">
                  {{ iaUsoMes.restante.toLocaleString('pt-BR') }}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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

      <Card class="border-amber-300/60 bg-amber-50/50 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/10">
        <CardContent class="space-y-3 p-4">
          <div class="flex items-start gap-2">
            <KeyRound class="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-400" />
            <div>
              <div class="text-sm font-medium text-foreground">Recuperar acesso do cliente</div>
              <div class="text-xs text-muted-foreground">
                Redefine a senha do usuário root desta conta. Use quando o cliente perdeu o acesso.
                Informe a nova senha ao cliente com segurança.
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div class="relative flex-1">
              <Input
                v-model="novaSenhaRoot"
                :type="showSenhaRoot ? 'text' : 'password'"
                placeholder="Nova senha do root (mín. 6 caracteres)"
                autocomplete="new-password"
                class="pr-10"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                :aria-label="showSenhaRoot ? 'Ocultar senha' : 'Mostrar senha'"
                @click="showSenhaRoot = !showSenhaRoot"
              >
                <Eye v-if="showSenhaRoot" class="h-4 w-4" />
                <EyeOff v-else class="h-4 w-4" />
              </button>
            </div>
            <Button type="button" variant="outline" class="gap-2" @click="gerarSenhaRoot">
              <RefreshCw class="h-4 w-4" />
              Gerar
            </Button>
            <Button
              type="button"
              class="gap-2 bg-amber-600 text-white hover:bg-amber-600/90"
              :disabled="resettingSenha || !conta?.id"
              @click="resetarSenhaRoot"
            >
              <LoaderCircle v-if="resettingSenha" class="h-4 w-4 animate-spin" />
              <KeyRound v-else class="h-4 w-4" />
              {{ resettingSenha ? 'Redefinindo...' : 'Resetar senha do root' }}
            </Button>
          </div>

          <div
            v-if="rootResetInfo"
            class="rounded-lg border border-emerald-300/60 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-300"
          >
            Senha redefinida para <span class="font-medium">{{ rootResetInfo.nome }}</span>.
            O cliente deve entrar com o e-mail <span class="font-medium">{{ rootResetInfo.email }}</span> e a nova senha.
            <span v-if="rootResetInfo.totalUsuariosRoot > 1">
              ({{ rootResetInfo.totalUsuariosRoot }} usuários root foram atualizados.)
            </span>
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
