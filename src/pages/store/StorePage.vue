<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { formatCurrencyBR } from '@/utils/formatters'
import { StoreRepository, type StoreModule, type StoreResumo } from '@/repositories/store-repository'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Bot,
  CircleDollarSign,
  Clock3,
  CreditCard,
  ExternalLink,
  LoaderCircle,
  MessageCircle,
  PackagePlus,
  PlusCircle,
  RefreshCcw,
  Search,
  ShieldAlert,
  ShoppingCart,
  Trash2,
} from 'lucide-vue-next'

const toast = useToast()
const confirm = useConfirm()

const modulos = ref<StoreModule[]>([])
const resumo = ref<StoreResumo | null>(null)
const moduloSelecionado = ref<StoreModule | null>(null)
const isDialogOpen = ref(false)
const loading = ref(false)
const actionLoadingId = ref<number | null>(null)
const search = ref('')
const statusFilter = ref<'TODOS' | 'ATIVOS' | 'PENDENTES' | 'DISPONIVEIS'>('TODOS')
const billingMode = ref<'PROPORCIONAL' | 'MENSAL'>('PROPORCIONAL')

const iconMap = {
  'core-ia': Bot,
  whatsapp: MessageCircle,
} as const

const cards = computed(() => {
  const query = search.value.trim().toLowerCase()

  return modulos.value.filter((modulo) => {
    const matchesSearch =
      !query ||
      [modulo.nome, modulo.categoria, modulo.descricao || '']
        .join(' ')
        .toLowerCase()
        .includes(query)

    const matchesStatus =
      statusFilter.value === 'TODOS' ||
      (statusFilter.value === 'ATIVOS' && modulo.ativo) ||
      (statusFilter.value === 'PENDENTES' && modulo.pendenteAtivacao) ||
      (statusFilter.value === 'DISPONIVEIS' && !modulo.ativo && !modulo.pendenteAtivacao && !modulo.cancelamentoAgendado)

    return matchesSearch && matchesStatus
  })
})

const totalAppsAtivos = computed(() => resumo.value?.totalAppsEmUso ?? modulos.value.filter((modulo) => modulo.ativo).length)
const totalAppsPendentes = computed(() => resumo.value?.totalAppsPendentes ?? modulos.value.filter((modulo) => modulo.pendenteAtivacao).length)
const valorAppsProximoCiclo = computed(() => resumo.value?.valorAppsProximoCiclo || 0)

function getIcon(modulo: StoreModule) {
  return iconMap[modulo.codigo as keyof typeof iconMap] || PackagePlus
}

function getDataFormatada(data?: string | Date | null) {
  if (!data) return 'Nao informado'
  return new Date(data).toLocaleDateString('pt-BR')
}

function getMonthlyValueAfterAction(modulo: StoreModule) {
  const mensalidadeAtual = resumo.value?.mensalidadeAtual || 0

  if (modulo.cancelamentoAgendado) {
    return mensalidadeAtual
  }

  if (modulo.ativo || modulo.pendenteAtivacao) {
    return Math.max(mensalidadeAtual - modulo.preco, 0)
  }

  return mensalidadeAtual + modulo.preco
}

function getImmediateChargeValue(modulo: StoreModule, mode = billingMode.value) {
  return mode === 'MENSAL' ? modulo.valorCobrancaMensal : modulo.valorCobrancaProporcional
}

function getImpactDescription(modulo: StoreModule) {
  if (modulo.cobrancaPendenteAtual && modulo.cobrancaAtual?.tipo === 'PROPORCIONAL') {
    return `Existe uma cobranca proporcional pendente para liberar o app ate ${getDataFormatada(modulo.cobrancaAtual.vencimento)}.`
  }

  if (modulo.cobrancaPendenteAtual && modulo.cobrancaAtual?.tipo === 'MENSAL') {
    return 'Existe uma cobranca da primeira mensalidade pendente para liberar o app neste ciclo.'
  }

  if (modulo.pendenteAtivacao) {
    return 'Este app ja esta reservado para a proxima mensalidade e sera liberado quando o pagamento do plano for confirmado.'
  }

  if (modulo.cancelamentoAgendado) {
    return `O app permanece disponivel ate ${getDataFormatada(modulo.vigenciaAte)}.`
  }

  if (modulo.ativo) {
    return 'Se cancelar agora, a remocao sera aplicada no proximo ciclo pago.'
  }

  if (modulo.ativacaoImediataDisponivel) {
    return 'Escolha entre cobranca proporcional ou primeira mensalidade completa para liberar o app ainda neste ciclo. Em ambos os casos, a proxima mensalidade ja vira cheia com este app.'
  }

  return 'Ao contratar, o valor sera somado na proxima mensalidade do plano e o app sera liberado somente apos esse pagamento.'
}

