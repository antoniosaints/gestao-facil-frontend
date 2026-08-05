<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  RestauranteRepository,
  type RestauranteCheckoutPreview,
} from '@/repositories/restaurante-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { resolveFileUrl } from '@/utils/fileUrl'
import { CheckCircle2, Clipboard, LoaderCircle, LocateFixed, Minus, Plus, ShoppingBag, Truck, UtensilsCrossed } from 'lucide-vue-next'

const route = useRoute()
const toast = useToast()
const loading = ref(true)
const sending = ref(false)
const previewing = ref(false)
const checkoutOpen = ref(false)
const cardapio = ref<any>(null)
const quantities = ref<Record<number, number>>({})
const selections = ref<Record<number, number[]>>({})
const quote = ref<RestauranteCheckoutPreview | null>(null)
const orderResult = ref<any>(null)
const tracking = ref<any>(null)
const origem = ref<'RETIRADA' | 'DELIVERY'>('RETIRADA')
const pagamento = ref<'NA_ENTREGA' | 'PIX' | 'CHECKOUT_PRO'>('NA_ENTREGA')
const form = reactive({
  nome: '',
  telefone: '',
  email: '',
  observacao: '',
  cep: '',
  cidade: '',
  bairro: '',
  logradouro: '',
  numero: '',
  complemento: '',
  referencia: '',
  latitude: null as number | null,
  longitude: null as number | null,
})

const selecionados = computed(() =>
  (cardapio.value?.itens || []).filter((item: any) => quantities.value[item.id] > 0),
)
const logo = computed(() => resolveFileUrl(cardapio.value?.restaurante.logo))
const payloadItems = computed(() =>
  selecionados.value.map((item: any) => ({
    catalogoItemId: item.id,
    quantidade: quantities.value[item.id],
    selecaoIds: selections.value[item.id] || [],
  })),
)
const addressComplete = computed(() =>
  origem.value === 'RETIRADA' ||
  [form.cep.replace(/\D/g, ''), form.cidade, form.bairro, form.logradouro, form.numero].every((value) => value.trim().length > 0),
)
const checkoutValid = computed(() =>
  form.nome.trim().length >= 2 &&
  form.telefone.replace(/\D/g, '').length >= 8 &&
  addressComplete.value &&
  selecionados.value.length > 0,
)

function change(id: number, delta: number) {
  quantities.value[id] = Math.max(0, (quantities.value[id] || 0) + delta)
  quote.value = null
}

function toggle(itemId: number, group: any, optionId: number) {
  const current = selections.value[itemId] || []
  if (current.includes(optionId)) {
    selections.value[itemId] = current.filter((id) => id !== optionId)
    quote.value = null
    return
  }
  const groupIds = group.opcoes.map((option: any) => option.id)
  const outside = current.filter((id) => !groupIds.includes(id))
  const inside = current.filter((id) => groupIds.includes(id))
  selections.value[itemId] = [...outside, ...inside.slice(Math.max(inside.length - group.maximo + 1, 0)), optionId]
  quote.value = null
}

function checkoutPayload() {
  return {
    origem: origem.value,
    itens: payloadItems.value,
    ...(origem.value === 'DELIVERY'
      ? {
          endereco: {
            cep: form.cep,
            cidade: form.cidade,
            bairro: form.bairro,
            logradouro: form.logradouro,
            numero: form.numero,
            complemento: form.complemento || null,
            referencia: form.referencia || null,
            latitude: form.latitude,
            longitude: form.longitude,
          },
        }
      : {}),
  }
}

async function carregar() {
  try {
    cardapio.value = await RestauranteRepository.cardapioPublico(String(route.params.slug))
    origem.value = cardapio.value.restaurante.retiradaAtiva ? 'RETIRADA' : 'DELIVERY'
    pagamento.value = cardapio.value.restaurante.pagamentoNaEntregaAtivo ? 'NA_ENTREGA' : 'PIX'
    const token = String(route.query.pedido || localStorage.getItem('restaurante:trackingToken') || '')
    if (token) {
      try {
        tracking.value = await RestauranteRepository.acompanharPedido(token)
      } catch {
        localStorage.removeItem('restaurante:trackingToken')
      }
    }
  } catch {
    toast.error('Cardápio indisponível.')
  } finally {
    loading.value = false
  }
}

