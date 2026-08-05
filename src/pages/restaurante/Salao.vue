<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useSocketEvent } from '@/composables/useSocketEvent'
import {
  RestauranteRepository,
  type RestauranteCatalogoItem,
  type RestauranteMesa,
  type RestauranteMesaStatus,
} from '@/repositories/restaurante-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { BrushCleaning, CircleDollarSign, ConciergeBell, Plus, ReceiptText, RefreshCw, Search, Send, Utensils } from 'lucide-vue-next'

const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const mesas = ref<RestauranteMesa[]>([])
const catalogo = ref<RestauranteCatalogoItem[]>([])
const busca = ref('')
const filtro = ref('TODAS')
const mesaModal = ref(false)
const abrirModal = ref(false)
const pedidoModal = ref(false)
const mesaAtual = ref<RestauranteMesa | null>(null)
const mesaForm = ref({ nome: '', ativa: true, version: undefined as number | undefined })
const abertura = ref({ pessoas: 1, clienteNome: '', observacao: '' })
const itemSelecionadoId = ref('')
const quantidade = ref(1)
const selecoes = ref<number[]>([])
const itemObservacao = ref('')
const pedidoObservacao = ref('')
const carrinho = ref<Array<{ catalogoItemId: number; quantidade: number; selecaoIds: number[]; observacao?: string }>>([])

const statusLabel: Record<RestauranteMesaStatus, string> = {
  LIVRE: 'Livre', OCUPADA: 'Ocupada', AGUARDANDO_CONTA: 'Aguardando conta', LIMPEZA: 'Em limpeza',
}
const statusClass: Record<RestauranteMesaStatus, string> = {
  LIVRE: 'border-emerald-500/40 bg-emerald-500/5',
  OCUPADA: 'border-blue-500/40 bg-blue-500/5',
  AGUARDANDO_CONTA: 'border-amber-500/40 bg-amber-500/5',
  LIMPEZA: 'border-violet-500/40 bg-violet-500/5',
}

const filtradas = computed(() => {
  const termo = busca.value.trim().toLocaleLowerCase('pt-BR')
  return mesas.value.filter((mesa) =>
    (filtro.value === 'TODAS' || mesa.status === filtro.value) && (!termo || mesa.nome.toLocaleLowerCase('pt-BR').includes(termo)),
  )
})
const itemSelecionado = computed(() => catalogo.value.find((item) => String(item.id) === itemSelecionadoId.value))
const sessaoAtual = computed(() => mesaAtual.value?.sessoes[0])

async function carregar(feedback = false) {
  try {
    loading.value = true
    ;[mesas.value, catalogo.value] = await Promise.all([
      RestauranteRepository.mesas(),
      RestauranteRepository.catalogo({ limit: 100 }).then((response) => response.data
        .filter((item) => item.disponivel)
        .map((item) => ({
          ...item,
          grupos: item.grupos.filter((link) => link.Grupo.ativo),
        }))),
    ])
    if (feedback) toast.info('Salão atualizado')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar o salão.')
  } finally { loading.value = false }
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
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar a mesa.') }
  finally { saving.value = false }
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
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível abrir a mesa.') }
  finally { saving.value = false }
}

function prepararPedido(mesa: RestauranteMesa) {
  mesaAtual.value = mesa
  carrinho.value = []
  pedidoObservacao.value = ''
  limparItem()
  pedidoModal.value = true
}

function limparItem() {
  itemSelecionadoId.value = ''
  quantidade.value = 1
  selecoes.value = []
  itemObservacao.value = ''
}

function alternarSelecao(id: number, grupoId: number, maximo: number) {
  if (selecoes.value.includes(id)) selecoes.value = selecoes.value.filter((value) => value !== id)
  else {
    const group = itemSelecionado.value?.grupos.find((link) => link.grupoId === grupoId)?.Grupo
    const idsGrupo = group?.opcoes.flatMap((option) => option.id ? [option.id] : []) || []
    if (selecoes.value.filter((value) => idsGrupo.includes(value)).length >= maximo) return
    selecoes.value.push(id)
  }
}

function adicionarItem() {
  const item = itemSelecionado.value
  if (!item) return
  for (const link of item.grupos) {
    const ids = link.Grupo.opcoes.flatMap((option) => option.id ? [option.id] : [])
    const count = selecoes.value.filter((id) => ids.includes(id)).length
    if (count < link.Grupo.minimo || count > link.Grupo.maximo) {
      toast.warning(`${link.Grupo.nome}: escolha entre ${link.Grupo.minimo} e ${link.Grupo.maximo}.`)
      return
    }
  }
  carrinho.value.push({
    catalogoItemId: item.id,
    quantidade: Math.max(1, quantidade.value),
    selecaoIds: [...selecoes.value],
    ...(itemObservacao.value.trim() ? { observacao: itemObservacao.value.trim() } : {}),
  })
  limparItem()
}

function nomeItem(id: number) {
  const item = catalogo.value.find((candidate) => candidate.id === id)
  return item?.nomePublico || item?.Produto.nome || 'Item'
}