function setModuloSelecionado(id: number) {
  moduloSelecionado.value = modulos.value.find((item) => item.id === id) || null
}

function abrirDetalhes(modulo: StoreModule) {
  moduloSelecionado.value = modulo
  billingMode.value = modulo.ativacaoImediataDisponivel ? 'PROPORCIONAL' : 'MENSAL'
  isDialogOpen.value = true
}

function abrirCobranca(link?: string | null) {
  if (!link) return
  window.open(link, '_blank')
}

async function carregarModulos() {
  try {
    loading.value = true
    const response = await StoreRepository.listar()
    modulos.value = response.data
    resumo.value = response.resumo

    if (moduloSelecionado.value) {
      setModuloSelecionado(moduloSelecionado.value.id)
    }
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar os apps da loja.')
  } finally {
    loading.value = false
  }
}

async function adicionarAoPlano(modulo: StoreModule) {
  const valorAtual = resumo.value?.mensalidadeAtual || 0
  const proximoValor = getMonthlyValueAfterAction(modulo)
  const immediateCharge = getImmediateChargeValue(modulo)
  const immediateFlow = modulo.ativacaoImediataDisponivel

  const confirmed = await confirm.confirm({
    title: immediateFlow ? 'Adicionar app ao plano' : 'Reservar app para o proximo ciclo',
    message: immediateFlow
      ? `Ao confirmar, sera gerada uma cobranca ${billingMode.value === 'MENSAL' ? 'mensal' : 'proporcional'} de ${formatCurrencyBR(immediateCharge)} para liberar o app neste ciclo. A recorrencia da conta passara de ${formatCurrencyBR(valorAtual)} para ${formatCurrencyBR(proximoValor)} a partir da proxima mensalidade.`
      : `Ao confirmar, o valor de ${formatCurrencyBR(modulo.preco)} sera acrescido na proxima mensalidade. A recorrencia passara de ${formatCurrencyBR(valorAtual)} para ${formatCurrencyBR(proximoValor)} e o app sera liberado quando esse pagamento for confirmado.`,
    confirmText: immediateFlow ? 'Gerar cobranca do app' : 'Reservar app',
    cancelText: 'Voltar',
    colorButton: 'warning',
  })

  if (!confirmed) return

  try {
    actionLoadingId.value = modulo.id
    const response = await StoreRepository.ativar(modulo.id, billingMode.value)
    await carregarModulos()
    setModuloSelecionado(modulo.id)
    toast.success(response.message || 'App selecionado com sucesso.')

    if (response.data?.paymentLink) {
      abrirCobranca(response.data.paymentLink)
    }
  } catch (error: any) {
    console.error(error)
    toast.error(error.response?.data?.message || 'Erro ao adicionar o app ao plano.')
  } finally {
    actionLoadingId.value = null
  }
}