async function previewCheckout(showFeedback = true) {
  if (!addressComplete.value) {
    if (showFeedback) toast.info('Preencha o endereço para calcular a entrega.')
    return null
  }
  try {
    previewing.value = true
    quote.value = await RestauranteRepository.previaCheckoutPublico(String(route.params.slug), checkoutPayload())
    return quote.value
  } catch (error: any) {
    quote.value = null
    if (showFeedback) toast.error(error?.response?.data?.error?.message || 'Não foi possível calcular o pedido.')
    return null
  } finally {
    previewing.value = false
  }
}

async function pedir() {
  if (!checkoutValid.value) return toast.info('Preencha os dados necessários para finalizar.')
  const currentQuote = quote.value || (await previewCheckout())
  if (!currentQuote) return
  if (!currentQuote.minimumReached) {
    return toast.info(`O pedido mínimo é ${formatCurrencyBR(Number(currentQuote.minimumOrder))}.`)
  }
  try {
    sending.value = true
    const idempotencyKey = crypto.randomUUID()
    const result = await RestauranteRepository.criarPedidoPublico(
      String(route.params.slug),
      {
        ...checkoutPayload(),
        cliente: { nome: form.nome, telefone: form.telefone, email: form.email || null },
        observacao: form.observacao || undefined,
        pagamento: pagamento.value,
      },
      idempotencyKey,
    )
    orderResult.value = result
    localStorage.setItem('restaurante:trackingToken', result.trackingToken)
    quantities.value = {}
    selections.value = {}
    if (result.paymentAction?.type === 'REDIRECT' && result.paymentAction.url) {
      window.location.assign(result.paymentAction.url)
      return
    }
    toast.success(`Pedido ${result.pedido.codigo} criado!`)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível enviar o pedido.')
  } finally {
    sending.value = false
  }
}

function useLocation() {
  if (!navigator.geolocation) return toast.info('Geolocalização não disponível neste navegador.')
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      form.latitude = coords.latitude
      form.longitude = coords.longitude
      toast.success('Localização adicionada ao endereço')
    },
    () => toast.error('Não foi possível obter sua localização.'),
    { enableHighAccuracy: true, timeout: 10000 },
  )
}

async function copyPix() {
  const code = orderResult.value?.paymentAction?.pixCopiaCola
  if (!code) return
  await navigator.clipboard.writeText(code)
  toast.success('Código Pix copiado')
}

watch([origem, pagamento], () => {
  quote.value = null
})
watch(
  () => [form.cep, form.cidade, form.bairro, form.logradouro, form.numero, form.complemento, form.referencia],
  () => {
    quote.value = null
  },
)

onMounted(carregar)
</script>

