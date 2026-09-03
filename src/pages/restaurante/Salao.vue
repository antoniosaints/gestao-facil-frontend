<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import PedidoManualDialog from './PedidoManualDialog.vue'
import { useSocketEvent } from '@/composables/useSocketEvent'
import { type ComandaOperacaoItem } from '@/repositories/comanda-operacao-repository'
import {
  RestauranteRepository,
  type RestauranteMesa,
  type RestauranteMesaStatus,
} from '@/repositories/restaurante-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import {
  BrushCleaning,
  CircleCheck,
  CircleDollarSign,
  ConciergeBell,
  Plus,
  ReceiptText,
  RefreshCw,
  Search,
  Send,
  Utensils,
} from 'lucide-vue-next'
import { useComandasStore } from '@/stores/comandas/useComandas'
import { useUiStore } from '@/stores/ui/uiStore'

const toast = useToast()
const uiStore = useUiStore()
const comandasStore = useComandasStore()
const canOperate = computed(() => uiStore.hasRestaurantCapability('SALAO_OPERAR'))
const canConfigure = computed(() => uiStore.hasRestaurantCapability('SALAO_CONFIGURAR'))
const loading = ref(true)
const saving = ref(false)
const mesas = ref<RestauranteMesa[]>([])
const busca = ref('')
const filtro = ref('TODAS')
const mesaModal = ref(false)
const abrirModal = ref(false)
const pedidoModal = ref(false)
const mesaAtual = ref<RestauranteMesa | null>(null)
const mesaForm = ref({ nome: '', ativa: true, version: undefined as number | undefined })
const abertura = ref({ pessoas: 1, clienteNome: '', observacao: '' })

const statusLabel: Record<RestauranteMesaStatus, string> = {
  LIVRE: 'Livre',
  OCUPADA: 'Ocupada',
  AGUARDANDO_CONTA: 'Aguardando conta',
  LIMPEZA: 'Em limpeza',
}
const statusClass: Record<RestauranteMesaStatus, string> = {
  LIVRE: 'border-emerald-500/40 bg-emerald-500/5',
  OCUPADA: 'border-blue-500/40 bg-blue-500/5',
  AGUARDANDO_CONTA: 'border-amber-500/40 bg-amber-500/5',
  LIMPEZA: 'border-violet-500/40 bg-violet-500/5',
}

function temComandaPendente(mesa: RestauranteMesa) {
  return (
    mesa.sessoes[0]?.comandas.some((item) => item.ComandaOperacao.status === 'PENDENTE') || false
  )
}

function contaFaturada(mesa: RestauranteMesa) {
  const comandas = mesa.sessoes[0]?.comandas || []
  return (
    mesa.status === 'AGUARDANDO_CONTA' &&
    comandas.length > 0 &&
    comandas.every((item) => ['FATURADA', 'CANCELADA'].includes(item.ComandaOperacao.status))
  )
}

function statusMesaLabel(mesa: RestauranteMesa) {
  return contaFaturada(mesa) ? 'Conta paga' : statusLabel[mesa.status]
}

function statusMesaClass(mesa: RestauranteMesa) {
  return contaFaturada(mesa) ? statusClass.LIVRE : statusClass[mesa.status]
}

const filtradas = computed(() => {
  const termo = busca.value.trim().toLocaleLowerCase('pt-BR')
  return mesas.value.filter(
    (mesa) =>
      (filtro.value === 'TODAS' || mesa.status === filtro.value) &&
      (!termo || mesa.nome.toLocaleLowerCase('pt-BR').includes(termo)),
  )
})
const sessaoAtual = computed(() => mesaAtual.value?.sessoes[0])
const itensComandaEmAberto = computed(() =>
  (comandasStore.selectedComanda?.itens || []).filter((item) => !item.pagamentoId),
)
const totalComandaSelecionado = computed(() =>
  itensComandaEmAberto.value
    .filter((item) => comandasStore.faturarForm.itemIds.includes(item.id))
    .reduce((total, item) => total + Number(item.subtotal || 0), 0),
)

