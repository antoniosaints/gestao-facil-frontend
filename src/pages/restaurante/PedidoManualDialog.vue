<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { vMaska } from 'maska/vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  RestauranteRepository,
  type RestauranteCatalogoItem,
  type RestaurantePedido,
} from '@/repositories/restaurante-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { phoneMaskOptions } from '@/lib/imaska'
import { selectedMenuItemSummary } from './manualOrderSummary'
import {
  ClipboardList,
  MessageSquare,
  Minus,
  Phone,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  UtensilsCrossed,
  UserRound,
} from 'lucide-vue-next'

const props = defineProps<{ open: boolean; pedidoParaEditar?: RestaurantePedido | null }>()
const emit = defineEmits<{
  'update:open': [open: boolean]
  created: []
  updated: [pedido: RestaurantePedido]
}>()

type CartItem = {
  catalogoItemId: number
  quantidade: number
  selecaoIds: number[]
  observacao?: string
}

const toast = useToast()
const loadingCatalog = ref(false)
const saving = ref(false)
const catalogo = ref<RestauranteCatalogoItem[]>([])
const busca = ref('')
const categoriaAtiva = ref('TODAS')
const itemSelecionadoId = ref<number | null>(null)
const quantidade = ref(1)
const selecoes = ref<number[]>([])
const itemObservacao = ref('')
const pedidoObservacao = ref('')
const clienteNome = ref('')
const clienteTelefone = ref('')
const clienteId = ref<number | string | null>(null)
const carrinho = ref<CartItem[]>([])
const editandoItens = computed(() => Boolean(props.pedidoParaEditar))

const itemSelecionado = computed(
  () => catalogo.value.find((item) => item.id === itemSelecionadoId.value) || null,
)
const catalogoFiltrado = computed(() => {
  const term = busca.value.trim().toLocaleLowerCase('pt-BR')
  return catalogo.value.filter((item) => {
    const categoryMatches = categoriaAtiva.value === 'TODAS' || itemCategoria(item) === categoriaAtiva.value
    const searchMatches = !term ||
      `${item.nomePublico || ''} ${item.Produto?.nome || ''}`
        .toLocaleLowerCase('pt-BR')
        .includes(term)
    return categoryMatches && searchMatches
  })
})
const categoriasCatalogo = computed(() => {
  const counts = new Map<string, number>()
  for (const item of catalogo.value) {
    const category = itemCategoria(item)
    counts.set(category, (counts.get(category) || 0) + 1)
  }
  return [...counts.entries()]
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
})
const totalItens = computed(() =>
  carrinho.value.reduce((total, item) => total + item.quantidade, 0),
)
const linhasNoCarrinho = computed(() => carrinho.value.length)

function itemNome(item: RestauranteCatalogoItem) {
  return item.nomePublico || item.Produto?.nome || 'Item do cardápio'
}

function itemImagem(item: RestauranteCatalogoItem) {
  return item.imagem || item.Produto?.imagem || null
}

function itemCategoria(item: RestauranteCatalogoItem) {
  return item.Categoria?.nome || item.Produto?.ProdutoBase?.Categoria?.nome || 'Sem categoria'
}

function limparItem() {
  itemSelecionadoId.value = null
  quantidade.value = 1
  selecoes.value = []
  itemObservacao.value = ''
}

function reset() {
  busca.value = ''
  categoriaAtiva.value = 'TODAS'
  pedidoObservacao.value = ''
  clienteNome.value = ''
  clienteTelefone.value = ''
  clienteId.value = null
  carrinho.value = []
  limparItem()
}

function selecaoIdsDoPedido(item: RestaurantePedido['itens'][number]) {
  const catalogoItem = catalogo.value.find((candidate) => candidate.id === item.catalogoItemId)
  if (!catalogoItem || !Array.isArray(item.selecoesSnapshotJson)) return []
  return item.selecoesSnapshotJson.flatMap((selecao) => {
    const grupo =
      catalogoItem.grupos.find((link) => link.Grupo.id === selecao.grupoId)?.Grupo ||
      catalogoItem.grupos.find((link) =>
        link.Grupo.opcoes.some((candidate) => candidate.nome === selecao.nome),
      )?.Grupo
    const opcao = grupo?.opcoes.find((candidate) => candidate.nome === selecao.nome)
    return opcao?.id ? [opcao.id] : []
  })
}