<template>
  <main class="min-h-screen bg-muted/30">
    <div class="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <header class="flex items-center gap-3">
        <img :src="logo" :alt="`Logo de ${cardapio?.restaurante.nome || 'restaurante'}`" class="h-14 w-14 rounded-xl border bg-card object-contain p-1 shadow-sm" />
        <div><h1 class="text-2xl font-semibold">{{ cardapio?.restaurante.nome || 'Cardápio' }}</h1><p class="text-sm text-muted-foreground">Escolha seus itens e finalize com retirada ou delivery.</p></div>
      </header>

      <Card v-if="tracking">
        <CardContent class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div class="flex items-center gap-3"><CheckCircle2 class="h-6 w-6 text-primary" /><div><p class="font-medium">Pedido {{ tracking.codigo }}</p><p class="text-sm text-muted-foreground">{{ tracking.status.replace('_', ' ') }} · Pagamento {{ tracking.pagamentoStatus.replace('_', ' ') }}</p></div></div>
          <Badge variant="secondary">Acompanhamento ativo</Badge>
        </CardContent>
      </Card>

      <div v-if="loading" class="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><Skeleton v-for="n in 6" :key="n" class="h-64 rounded-xl" /></div>
      <div v-else-if="!cardapio" class="rounded-xl border border-dashed bg-card p-12 text-center">Cardápio indisponível.</div>
      <template v-else>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card v-for="item in cardapio.itens" :key="item.id" class="flex flex-col overflow-hidden">
            <img v-if="item.imagem || item.Produto.imagem" :src="item.imagem || item.Produto.imagem" :alt="item.nomePublico || item.Produto.nome" class="h-40 w-full object-cover" />
            <CardHeader><div class="flex justify-between gap-3"><CardTitle class="text-base">{{ item.nomePublico || item.Produto.nome }}</CardTitle><Badge variant="secondary">a partir de {{ formatCurrencyBR(Number(item.Produto.preco)) }}</Badge></div></CardHeader>
            <CardContent class="flex-1 space-y-3 text-sm">
              <p class="text-muted-foreground">{{ item.descricao || 'Preparado especialmente para você.' }}</p>
              <div v-for="link in item.grupos" :key="link.grupoId" class="space-y-2">
                <p class="font-medium">{{ link.Grupo.nome }} <span class="text-xs font-normal text-muted-foreground">({{ link.Grupo.minimo }}–{{ link.Grupo.maximo }})</span></p>
                <div class="flex flex-wrap gap-2">
                  <Button v-for="option in link.Grupo.opcoes" :key="option.id" type="button" size="sm" :variant="(selections[item.id] || []).includes(option.id) ? 'default' : 'outline'" @click="toggle(item.id, link.Grupo, option.id)">
                    {{ option.nome }}<span v-if="Number(option.precoAdicional) > 0" class="ml-1">+{{ formatCurrencyBR(Number(option.precoAdicional)) }}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter class="justify-between border-t pt-4"><Button size="icon" variant="outline" :disabled="!quantities[item.id]" @click="change(item.id, -1)"><Minus class="h-4 w-4" /></Button><strong>{{ quantities[item.id] || 0 }}</strong><Button size="icon" @click="change(item.id, 1)"><Plus class="h-4 w-4" /></Button></CardFooter>
          </Card>
        </div>

        <Card v-if="selecionados.length" class="sticky bottom-4 z-10 shadow-lg">
          <CardContent class="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p class="font-medium">{{ selecionados.length }} item(ns) no pedido</p><p class="text-sm text-muted-foreground">Frete e total serão calculados pelo restaurante.</p></div>
            <Button @click="checkoutOpen = true"><ShoppingBag class="mr-2 h-4 w-4" />Revisar pedido</Button>
          </CardContent>
        </Card>
      </template>
    </div>

    <Dialog v-model:open="checkoutOpen">
      <DialogContent class="max-h-[92vh] max-w-3xl overflow-y-auto">
        <template v-if="orderResult">
          <DialogHeader><DialogTitle>Pedido {{ orderResult.pedido.codigo }} criado</DialogTitle><DialogDescription>Acompanhe o pagamento e o preparo por este navegador.</DialogDescription></DialogHeader>
          <div class="space-y-4 py-2">
            <div class="rounded-xl border bg-muted/30 p-4"><div class="flex justify-between"><span>Total</span><strong>{{ formatCurrencyBR(Number(orderResult.pedido.total)) }}</strong></div></div>
            <div v-if="orderResult.paymentAction?.type === 'PIX'" class="space-y-3 rounded-xl border p-4">
              <p class="font-medium">Pague com Pix</p><p class="break-all text-sm text-muted-foreground">{{ orderResult.paymentAction.pixCopiaCola }}</p>
              <div class="flex flex-wrap gap-2"><Button @click="copyPix"><Clipboard class="mr-2 h-4 w-4" />Copiar Pix</Button><Button v-if="orderResult.paymentAction.url" as-child variant="outline"><a :href="orderResult.paymentAction.url" target="_blank">Abrir pagamento</a></Button></div>
            </div>
            <p v-else class="text-sm text-muted-foreground">O pagamento será realizado na {{ origem === 'DELIVERY' ? 'entrega' : 'retirada' }}.</p>
          </div>
          <DialogFooter><Button @click="checkoutOpen = false">Voltar ao cardápio</Button></DialogFooter>
        </template>

        <template v-else>
          <DialogHeader><DialogTitle>Finalizar pedido</DialogTitle><DialogDescription>O servidor valida itens, endereço, frete e total antes de criar o pedido.</DialogDescription></DialogHeader>
          <div class="space-y-5 py-2">
            <div class="space-y-2"><Label>Como deseja receber?</Label><RadioGroup v-model="origem" class="grid gap-3 sm:grid-cols-2"><label v-if="cardapio?.restaurante.retiradaAtiva" class="flex cursor-pointer items-center gap-3 rounded-xl border p-4"><RadioGroupItem value="RETIRADA" /><UtensilsCrossed class="h-4 w-4" /><span>Retirar no local</span></label><label v-if="cardapio?.restaurante.deliveryAtivo" class="flex cursor-pointer items-center gap-3 rounded-xl border p-4"><RadioGroupItem value="DELIVERY" /><Truck class="h-4 w-4" /><span>Receber por delivery</span></label></RadioGroup></div>

            <div class="grid gap-4 sm:grid-cols-2"><div class="space-y-2"><Label>Nome</Label><Input v-model="form.nome" /></div><div class="space-y-2"><Label>Telefone</Label><Input v-model="form.telefone" /></div><div class="space-y-2 sm:col-span-2"><Label>E-mail</Label><Input v-model="form.email" type="email" placeholder="Necessário para pagamentos online" /></div></div>

            <div v-if="origem === 'DELIVERY'" class="space-y-4 rounded-xl border p-4">
              <div class="flex items-center justify-between"><div><p class="font-medium">Endereço de entrega</p><p class="text-xs text-muted-foreground">A taxa não depende da distância calculada.</p></div><Button size="sm" variant="outline" @click="useLocation"><LocateFixed class="mr-2 h-4 w-4" />Usar localização</Button></div>
              <div class="grid gap-3 sm:grid-cols-2"><div class="space-y-1"><Label>CEP</Label><Input v-model="form.cep" placeholder="00000-000" /></div><div class="space-y-1"><Label>Cidade</Label><Input v-model="form.cidade" /></div><div class="space-y-1"><Label>Bairro</Label><Input v-model="form.bairro" /></div><div class="space-y-1"><Label>Logradouro</Label><Input v-model="form.logradouro" /></div><div class="space-y-1"><Label>Número</Label><Input v-model="form.numero" /></div><div class="space-y-1"><Label>Complemento</Label><Input v-model="form.complemento" /></div><div class="space-y-1 sm:col-span-2"><Label>Referência</Label><Input v-model="form.referencia" /></div></div>
            </div>

            <div class="space-y-2"><Label>Pagamento</Label><RadioGroup v-model="pagamento" class="grid gap-3 sm:grid-cols-3"><label v-if="cardapio?.restaurante.pagamentoNaEntregaAtivo" class="flex cursor-pointer items-center gap-2 rounded-xl border p-3"><RadioGroupItem value="NA_ENTREGA" /><span class="text-sm">No local</span></label><label v-if="cardapio?.restaurante.pagamentoOnlineAtivo" class="flex cursor-pointer items-center gap-2 rounded-xl border p-3"><RadioGroupItem value="PIX" /><span class="text-sm">Pix</span></label><label v-if="cardapio?.restaurante.pagamentoOnlineAtivo" class="flex cursor-pointer items-center gap-2 rounded-xl border p-3"><RadioGroupItem value="CHECKOUT_PRO" /><span class="text-sm">Cartão online</span></label></RadioGroup></div>
            <div class="space-y-2"><Label>Observação</Label><Textarea v-model="form.observacao" rows="2" /></div>

            <Separator />
            <div class="space-y-2">
              <div v-for="item in selecionados" :key="item.id" class="flex justify-between gap-3 text-sm"><span>{{ quantities[item.id] }}× {{ item.nomePublico || item.Produto.nome }}</span></div>
              <div v-if="quote" class="space-y-2 border-t pt-3 text-sm"><div class="flex justify-between"><span>Subtotal</span><span>{{ formatCurrencyBR(Number(quote.subtotal)) }}</span></div><div class="flex justify-between"><span>Frete <small v-if="quote.zone" class="text-muted-foreground">({{ quote.zone.nome }})</small></span><span>{{ formatCurrencyBR(Number(quote.frete)) }}</span></div><div class="flex justify-between text-base"><strong>Total</strong><strong>{{ formatCurrencyBR(Number(quote.total)) }}</strong></div><p v-if="!quote.minimumReached" class="text-sm text-destructive">Pedido mínimo: {{ formatCurrencyBR(Number(quote.minimumOrder)) }}</p></div>
              <Button v-else class="w-full" variant="outline" :disabled="previewing || !addressComplete" @click="previewCheckout()"><LoaderCircle v-if="previewing" class="mr-2 h-4 w-4 animate-spin" />Calcular total</Button>
            </div>
          </div>
          <DialogFooter><Button variant="outline" @click="checkoutOpen = false">Continuar comprando</Button><Button :disabled="sending || !checkoutValid || !quote?.minimumReached" @click="pedir"><LoaderCircle v-if="sending" class="mr-2 h-4 w-4 animate-spin" />Confirmar pedido</Button></DialogFooter>
        </template>
      </DialogContent>
    </Dialog>
  </main>
</template>