async function cancelarModulo(modulo: StoreModule) {
  const valorAtual = resumo.value?.mensalidadeAtual || 0
  const proximoValor = getMonthlyValueAfterAction(modulo)
  const isPending = modulo.pendenteAtivacao

  const confirmed = await confirm.confirm({
    title: isPending ? 'Cancelar solicitacao do app' : 'Agendar cancelamento do app',
    message: isPending
      ? `O app sera removido da proxima mensalidade e qualquer cobranca avulsa pendente sera encerrada. A recorrencia prevista volta de ${formatCurrencyBR(valorAtual)} para ${formatCurrencyBR(proximoValor)}.`
      : `Se a mensalidade atual ja foi paga, o cancelamento so sera aplicado no proximo pagamento. Na proxima cobranca, o valor previsto passa de ${formatCurrencyBR(valorAtual)} para ${formatCurrencyBR(proximoValor)}.`,
    confirmText: isPending ? 'Cancelar solicitacao' : 'Agendar cancelamento',
    cancelText: isPending ? 'Manter solicitacao' : 'Manter app',
    colorButton: 'danger',
  })

  if (!confirmed) return

  try {
    actionLoadingId.value = modulo.id
    const response = await StoreRepository.cancelar(modulo.id)
    await carregarModulos()
    setModuloSelecionado(modulo.id)
    toast.success(response.message || 'Atualizacao realizada com sucesso.')
  } catch (error: any) {
    console.error(error)
    toast.error(error.response?.data?.message || 'Erro ao atualizar o app.')
  } finally {
    actionLoadingId.value = null
  }
}