function preencherPedidoParaEdicao() {
  const pedido = props.pedidoParaEditar
  if (!pedido) return
  pedidoObservacao.value = pedido.observacao || ''
  carrinho.value = pedido.itens.flatMap((item) => {
    if (!item.catalogoItemId || !catalogo.value.some((candidate) => candidate.id === item.catalogoItemId)) return []
    return [{
      catalogoItemId: item.catalogoItemId,
      quantidade: Math.max(1, Number(item.quantidade)),
      selecaoIds: selecaoIdsDoPedido(item),
      ...(item.observacao ? { observacao: item.observacao } : {}),
    }]
  })
}

async function carregarCatalogo() {
  if (catalogo.value.length || loadingCatalog.value) return
  try {
    loadingCatalog.value = true
    const items = await RestauranteRepository.catalogoCompleto()
    catalogo.value = items
      .filter((item) => item.disponivel)
      .map((item) => ({ ...item, grupos: item.grupos.filter((link) => link.Grupo.ativo) }))
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar o cardápio.')
  } finally {
    loadingCatalog.value = false
  }
}

function selecionarItem(id: number) {
  itemSelecionadoId.value = id
  quantidade.value = 1
  selecoes.value = []
  itemObservacao.value = ''
}

function alternarSelecao(id: number, grupoId: number, maximo: number, checked: unknown) {
  const item = itemSelecionado.value
  const group = item?.grupos.find((link) => link.grupoId === grupoId)?.Grupo
  const ids = group?.opcoes.flatMap((option) => (option.id ? [option.id] : [])) || []
  const enabled = checked === true
  if (!enabled) {
    selecoes.value = selecoes.value.filter((value) => value !== id)
    return
  }
  if (selecoes.value.includes(id)) return
  if (selecoes.value.filter((value) => ids.includes(value)).length >= maximo) {
    toast.info(`${group?.nome || 'Este grupo'} permite até ${maximo} escolha(s).`)
    return
  }
  selecoes.value.push(id)
}