async function enviarPedido() {
  const sessao = sessaoAtual.value
  if (!sessao || !carrinho.value.length) return
  try {
    saving.value = true
    await RestauranteRepository.criarPedidoMesa(sessao.id, { itens: carrinho.value, observacao: pedidoObservacao.value || null })
    pedidoModal.value = false
    toast.success('Pedido enviado para produção')
    await carregar()
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível enviar o pedido.') }
  finally { saving.value = false }
}

async function acaoMesa(mesa: RestauranteMesa, action: 'conta' | 'liberar' | 'limpeza') {
  try {
    if (action === 'conta') await RestauranteRepository.solicitarContaMesa(mesa.id)
    if (action === 'liberar') await RestauranteRepository.liberarMesa(mesa.id)
    if (action === 'limpeza') await RestauranteRepository.finalizarLimpezaMesa(mesa.id)
    toast.success(action === 'conta' ? 'Conta solicitada' : action === 'limpeza' ? 'Mesa liberada' : 'Atendimento encerrado')
    await carregar()
  } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível atualizar a mesa.') }
}

function totalMesa(mesa: RestauranteMesa) { return Number(mesa.sessoes[0]?.comandas.reduce((total, item) => total + Number(item.ComandaOperacao.total), 0) || 0) }
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
      <div><h1 class="flex items-center gap-2 text-2xl font-semibold tracking-tight"><ConciergeBell class="h-6 w-6 text-primary" />Salão</h1><p class="text-sm text-muted-foreground">Abra mesas, lance pedidos e acompanhe a conta em tempo real.</p></div>
      <div class="flex gap-2"><Button variant="outline" :disabled="loading" @click="carregar(true)"><RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />Atualizar</Button><Button @click="novaMesa()"><Plus class="mr-2 h-4 w-4" />Nova mesa</Button></div>
    </header>

    <div class="grid gap-3 sm:grid-cols-[1fr_220px]">
      <div class="relative"><Search class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input v-model="busca" class="pl-9" placeholder="Buscar mesa" /></div>
      <Select v-model="filtro"><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="TODAS">Todos os status</SelectItem><SelectItem v-for="(label, key) in statusLabel" :key="key" :value="key">{{ label }}</SelectItem></SelectContent></Select>
    </div>

    <div v-if="loading" class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4"><Skeleton v-for="item in 8" :key="item" class="h-44 rounded-xl" /></div>
    <div v-else-if="!filtradas.length" class="rounded-xl border border-dashed p-10 text-center"><Utensils class="mx-auto mb-3 h-9 w-9 text-muted-foreground" /><p class="font-medium">Nenhuma mesa encontrada</p><p class="text-sm text-muted-foreground">Cadastre as mesas do salão para iniciar os atendimentos.</p></div>
    <div v-else class="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
      <Card v-for="mesa in filtradas" :key="mesa.id" class="flex flex-col rounded-xl border-2" :class="statusClass[mesa.status]">
        <CardHeader class="p-4 pb-2"><div class="flex items-start justify-between gap-2"><div><CardTitle class="text-base">{{ mesa.nome }}</CardTitle><p v-if="tempoAberta(mesa)" class="mt-0.5 text-xs text-muted-foreground">{{ tempoAberta(mesa) }} · {{ mesa.sessoes[0]?.pessoas }} pessoa(s)</p></div><Badge variant="outline" class="text-[11px]">{{ statusLabel[mesa.status] }}</Badge></div></CardHeader>
        <CardContent class="flex-1 space-y-2 px-4 pb-3"><template v-if="mesa.sessoes[0]"><div class="flex items-center justify-between rounded-lg bg-background/70 px-2.5 py-2"><span class="text-xs text-muted-foreground">Conta atual</span><strong class="text-sm">{{ formatCurrencyBR(totalMesa(mesa)) }}</strong></div><div class="flex flex-wrap gap-x-2 text-[11px] text-muted-foreground"><span>{{ mesa.sessoes[0].pedidos.length }} pedido(s)</span><span v-for="comanda in mesa.sessoes[0].comandas" :key="comanda.comandaOperacaoId">#{{ comanda.ComandaOperacao.Uid }}</span></div></template><p v-else class="text-xs text-muted-foreground">Disponível para atendimento.</p></CardContent>
        <CardFooter class="flex flex-wrap gap-1.5 border-t px-4 py-3"><Button v-if="mesa.status === 'LIVRE'" size="sm" class="flex-1" @click="prepararAbertura(mesa)"><ConciergeBell class="mr-1.5 h-3.5 w-3.5" />Abrir</Button><template v-else-if="mesa.status === 'OCUPADA'"><Button size="sm" class="flex-1" @click="prepararPedido(mesa)"><Send class="mr-1.5 h-3.5 w-3.5" />Pedido</Button><Button size="sm" variant="outline" @click="acaoMesa(mesa, 'conta')"><ReceiptText class="mr-1.5 h-3.5 w-3.5" />Conta</Button></template><template v-else-if="mesa.status === 'AGUARDANDO_CONTA'"><Button as-child size="sm" variant="outline" class="flex-1"><RouterLink to="/restaurante/comandas"><CircleDollarSign class="mr-1.5 h-3.5 w-3.5" />Faturar</RouterLink></Button><Button size="sm" @click="acaoMesa(mesa, 'liberar')">Liberar</Button></template><Button v-else-if="mesa.status === 'LIMPEZA'" size="sm" class="flex-1" @click="acaoMesa(mesa, 'limpeza')"><BrushCleaning class="mr-1.5 h-3.5 w-3.5" />Finalizar</Button><Button variant="ghost" size="sm" @click="novaMesa(mesa)">Editar</Button></CardFooter>
      </Card>
    </div>

    <Dialog v-model:open="mesaModal"><DialogContent><DialogHeader><DialogTitle>{{ mesaAtual ? 'Editar mesa' : 'Nova mesa' }}</DialogTitle><DialogDescription>Identificação exibida no mapa do salão.</DialogDescription></DialogHeader><div class="space-y-2"><Label>Nome</Label><Input v-model="mesaForm.nome" placeholder="Ex.: Mesa 01" @keyup.enter="salvarMesa" /></div><DialogFooter><Button variant="outline" @click="mesaModal = false">Cancelar</Button><Button :disabled="saving || !mesaForm.nome.trim()" @click="salvarMesa">Salvar</Button></DialogFooter></DialogContent></Dialog>

    <Dialog v-model:open="abrirModal"><DialogContent><DialogHeader><DialogTitle>Abrir {{ mesaAtual?.nome }}</DialogTitle><DialogDescription>Uma comanda principal será criada e vinculada ao atendimento.</DialogDescription></DialogHeader><div class="grid gap-4 sm:grid-cols-2"><div class="space-y-2"><Label>Pessoas</Label><Input v-model.number="abertura.pessoas" type="number" min="1" max="99" /></div><div class="space-y-2"><Label>Cliente (opcional)</Label><Input v-model="abertura.clienteNome" /></div><div class="space-y-2 sm:col-span-2"><Label>Observação</Label><Textarea v-model="abertura.observacao" /></div></div><DialogFooter><Button variant="outline" @click="abrirModal = false">Cancelar</Button><Button :disabled="saving" @click="abrirMesa">Abrir atendimento</Button></DialogFooter></DialogContent></Dialog>

    <Dialog v-model:open="pedidoModal"><DialogContent class="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>Novo pedido · {{ mesaAtual?.nome }}</DialogTitle><DialogDescription>Os itens serão lançados na comanda e enviados aos pontos do KDS.</DialogDescription></DialogHeader><div class="space-y-4"><div class="grid gap-3 sm:grid-cols-[1fr_110px]"><Select v-model="itemSelecionadoId" @update:model-value="selecoes = []"><SelectTrigger><SelectValue placeholder="Selecione um item" /></SelectTrigger><SelectContent><SelectItem v-for="item in catalogo" :key="item.id" :value="String(item.id)">{{ item.nomePublico || item.Produto.nome }} · {{ formatCurrencyBR(Number(item.Produto.preco)) }}</SelectItem></SelectContent></Select><Input v-model.number="quantidade" type="number" min="1" /></div><div v-if="itemSelecionado" class="space-y-3 rounded-xl border p-3"><div v-for="link in itemSelecionado.grupos" :key="link.grupoId"><p class="mb-2 text-sm font-medium">{{ link.Grupo.nome }} <span class="font-normal text-muted-foreground">({{ link.Grupo.minimo }}–{{ link.Grupo.maximo }})</span></p><div class="flex flex-wrap gap-2"><Button v-for="opcao in link.Grupo.opcoes" :key="opcao.id" type="button" size="sm" :variant="opcao.id && selecoes.includes(opcao.id) ? 'default' : 'outline'" @click="opcao.id && alternarSelecao(opcao.id, link.grupoId, link.Grupo.maximo)">{{ opcao.nome }}</Button></div></div><Textarea v-model="itemObservacao" placeholder="Observação deste item" /><Button type="button" variant="secondary" class="w-full" @click="adicionarItem"><Plus class="mr-2 h-4 w-4" />Adicionar ao pedido</Button></div><div v-if="carrinho.length" class="space-y-2"><div v-for="(item, index) in carrinho" :key="index" class="flex items-center justify-between rounded-lg bg-muted p-3 text-sm"><span>{{ item.quantidade }}× {{ nomeItem(item.catalogoItemId) }}</span><Button size="sm" variant="ghost" @click="carrinho.splice(index, 1)">Remover</Button></div><Textarea v-model="pedidoObservacao" placeholder="Observação geral do pedido" /></div></div><DialogFooter><Button variant="outline" @click="pedidoModal = false">Cancelar</Button><Button :disabled="saving || !carrinho.length" @click="enviarPedido"><Send class="mr-2 h-4 w-4" />Enviar à produção</Button></DialogFooter></DialogContent></Dialog>
  </section>
</template>