async function carregar(feedback = false) {
  try {
    loading.value = true
    mesas.value = await RestauranteRepository.mesas()
    if (feedback) toast.info('Salão atualizado')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar o salão.')
  } finally {
    loading.value = false
  }
}

function novaMesa(mesa?: RestauranteMesa) {
  mesaAtual.value = mesa || null
  mesaForm.value = { nome: mesa?.nome || '', ativa: mesa?.ativa ?? true, version: mesa?.version }
  mesaModal.value = true
}

async function salvarMesa() {
  if (!mesaForm.value.nome.trim()) return
  try {
    saving.value = true
    await RestauranteRepository.salvarMesa(mesaForm.value, mesaAtual.value?.id)
    mesaModal.value = false
    toast.success('Mesa salva')
    await carregar()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar a mesa.')
  } finally {
    saving.value = false
  }
}

function prepararAbertura(mesa: RestauranteMesa) {
  mesaAtual.value = mesa
  abertura.value = { pessoas: 1, clienteNome: '', observacao: '' }
  abrirModal.value = true
}

async function abrirMesa() {
  if (!mesaAtual.value) return
  try {
    saving.value = true
    await RestauranteRepository.abrirMesa(mesaAtual.value.id, abertura.value)
    abrirModal.value = false
    toast.success('Atendimento aberto')
    await carregar()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível abrir a mesa.')
  } finally {
    saving.value = false
  }
}

function prepararPedido(mesa: RestauranteMesa) {
  mesaAtual.value = mesa
  pedidoModal.value = true
}

async function acaoMesa(mesa: RestauranteMesa, action: 'conta' | 'liberar' | 'limpeza') {
  try {
    if (action === 'conta') await RestauranteRepository.solicitarContaMesa(mesa.id)
    if (action === 'liberar') await RestauranteRepository.liberarMesa(mesa.id)
    if (action === 'limpeza') await RestauranteRepository.finalizarLimpezaMesa(mesa.id)
    toast.success(
      action === 'conta'
        ? 'Conta solicitada'
        : action === 'limpeza'
          ? 'Mesa liberada'
          : 'Atendimento encerrado',
    )
    await carregar()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível atualizar a mesa.')
  }
}

function alternarItemFaturamento(itemId: number, checked: unknown) {
  const selecionado =
    checked === true ||
    (checked &&
      typeof checked === 'object' &&
      'target' in checked &&
      Boolean((checked as Event).target && ((checked as Event).target as HTMLInputElement).checked))
  const itemIds = new Set(comandasStore.faturarForm.itemIds)
  if (selecionado) itemIds.add(itemId)
  else itemIds.delete(itemId)
  comandasStore.faturarForm.itemIds = [...itemIds]
}

function selecionarTodosItensFaturamento() {
  comandasStore.faturarForm.itemIds = itensComandaEmAberto.value.map((item) => item.id)
}

function totalItemComanda(item: ComandaOperacaoItem) {
  return Number(item.subtotal || 0)
}

async function abrirFaturamentoMesa(mesa: RestauranteMesa) {
  const comanda = mesa.sessoes[0]?.comandas.find(
    (item) => item.ComandaOperacao.status === 'PENDENTE',
  )
  if (!comanda) {
    toast.info('Não há comanda pendente para faturar nesta mesa.')
    return
  }
  await comandasStore.openFaturar(comanda.comandaOperacaoId)
}

async function faturarComandaMesa() {
  if (!comandasStore.faturarForm.itemIds.length) {
    toast.warning('Selecione ao menos um item para faturar.')
    return
  }
  await comandasStore.faturar()
  await carregar()
}