function adicionarItem() {
  const item = itemSelecionado.value
  if (!item) return
  for (const link of item.grupos) {
    const ids = link.Grupo.opcoes.flatMap((option) => (option.id ? [option.id] : []))
    const count = selecoes.value.filter((id) => ids.includes(id)).length
    if (count < link.Grupo.minimo || count > link.Grupo.maximo) {
      toast.warning(
        `${link.Grupo.nome}: escolha entre ${link.Grupo.minimo} e ${link.Grupo.maximo}.`,
      )
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

function nomeCarrinho(item: CartItem) {
  const catalogItem = catalogo.value.find((candidate) => candidate.id === item.catalogoItemId)
  return catalogItem ? itemNome(catalogItem) : 'Item'
}

function selecoesCarrinho(item: CartItem) {
  const catalogItem = catalogo.value.find((candidate) => candidate.id === item.catalogoItemId)
  return catalogItem ? selectedMenuItemSummary(catalogItem, item.selecaoIds) : ''
}

function alterarQuantidadeCarrinho(index: number, delta: number) {
  const item = carrinho.value[index]
  if (!item) return
  item.quantidade = Math.max(1, item.quantidade + delta)
}

async function salvar() {
  if (!carrinho.value.length) return toast.info('Adicione ao menos um item ao pedido.')
  try {
    saving.value = true
    const payload = {
      itens: carrinho.value,
      observacao: pedidoObservacao.value.trim() || null,
    }
    if (props.pedidoParaEditar) {
      const pedido = await RestauranteRepository.atualizarItensPedido(props.pedidoParaEditar.id, {
        ...payload,
        version: props.pedidoParaEditar.version,
      })
      toast.success('Itens do pedido atualizados')
      emit('updated', pedido)
    } else {
      await RestauranteRepository.criarPedidoManual({
        ...payload,
        clienteId: clienteId.value ? Number(clienteId.value) : null,
        clienteNome: clienteNome.value.trim() || null,
        clienteTelefone: clienteTelefone.value.trim() || null,
      })
      toast.success('Pedido manual enviado para produção')
      emit('created')
    }
    emit('update:open', false)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível criar o pedido.')
  } finally {
    saving.value = false
  }
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      reset()
      await carregarCatalogo()
      if (props.pedidoParaEditar) preencherPedidoParaEdicao()
    }
    else reset()
  },
)
</script>

<template>
  <ModalView
    :open="open"
    :title="editandoItens ? `Editar itens — pedido ${props.pedidoParaEditar?.codigo || ''}` : 'Novo pedido manual'"
    :description="editandoItens ? 'A alteração recalcula valores, estoque e envia os itens atualizados para a produção.' : 'Monte o pedido, informe o cliente se necessário e envie a produção aos pontos configurados.'"
    size="5xl"
    @update:open="emit('update:open', $event)"
  >
    <div
      class="manual-order-layout grid gap-5 p-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,.85fr)]"
    >
      <section class="manual-order-catalog space-y-4">
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p class="flex items-center gap-2 text-sm font-semibold">
              <span
                class="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
                >1</span
              >{{ editandoItens ? 'Editar itens' : 'Adicionar itens' }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Escolha um item para configurar quantidade, adicionais e observações.
            </p>
          </div>
          <Badge
            variant="outline"
            class="border-primary/25 bg-primary/5 text-primary dark:bg-primary/15 dark:text-primary-foreground"
            >Pedido sem mesa</Badge
          >
        </div>

        <div class="relative">
          <Search class="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input v-model="busca" class="h-10 pl-9" placeholder="Buscar item do cardápio" />
        </div>

        <div v-if="categoriasCatalogo.length" class="flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar itens por categoria">
          <button type="button" class="shrink-0" @click="categoriaAtiva = 'TODAS'"><Badge :variant="categoriaAtiva === 'TODAS' ? 'default' : 'outline'" class="cursor-pointer">Todos <span class="ml-1 opacity-75">{{ catalogo.length }}</span></Badge></button>
          <button v-for="categoria in categoriasCatalogo" :key="categoria.nome" type="button" class="shrink-0" @click="categoriaAtiva = categoria.nome"><Badge :variant="categoriaAtiva === categoria.nome ? 'default' : 'outline'" class="cursor-pointer">{{ categoria.nome }} <span class="ml-1 opacity-75">{{ categoria.quantidade }}</span></Badge></button>
        </div>

        <div v-if="loadingCatalog" class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="item in 4"
            :key="item"
            class="h-20 animate-pulse rounded-xl border bg-muted/50"
          />
        </div>
        <div v-else class="grid max-h-56 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          <button
            v-for="item in catalogoFiltrado"
            :key="item.id"
            type="button"
            class="group flex min-h-[5.5rem] items-center gap-3 rounded-xl border bg-card p-3 text-left transition hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            :class="
              itemSelecionadoId === item.id
                ? 'border-primary bg-primary/[0.06] ring-1 ring-primary/20'
                : 'border-border'
            "
            :aria-pressed="itemSelecionadoId === item.id"
            @click="selecionarItem(item.id)"
          >
            <img
              v-if="itemImagem(item)"
              :src="itemImagem(item) || ''"
              :alt="itemNome(item)"
              class="h-14 w-14 shrink-0 rounded-lg object-cover outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
            />
            <span v-else class="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"><UtensilsCrossed class="h-5 w-5" /></span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold">{{ itemNome(item) }}</p>
              <p class="mt-0.5 truncate text-xs text-muted-foreground">{{ itemCategoria(item) }}</p>
              <p class="mt-1 text-xs font-semibold text-primary dark:text-primary-foreground">{{ formatCurrencyBR(Number(item.preco)) }}</p>
            </div>
            <Plus class="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary dark:group-hover:text-primary-foreground" />
          </button>
          <p
            v-if="!catalogoFiltrado.length"
            class="col-span-full rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground"
          >
            Nenhum item disponível.
          </p>
        </div>

        <div
          v-if="itemSelecionado"
          class="overflow-hidden rounded-2xl border border-primary/20 bg-muted/30 shadow-sm"
        >
          <div
            class="flex flex-wrap items-center justify-between gap-3 border-b border-primary/15 bg-primary/[0.06] px-4 py-3"
          >
            <div>
              <p class="text-sm font-semibold">{{ itemNome(itemSelecionado) }}</p>
              <p class="text-xs text-muted-foreground">
                Configure este item antes de adicioná-lo ao pedido.
              </p>
            </div>
            <Badge class="bg-primary text-primary-foreground">{{
              formatCurrencyBR(Number(itemSelecionado.preco))
            }}</Badge>
          </div>
          <div class="space-y-3 p-4">
            <div
              v-for="link in itemSelecionado.grupos"
              :key="link.grupoId"
              class="rounded-xl border bg-background/75 p-3"
            >
              <div class="mb-2 flex items-center justify-between gap-3">
                <p class="text-sm font-medium">{{ link.Grupo.nome }}</p>
                <Badge variant="outline" class="text-[11px] font-normal"
                  >{{ link.Grupo.minimo }}–{{ link.Grupo.maximo }} escolhas</Badge
                >
              </div>
              <div class="grid gap-2 sm:grid-cols-2">
                <label
                  v-for="option in link.Grupo.opcoes"
                  :key="option.id"
                  class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-2.5 text-sm transition hover:border-primary/40"
                  :class="
                    selecoes.includes(option.id || 0)
                      ? 'border-primary/50 bg-primary/[0.06]'
                      : 'border-border/80'
                  "
                >
                  <span class="flex min-w-0 items-center gap-2"
                    ><Checkbox
                      :model-value="selecoes.includes(option.id || 0)"
                      @update:model-value="
                        alternarSelecao(option.id || 0, link.grupoId, link.Grupo.maximo, $event)
                      "
                    />
                    <span class="truncate">{{ option.nome }}</span></span
                  >
                  <span
                    v-if="Number(option.precoAdicional)"
                    class="shrink-0 text-xs text-muted-foreground"
                    >+ {{ formatCurrencyBR(Number(option.precoAdicional)) }}</span
                  >
                </label>
              </div>
            </div>
            <div class="grid gap-3 sm:grid-cols-[7.5rem_1fr]">
              <label class="space-y-1.5 text-xs font-medium text-muted-foreground"
                ><span>Quantidade</span><Input v-model.number="quantidade" type="number" min="1"
              /></label>
              <label class="space-y-1.5 text-xs font-medium text-muted-foreground"
                ><span>Observação do item</span
                ><Input v-model="itemObservacao" placeholder="Ex.: sem cebola"
              /></label>
            </div>
            <Button class="w-full sm:w-auto" @click="adicionarItem"
              ><Plus class="mr-2 h-4 w-4" />Adicionar ao pedido</Button
            >
          </div>
        </div>
      </section>

      <aside
        class="manual-order-cart flex min-h-[28rem] flex-col overflow-y-auto rounded-2xl border bg-card shadow-sm lg:sticky lg:top-0"
      >
        <div class="border-b bg-muted/40 px-4 py-3.5">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <span
                class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-foreground"
                ><ClipboardList class="h-4 w-4"
              /></span>
              <div>
                <p class="text-sm font-semibold">Resumo do pedido</p>
                <p class="text-xs text-muted-foreground">Revise antes de enviar ao KDS.</p>
              </div>
            </div>
            <Badge variant="secondary">{{ totalItens }} item(ns)</Badge>
          </div>
        </div>
        <div class="min-h-auto flex-1 space-y-2 p-3">
          <div
            v-for="(item, index) in carrinho"
            :key="`${item.catalogoItemId}-${index}`"
            class="flex items-start justify-between gap-3 rounded-md border bg-background/70 p-3"
          >
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{{ nomeCarrinho(item) }}</p>
              <p v-if="selecoesCarrinho(item)" class="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {{ selecoesCarrinho(item) }}
              </p>
              <p v-if="item.observacao" class="mt-1 truncate text-xs text-muted-foreground">
                Obs.: {{ item.observacao }}
              </p>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <div class="flex items-center rounded-lg border bg-muted/30">
                <Button
                  size="icon"
                  variant="ghost"
                  class="h-7 w-7 rounded-r-none"
                  :disabled="item.quantidade <= 1"
                  :aria-label="`Diminuir quantidade de ${nomeCarrinho(item)}`"
                  @click="alterarQuantidadeCarrinho(index, -1)"
                  ><Minus class="h-3.5 w-3.5"
                /></Button>
                <span class="w-7 text-center text-xs font-semibold tabular-nums">{{
                  item.quantidade
                }}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  class="h-7 w-7 rounded-l-none"
                  :aria-label="`Aumentar quantidade de ${nomeCarrinho(item)}`"
                  @click="alterarQuantidadeCarrinho(index, 1)"
                  ><Plus class="h-3.5 w-3.5"
                /></Button>
              </div>
              <Button
                size="icon"
                variant="ghost"
                class="h-8 w-8 text-muted-foreground hover:text-destructive"
                :aria-label="`Remover ${nomeCarrinho(item)}`"
                @click="carrinho.splice(index, 1)"
                ><Trash2 class="h-4 w-4"
              /></Button>
            </div>
          </div>
          <div
            v-if="!carrinho.length"
            class="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center"
          >
            <ShoppingCart class="mb-3 h-7 w-7 text-muted-foreground" />
            <p class="text-sm font-medium">Seu pedido está vazio</p>
            <p class="mt-1 text-xs text-muted-foreground">Escolha os itens no cardápio ao lado.</p>
          </div>
        </div>
        <div class="space-y-3 border-t bg-muted/[0.16] p-4">
          <div v-if="!editandoItens" class="flex items-center justify-between">
            <p class="text-sm font-semibold">Dados do pedido</p>
            <span class="text-xs text-muted-foreground">Opcional</span>
          </div>
          <div v-if="!editandoItens" class="space-y-2">
            <label class="space-y-1.5 text-xs font-medium text-muted-foreground">
              <span>Cliente cadastrado</span>
              <Select2Ajax
                v-model="clienteId"
                url="/clientes/select2"
                :allow-clear="true"
                placeholder="Buscar cliente do sistema"
              />
            </label>
            <div class="relative">
              <UserRound
                class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
              /><Input v-model="clienteNome" class="pl-9" placeholder="Nome do cliente" />
            </div>
            <div class="relative">
              <Phone
                class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground"
              /><Input
                v-model="clienteTelefone"
                v-maska="phoneMaskOptions"
                class="pl-9"
                inputmode="tel"
                autocomplete="tel"
                placeholder="(00) 00000-0000"
              />
            </div>
            <div class="relative">
              <MessageSquare
                class="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground"
              /><Textarea
                v-model="pedidoObservacao"
                class="min-h-20 pl-9"
                placeholder="Observação geral do pedido"
              />
            </div>
          </div>
          <p
            v-if="!editandoItens"
            class="rounded-lg bg-primary/[0.07] px-3 py-2 text-xs text-primary dark:bg-primary/15 dark:text-primary-foreground"
          >
            {{
              linhasNoCarrinho
                ? `${linhasNoCarrinho} item(ns) diferente(s) serão enviados aos pontos de produção configurados.`
                : 'Itens com categoria roteada serão enviados diretamente ao KDS.'
            }}
          </p>
          <div class="flex gap-2">
            <Button variant="outline" class="flex-1" @click="emit('update:open', false)"
              >Cancelar</Button
            ><Button class="flex-1" :disabled="saving || !carrinho.length" @click="salvar"
              ><ShoppingCart class="mr-2 h-4 w-4" />{{
                saving ? (editandoItens ? 'Salvando...' : 'Criando...') : (editandoItens ? 'Salvar itens' : 'Criar pedido')
              }}</Button
            >
          </div>
        </div>
      </aside>
    </div>
  </ModalView>
</template>

<style scoped>
@media (min-width: 1024px) {
  .manual-order-layout {
    height: calc(90dvh - 9rem);
    min-height: 0;
    max-height: calc(90dvh - 9rem);
    overflow: hidden;
  }
  .manual-order-catalog,
  .manual-order-cart {
    min-height: 0;
  }
  .manual-order-catalog {
    overflow-y: auto;
    padding-right: 0.25rem;
    overscroll-behavior: contain;
  }
  .manual-order-cart {
    height: 100%;
  }
}
</style>