onMounted(carregarModulos)
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-gray-700 dark:text-gray-300">
          <PackagePlus class="h-6 w-6" :stroke-width="2.5" />
          App Store
        </h2>
        <p class="text-sm text-muted-foreground">
          Ative apps adicionais, escolha como liberar o uso no ciclo atual e acompanhe o impacto da recorrencia do plano.
        </p>
      </div>

      <div class="hidden items-center gap-2 md:flex">
        <Button variant="outline" class="gap-2" @click="carregarModulos">
          <RefreshCcw class="h-4 w-4" />
          Atualizar
        </Button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-2 md:grid-cols-12">
      <div class="flex items-center space-x-1 rounded-md border border-border bg-card pl-3 md:col-span-7">
        <Search class="h-4 w-4 text-muted-foreground" />
        <Input
          v-model="search"
          type="search"
          placeholder="Buscar app por nome, categoria ou descricao..."
          class="h-9 border-none shadow-none focus-visible:ring-0"
        />
      </div>

      <div class="md:col-span-3">
        <Select v-model="statusFilter">
          <SelectTrigger class="w-full bg-card">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todos</SelectItem>
            <SelectItem value="ATIVOS">Ativos</SelectItem>
            <SelectItem value="PENDENTES">Pendentes</SelectItem>
            <SelectItem value="DISPONIVEIS">Disponiveis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button variant="outline" class="gap-2 md:hidden" @click="carregarModulos">
        <RefreshCcw class="h-4 w-4" />
        Atualizar
      </Button>
    </div>

    <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card class="border-dashed">
        <CardHeader class="space-y-1 pb-2">
          <div class="text-sm text-muted-foreground">Plano base</div>
          <CardTitle class="text-2xl">
            {{ formatCurrencyBR(resumo?.valorBasePlano || 0) }}
          </CardTitle>
        </CardHeader>
      </Card>

      <Card class="border-dashed">
        <CardHeader class="space-y-1 pb-2">
          <div class="text-sm text-muted-foreground">Proxima mensalidade</div>
          <CardTitle class="text-2xl">
            {{ formatCurrencyBR(resumo?.mensalidadeAtual || 0) }}
          </CardTitle>
          <div class="text-xs text-muted-foreground">
            Apps no proximo ciclo: {{ formatCurrencyBR(valorAppsProximoCiclo) }}
          </div>
        </CardHeader>
      </Card>

      <Card class="border-dashed">
        <CardHeader class="space-y-1 pb-2">
          <div class="text-sm text-muted-foreground">Apps ativos</div>
          <CardTitle class="text-2xl">
            {{ totalAppsAtivos }}
          </CardTitle>
          <div class="text-xs text-muted-foreground">
            Proximo vencimento: {{ getDataFormatada(resumo?.proximoVencimento) }}
          </div>
        </CardHeader>
      </Card>

      <Card class="border-dashed">
        <CardHeader class="space-y-1 pb-2">
          <div class="text-sm text-muted-foreground">Pendentes</div>
          <CardTitle class="text-2xl">
            {{ totalAppsPendentes }}
          </CardTitle>
          <div class="text-xs text-muted-foreground">
            {{ resumo?.contaAtiva ? 'Assinatura ativa para liberacao imediata' : 'Aguardando proximo pagamento do plano' }}
          </div>
        </CardHeader>
      </Card>
    </div>

    <div v-if="loading" class="rounded-lg border border-border p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LoaderCircle class="h-6 w-6 animate-spin" />
          </EmptyMedia>
          <EmptyTitle>Carregando apps</EmptyTitle>
          <EmptyDescription>Buscando os apps e o resumo da recorrencia da conta.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <div v-else-if="!cards.length" class="rounded-lg border border-border p-6">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <PackagePlus class="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>Nenhum app encontrado</EmptyTitle>
          <EmptyDescription>Ajuste os filtros ou a busca para localizar outro app.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>

    <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      <Card
        v-for="modulo in cards"
        :key="modulo.id"
        class="group flex flex-col justify-between rounded-xl border bg-card p-0 transition-colors hover:border-primary/40"
      >
        <CardHeader class="space-y-4 p-4">
          <div class="flex items-start justify-between gap-3">
            <div class="rounded-xl bg-primary/10 p-3 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <component :is="getIcon(modulo)" class="h-5 w-5" />
            </div>

            <div class="flex flex-wrap justify-end gap-2">
              <Badge
                v-if="modulo.cobrancaPendenteAtual"
                variant="secondary"
                class="bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
              >
                Cobranca pendente
              </Badge>
              <Badge
                v-else-if="modulo.pendenteAtivacao"
                variant="secondary"
                class="bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
              >
                Proximo ciclo
              </Badge>
              <Badge
                v-else-if="modulo.cancelamentoAgendado"
                variant="secondary"
                class="bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
              >
                Cancelamento agendado
              </Badge>
              <Badge
                v-else-if="modulo.ativo"
                variant="secondary"
                class="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                Ativo
              </Badge>
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between gap-3">
              <CardTitle class="text-lg">{{ modulo.nome }}</CardTitle>
              <div class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                {{ formatCurrencyBR(modulo.preco) }}/mes
              </div>
            </div>

            <Badge variant="outline" class="w-fit px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {{ modulo.categoria }}
            </Badge>
          </div>
        </CardHeader>

        <CardContent class="space-y-3 px-4 pb-4 pt-0">
          <p class="text-sm leading-relaxed text-muted-foreground">
            {{ modulo.descricao }}
          </p>

          <div class="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span class="rounded-md bg-muted px-2 py-1">
              Proximo ciclo: {{ formatCurrencyBR(getMonthlyValueAfterAction(modulo)) }}
            </span>
            <span v-if="modulo.ativacaoImediataDisponivel && !modulo.ativo" class="rounded-md bg-muted px-2 py-1">
              Liberacao agora desde {{ formatCurrencyBR(modulo.valorCobrancaProporcional) }}
            </span>
            <span v-if="modulo.cobrancaAtual?.valor" class="rounded-md bg-muted px-2 py-1">
              Cobranca atual: {{ formatCurrencyBR(modulo.cobrancaAtual.valor) }}
            </span>
          </div>

          <div
            v-if="modulo.cobrancaPendenteAtual"
            class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
          >
            Pague a cobranca atual para liberar o app neste ciclo. Vencimento: {{ getDataFormatada(modulo.cobrancaAtual?.vencimento) }}.
          </div>

          <div
            v-else-if="modulo.pendenteAtivacao"
            class="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-300"
          >
            O acesso sera liberado no proximo pagamento do plano.
          </div>

          <div
            v-else-if="modulo.cancelamentoAgendado"
            class="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-700 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300"
          >
            Uso liberado ate {{ getDataFormatada(modulo.vigenciaAte) }}.
          </div>
        </CardContent>

        <CardFooter class="border-t bg-muted/5 px-4 py-4">
          <Button
            class="w-full gap-2"
            :variant="modulo.ativo || modulo.pendenteAtivacao ? 'outline' : 'default'"
            @click="abrirDetalhes(modulo)"
          >
            <PlusCircle v-if="!modulo.ativo && !modulo.pendenteAtivacao" class="h-4 w-4" />
            <Clock3 v-else-if="modulo.cancelamentoAgendado || modulo.pendenteAtivacao" class="h-4 w-4" />
            <ShoppingCart v-else class="h-4 w-4" />
            {{ modulo.ativo || modulo.pendenteAtivacao ? 'Gerenciar app' : 'Detalhes e assinar' }}
          </Button>
        </CardFooter>
      </Card>
    </div>

    <Dialog :open="isDialogOpen" @update:open="isDialogOpen = $event">
      <DialogContent class="sm:max-w-[620px]">
        <DialogHeader v-if="moduloSelecionado">
          <div class="mb-2 flex items-center gap-3">
            <div class="rounded-lg bg-primary/10 p-2 text-primary">
              <component :is="getIcon(moduloSelecionado)" class="h-6 w-6" />
            </div>
            <div class="space-y-1">
              <DialogTitle class="text-xl">{{ moduloSelecionado.nome }}</DialogTitle>
              <Badge variant="outline">{{ moduloSelecionado.categoria }}</Badge>
            </div>
          </div>
          <DialogDescription class="pt-2 text-base text-muted-foreground">
            {{ moduloSelecionado.detalhes || moduloSelecionado.descricao }}
          </DialogDescription>
        </DialogHeader>

        <div v-if="moduloSelecionado" class="space-y-4">
          <Alert v-if="moduloSelecionado.ativacaoImediataDisponivel && !moduloSelecionado.ativo && !moduloSelecionado.pendenteAtivacao">
            <CircleDollarSign class="h-4 w-4" />
            <AlertTitle>Liberacao imediata disponivel</AlertTitle>
            <AlertDescription>
              Como a assinatura do plano esta ativa, voce pode gerar uma cobranca avulsa para usar o app ainda neste ciclo. A proxima mensalidade ja vira com o valor cheio do plano e dos apps ativos.
            </AlertDescription>
          </Alert>

          <div class="rounded-xl border-2 border-dashed border-primary/20 bg-muted/40 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-sm font-medium">Impacto na assinatura</p>
                <p class="text-xs text-muted-foreground">
                  {{ getImpactDescription(moduloSelecionado) }}
                </p>
              </div>
              <div class="text-right">
                <div class="text-xl font-black text-primary">
                  {{ formatCurrencyBR(moduloSelecionado.preco) }}
                </div>
                <div class="text-xs text-muted-foreground">valor mensal do app</div>
              </div>
            </div>
          </div>

          <div
            v-if="moduloSelecionado.ativacaoImediataDisponivel && !moduloSelecionado.ativo && !moduloSelecionado.pendenteAtivacao"
            class="space-y-3 rounded-lg border border-border bg-card p-4"
          >
            <div>
              <p class="text-sm font-medium">Forma de cobranca para liberar agora</p>
              <p class="text-xs text-muted-foreground">
                O valor da recorrencia futura sera o mesmo nos dois casos: plano base + app na proxima mensalidade.
              </p>
            </div>

            <RadioGroup v-model="billingMode" class="grid gap-3 md:grid-cols-2">
              <label class="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40">
                <RadioGroupItem id="store-proporcional" value="PROPORCIONAL" class="mt-1" />
                <div class="space-y-1">
                  <div class="font-medium">Proporcional ate o vencimento</div>
                  <div class="text-sm text-muted-foreground">
                    {{ formatCurrencyBR(moduloSelecionado.valorCobrancaProporcional) }} para usar o app neste ciclo.
                  </div>
                </div>
              </label>

              <label class="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:border-primary/40">
                <RadioGroupItem id="store-mensal" value="MENSAL" class="mt-1" />
                <div class="space-y-1">
                  <div class="font-medium">Primeira mensalidade completa</div>
                  <div class="text-sm text-muted-foreground">
                    {{ formatCurrencyBR(moduloSelecionado.valorCobrancaMensal) }} para liberar o app neste ciclo.
                  </div>
                </div>
              </label>
            </RadioGroup>
          </div>

          <div class="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            <div class="flex items-center justify-between gap-3">
              <span>Proxima mensalidade atual</span>
              <span class="font-semibold text-foreground">
                {{ formatCurrencyBR(resumo?.mensalidadeAtual || 0) }}
              </span>
            </div>
            <div class="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <span>
                {{ moduloSelecionado.cancelamentoAgendado
                  ? 'Proximo ciclo ja ajustado'
                  : moduloSelecionado.ativo || moduloSelecionado.pendenteAtivacao
                    ? 'Proximo ciclo sem este app'
                    : 'Proximo ciclo com este app' }}
              </span>
              <span class="font-semibold text-foreground">
                {{ formatCurrencyBR(getMonthlyValueAfterAction(moduloSelecionado)) }}
              </span>
            </div>
            <div
              v-if="moduloSelecionado.ativacaoImediataDisponivel && !moduloSelecionado.ativo && !moduloSelecionado.pendenteAtivacao"
              class="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3"
            >
              <span>Liberacao neste ciclo</span>
              <span class="font-semibold text-foreground">
                {{ formatCurrencyBR(getImmediateChargeValue(moduloSelecionado)) }}
              </span>
            </div>
          </div>

          <div
            v-if="moduloSelecionado.cobrancaAtual?.linkPagamento"
            class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="space-y-1">
                <p class="font-medium">Cobranca do app pendente</p>
                <p>
                  {{ moduloSelecionado.cobrancaAtual?.tipo === 'MENSAL' ? 'Primeira mensalidade completa' : 'Valor proporcional' }}
                  de {{ formatCurrencyBR(moduloSelecionado.cobrancaAtual?.valor || 0) }} com vencimento em
                  {{ getDataFormatada(moduloSelecionado.cobrancaAtual?.vencimento) }}.
                </p>
              </div>

              <Button variant="outline" class="gap-2" @click="abrirCobranca(moduloSelecionado.cobrancaAtual?.linkPagamento)">
                <ExternalLink class="h-4 w-4" />
                Abrir cobranca
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter class="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" @click="isDialogOpen = false">Fechar</Button>

          <Button
            v-if="moduloSelecionado?.cobrancaAtual?.linkPagamento"
            variant="outline"
            class="gap-2"
            @click="abrirCobranca(moduloSelecionado.cobrancaAtual.linkPagamento)"
          >
            <CreditCard class="h-4 w-4" />
            Abrir cobranca
          </Button>

          <Button
            v-if="moduloSelecionado && !moduloSelecionado.ativo && !moduloSelecionado.pendenteAtivacao"
            class="gap-2 px-8"
            :disabled="actionLoadingId === moduloSelecionado.id"
            @click="adicionarAoPlano(moduloSelecionado)"
          >
            <LoaderCircle v-if="actionLoadingId === moduloSelecionado.id" class="h-4 w-4 animate-spin" />
            <ShoppingCart v-else class="h-4 w-4" />
            {{ moduloSelecionado.ativacaoImediataDisponivel ? 'Gerar cobranca do app' : 'Reservar app' }}
          </Button>

          <Button
            v-else-if="moduloSelecionado && moduloSelecionado.pendenteAtivacao"
            variant="destructive"
            class="gap-2 px-8"
            :disabled="actionLoadingId === moduloSelecionado.id"
            @click="cancelarModulo(moduloSelecionado)"
          >
            <LoaderCircle v-if="actionLoadingId === moduloSelecionado.id" class="h-4 w-4 animate-spin" />
            <Trash2 v-else class="h-4 w-4" />
            Cancelar solicitacao
          </Button>

          <Button
            v-else-if="moduloSelecionado && !moduloSelecionado.cancelamentoAgendado"
            variant="destructive"
            class="gap-2 px-8"
            :disabled="actionLoadingId === moduloSelecionado.id"
            @click="cancelarModulo(moduloSelecionado)"
          >
            <LoaderCircle v-if="actionLoadingId === moduloSelecionado.id" class="h-4 w-4 animate-spin" />
            <Trash2 v-else class="h-4 w-4" />
            Desvincular app
          </Button>

          <Button v-else disabled variant="outline" class="gap-2 px-8">
            <ShieldAlert class="h-4 w-4" />
            Cancelamento agendado
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