function totalMesa(mesa: RestauranteMesa) {
  return Number(
    mesa.sessoes[0]?.comandas.reduce(
      (total, item) => total + Number(item.ComandaOperacao.total),
      0,
    ) || 0,
  )
}
function tempoAberta(mesa: RestauranteMesa) {
  const opened = mesa.sessoes[0]?.abertaAt
  if (!opened) return null
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(opened).getTime()) / 60000))
  return `${Math.floor(minutes / 60)}h ${minutes % 60}min`
}

useSocketEvent('restaurante:mesas', () => carregar())
useSocketEvent('restaurante:pedido', () => carregar())
onMounted(() => carregar())
</script>

<template>
  <section class="space-y-4">
    <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ConciergeBell class="h-6 w-6 text-primary" />Salão
        </h1>
        <p class="text-sm text-muted-foreground">
          Abra mesas, lance pedidos e acompanhe a conta em tempo real.
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" :disabled="loading" @click="carregar(true)">
          <RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />Atualizar </Button
        ><Button v-if="canConfigure" @click="novaMesa()">
          <Plus class="mr-2 h-4 w-4" />Nova mesa
        </Button>
      </div>
    </header>

    <div class="grid gap-3 sm:grid-cols-[1fr_220px]">
      <div class="relative">
        <Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input
          v-model="busca"
          class="pl-9"
          placeholder="Buscar mesa"
        />
      </div>
      <Select v-model="filtro">
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODAS">Todos os status</SelectItem>
          <SelectItem v-for="(label, key) in statusLabel" :key="key" :value="key">{{
            label
          }}</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Skeleton v-for="item in 8" :key="item" class="h-44 rounded-xl" />
    </div>
    <div v-else-if="!filtradas.length" class="rounded-xl border border-dashed p-10 text-center">
      <Utensils class="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
      <p class="font-medium">Nenhuma mesa encontrada</p>
      <p class="text-sm text-muted-foreground">
        Cadastre as mesas do salão para iniciar os atendimentos.
      </p>
    </div>
    <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card
        v-for="mesa in filtradas"
        :key="mesa.id"
        class="flex flex-col rounded-xl border-2"
        :class="statusMesaClass(mesa)"
      >
        <CardHeader class="p-4 pb-2">
          <div class="flex items-start justify-between gap-2">
            <div>
              <CardTitle class="text-base">{{ mesa.nome }}</CardTitle>
              <p v-if="tempoAberta(mesa)" class="mt-0.5 text-xs text-muted-foreground">
                {{ tempoAberta(mesa) }} · {{ mesa.sessoes[0]?.pessoas }} pessoa(s)
              </p>
            </div>
            <Badge
              variant="outline"
              class="text-[11px]"
              :class="
                contaFaturada(mesa)
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200'
                  : ''
              "
            >
              <CircleCheck v-if="contaFaturada(mesa)" class="mr-1 h-3 w-3" />{{
                statusMesaLabel(mesa)
              }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="flex-1 space-y-2 px-4 pb-3"
          ><template v-if="mesa.sessoes[0]">
            <div class="flex items-center justify-between rounded-lg bg-background/70 px-2.5 py-2">
              <span class="text-xs text-muted-foreground">Conta atual</span
              ><strong class="text-sm">{{ formatCurrencyBR(totalMesa(mesa)) }}</strong>
            </div>
            <div class="flex flex-wrap gap-x-2 text-[11px] text-muted-foreground">
              <span>{{ mesa.sessoes[0].pedidos.length }} pedido(s)</span
              ><span v-for="comanda in mesa.sessoes[0].comandas" :key="comanda.comandaOperacaoId"
                >#{{ comanda.ComandaOperacao.Uid }}</span
              >
            </div>
          </template>
          <p v-else class="text-xs text-muted-foreground">Disponível para atendimento.</p>
        </CardContent>
        <CardFooter
          v-if="canOperate || canConfigure"
          class="flex flex-wrap gap-1.5 border-t px-4 py-3"
          ><Button
            v-if="canOperate && mesa.status === 'LIVRE'"
            size="sm"
            class="flex-1"
            @click="prepararAbertura(mesa)"
          >
            <ConciergeBell class="mr-1.5 h-3.5 w-3.5" />Abrir </Button
          ><template v-else-if="canOperate && mesa.status === 'OCUPADA'"
            ><Button size="sm" class="flex-1" @click="prepararPedido(mesa)">
              <Send class="mr-1.5 h-3.5 w-3.5" />Pedido </Button
            ><Button size="sm" variant="outline" @click="acaoMesa(mesa, 'conta')">
              <ReceiptText class="mr-1.5 h-3.5 w-3.5" />Conta
            </Button></template
          ><template v-else-if="canOperate && mesa.status === 'AGUARDANDO_CONTA'"
            ><Button
              v-if="temComandaPendente(mesa)"
              size="sm"
              variant="outline"
              class="flex-1"
              @click="abrirFaturamentoMesa(mesa)"
            >
              <CircleDollarSign class="mr-1.5 h-3.5 w-3.5" />Faturar </Button
            ><Button
              size="sm"
              :class="{ 'flex-1': !temComandaPendente(mesa) }"
              @click="acaoMesa(mesa, 'liberar')"
            >
              {{ contaFaturada(mesa) ? 'Liberar mesa' : 'Liberar' }}
            </Button></template
          ><Button
            v-else-if="canOperate && mesa.status === 'LIMPEZA'"
            size="sm"
            class="flex-1"
            @click="acaoMesa(mesa, 'limpeza')"
          >
            <BrushCleaning class="mr-1.5 h-3.5 w-3.5" />Finalizar </Button
          ><Button v-if="canConfigure" variant="ghost" size="sm" @click="novaMesa(mesa)"
            >Editar</Button
          >
        </CardFooter>
      </Card>
    </div>

    <Dialog v-model:open="mesaModal">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{{ mesaAtual ? 'Editar mesa' : 'Nova mesa' }}</DialogTitle>
          <DialogDescription>Identificação exibida no mapa do salão.</DialogDescription>
        </DialogHeader>
        <div class="space-y-2">
          <Label>Nome</Label
          ><Input v-model="mesaForm.nome" placeholder="Ex.: Mesa 01" @keyup.enter="salvarMesa" />
        </div>
        <DialogFooter
          ><Button variant="outline" @click="mesaModal = false">Cancelar</Button
          ><Button :disabled="saving || !mesaForm.nome.trim()" @click="salvarMesa"
            >Salvar</Button
          ></DialogFooter
        >
      </DialogContent>
    </Dialog>

    <Dialog v-model:open="abrirModal">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir {{ mesaAtual?.nome }}</DialogTitle>
          <DialogDescription
            >Uma comanda principal será criada e vinculada ao atendimento.</DialogDescription
          >
        </DialogHeader>
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label>Pessoas</Label
            ><Input v-model.number="abertura.pessoas" type="number" min="1" max="99" />
          </div>
          <div class="space-y-2">
            <Label>Cliente (opcional)</Label><Input v-model="abertura.clienteNome" />
          </div>
          <div class="space-y-2 sm:col-span-2">
            <Label>Observação</Label><Textarea v-model="abertura.observacao" />
          </div>
        </div>
        <DialogFooter
          ><Button variant="outline" @click="abrirModal = false">Cancelar</Button
          ><Button :disabled="saving" @click="abrirMesa">Abrir atendimento</Button></DialogFooter
        >
      </DialogContent>
    </Dialog>

    <PedidoManualDialog
      v-model:open="pedidoModal"
      :sessao-mesa-id="sessaoAtual?.id"
      :mesa-nome="mesaAtual?.nome"
      @created="carregar()"
    />

    <ModalView
      v-model:open="comandasStore.openFaturarModal"
      title="Faturar comanda"
      description="Conclua a conta da mesa sem sair do salão."
      size="xl"
    >
      <form
        class="grid grid-cols-1 gap-4 px-4 pb-2 md:grid-cols-2"
        @submit.prevent="faturarComandaMesa"
      >
        <div class="space-y-3 md:col-span-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div class="text-sm font-medium">Itens para faturar</div>
              <div class="text-xs text-muted-foreground">
                Itens já faturados ficam fora desta seleção.
              </div>
            </div>
            <div class="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="selecionarTodosItensFaturamento"
                >Todos</Button
              >
              <Button
                type="button"
                variant="outline"
                size="sm"
                @click="comandasStore.faturarForm.itemIds = []"
                >Limpar</Button
              >
            </div>
          </div>

          <div class="overflow-hidden rounded-lg border border-border">
            <div v-if="!itensComandaEmAberto.length" class="p-3 text-sm text-muted-foreground">
              Nenhum item em aberto para faturar.
            </div>
            <label
              v-for="item in itensComandaEmAberto"
              v-else
              :key="item.id"
              class="flex cursor-pointer items-center gap-3 border-t border-border px-3 py-2 first:border-t-0"
            >
              <Checkbox
                :model-value="comandasStore.faturarForm.itemIds.includes(item.id)"
                @update:model-value="alternarItemFaturamento(item.id, $event)"
              />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-sm font-medium text-foreground">{{
                  item.nomeSnapshot
                }}</span>
                <span class="block text-xs text-muted-foreground"
                  >{{ Number(item.quantidade || 0) }} ×
                  {{ formatCurrencyBR(Number(item.valorUnitarioSnapshot || 0)) }}</span
                >
              </span>
              <span class="text-sm font-semibold text-foreground">{{
                formatCurrencyBR(totalItemComanda(item))
              }}</span>
            </label>
          </div>

          <div
            class="flex justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
          >
            <span class="text-muted-foreground">Total selecionado</span>
            <span class="font-semibold text-foreground">{{
              formatCurrencyBR(totalComandaSelecionado)
            }}</span>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">Pagamento</label>
          <Select v-model="comandasStore.faturarForm.metodo">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PIX">PIX</SelectItem>
              <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
              <SelectItem value="CARTAO">Cartão</SelectItem>
              <SelectItem value="BOLETO">Boleto</SelectItem>
              <SelectItem value="PROMISSORIA">Promissória</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label class="mb-1 block text-sm font-medium">Data</label>
          <Input v-model="comandasStore.faturarForm.dataPagamento" type="date" />
        </div>
        <div
          class="flex items-center justify-between rounded-lg border border-border bg-card p-3 md:col-span-2"
        >
          <div>
            <div class="text-sm font-medium">Lançar no financeiro</div>
            <div class="text-xs text-muted-foreground">
              Cria uma receita paga ao faturar a comanda.
            </div>
          </div>
          <Switch v-model="comandasStore.faturarForm.lancarFinanceiro" />
        </div>
        <div v-show="comandasStore.faturarForm.lancarFinanceiro">
          <label class="mb-1 block text-sm font-medium">Conta financeira</label>
          <Select2Ajax
            v-model="comandasStore.faturarForm.contaFinanceiraId"
            url="/lancamentos/contas/select2"
            :allow-clear="true"
            placeholder="Selecione a conta"
          />
        </div>
        <div v-show="comandasStore.faturarForm.lancarFinanceiro">
          <label class="mb-1 block text-sm font-medium">Categoria</label>
          <Select2Ajax
            v-model="comandasStore.faturarForm.categoriaFinanceiraId"
            url="/lancamentos/categorias/select2"
            :allow-clear="true"
            placeholder="Selecione a categoria"
          />
        </div>
        <div class="flex justify-end gap-2 md:col-span-2">
          <Button type="button" variant="secondary" @click="comandasStore.openFaturarModal = false"
            >Fechar</Button
          >
          <Button type="submit" :disabled="!comandasStore.faturarForm.itemIds.length"
            >Faturar selecionados</Button
          >
        </div>
      </form>
    </ModalView>
  </section>
</template>
