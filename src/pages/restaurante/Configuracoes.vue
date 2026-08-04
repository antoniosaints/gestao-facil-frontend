<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  RestauranteRepository,
  type RestauranteConfig,
  type RestauranteZonaEntrega,
  type RestauranteZonaPayload,
} from '@/repositories/restaurante-repository'
import { CircleCheck, LoaderCircle, MapPin, Pencil, Plus, Save } from 'lucide-vue-next'

const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const savingZone = ref(false)
const zoneDialogOpen = ref(false)
const editingZoneId = ref<number | undefined>()
const zones = ref<RestauranteZonaEntrega[]>([])
const form = reactive<RestauranteConfig>({
  slug: '',
  nomePublico: '',
  ativo: false,
  pedidosQrDireto: false,
  modoFrete: 'FIXO',
  taxaFixa: 0,
  freteGratisAcima: null,
  taxaContingencia: null,
  pedidoMinimo: 0,
  retiradaAtiva: true,
  deliveryAtivo: true,
  pagamentoOnlineAtivo: false,
  pagamentoNaEntregaAtivo: true,
})

const emptyZone = (): RestauranteZonaPayload => ({
  nome: '',
  cidade: null,
  bairros: [],
  cepInicial: null,
  cepFinal: null,
  taxa: 0,
  pedidoMinimo: 0,
  freteGratisAcima: null,
  prioridade: 0,
  ativa: true,
})
const zoneForm = ref<RestauranteZonaPayload>(emptyZone())
const freteGratis = computed<string | number>({
  get: () => form.freteGratisAcima ?? '',
  set: (value) => {
    form.freteGratisAcima = value === '' ? null : Number(value)
  },
})
const contingencia = computed<string | number>({
  get: () => form.taxaContingencia ?? '',
  set: (value) => {
    form.taxaContingencia = value === '' ? null : Number(value)
  },
})
const bairrosText = computed({
  get: () => zoneForm.value.bairros.join(', '),
  set: (value: string) => {
    zoneForm.value.bairros = value.split(',').map((item) => item.trim()).filter(Boolean)
  },
})
const nomeValido = computed(() => form.nomePublico.trim().length >= 2)
const slugValido = computed(
  () => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim()) && form.slug.trim().length >= 3,
)
const dadosPublicacaoValidos = computed(() => nomeValido.value && slugValido.value)

async function carregar() {
  try {
    const [data, deliveryZones] = await Promise.all([
      RestauranteRepository.configuracao(),
      RestauranteRepository.zonasEntrega(),
    ])
    if (data) Object.assign(form, data)
    zones.value = deliveryZones
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar a configuração.')
  } finally {
    loading.value = false
  }
}

async function salvar() {
  if (!dadosPublicacaoValidos.value) return toast.info('Revise o nome público e o endereço do cardápio antes de salvar.')
  try {
    saving.value = true
    Object.assign(form, await RestauranteRepository.salvarConfiguracao(form))
    toast.success('Configuração salva')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar a configuração.')
  } finally {
    saving.value = false
  }
}

function newZone() {
  editingZoneId.value = undefined
  zoneForm.value = emptyZone()
  zoneDialogOpen.value = true
}

function editZone(zone: RestauranteZonaEntrega) {
  editingZoneId.value = zone.id
  zoneForm.value = {
    nome: zone.nome,
    cidade: zone.cidade,
    bairros: [...zone.bairros],
    cepInicial: zone.cepInicial,
    cepFinal: zone.cepFinal,
    taxa: zone.taxa,
    pedidoMinimo: zone.pedidoMinimo,
    freteGratisAcima: zone.freteGratisAcima,
    prioridade: zone.prioridade,
    ativa: zone.ativa,
    version: zone.version,
  }
  zoneDialogOpen.value = true
}

async function saveZone() {
  if (zoneForm.value.nome.trim().length < 2) return toast.info('Informe o nome da zona.')
  try {
    savingZone.value = true
    await RestauranteRepository.salvarZonaEntrega(zoneForm.value, editingZoneId.value)
    zones.value = await RestauranteRepository.zonasEntrega()
    zoneDialogOpen.value = false
    toast.success(editingZoneId.value ? 'Zona atualizada' : 'Zona criada')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar a zona.')
  } finally {
    savingZone.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <section class="mx-auto max-w-4xl space-y-6">
    <header>
      <h1 class="text-2xl font-semibold tracking-tight">Configurações do restaurante</h1>
      <p class="text-sm text-muted-foreground">Defina publicação, checkout e regras de entrega.</p>
    </header>

    <Alert>
      <CircleCheck class="h-4 w-4" />
      <AlertTitle class="flex items-center gap-2">App instalado <Badge variant="secondary">Ativo na conta</Badge></AlertTitle>
      <AlertDescription>A instalação do app e a publicação do cardápio são controles diferentes.</AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <CardTitle>Cardápio e checkout</CardTitle>
        <CardDescription>O endereço será /restaurante/seu-slug e só ficará disponível com o app ativo.</CardDescription>
      </CardHeader>
      <CardContent v-if="loading" class="flex justify-center p-10"><LoaderCircle class="h-6 w-6 animate-spin" /></CardContent>
      <CardContent v-else class="grid gap-5 sm:grid-cols-2">
        <div class="space-y-2">
          <Label for="nome">Nome público</Label><Input id="nome" v-model="form.nomePublico" :aria-invalid="!nomeValido" />
          <p v-if="!nomeValido" class="text-xs text-destructive">Informe pelo menos dois caracteres.</p>
        </div>
        <div class="space-y-2">
          <Label for="slug">Slug</Label><Input id="slug" v-model="form.slug" :aria-invalid="!slugValido" placeholder="minha-pizzaria" />
          <p v-if="!slugValido" class="text-xs text-destructive">Use letras minúsculas, números e hífens, sem espaços.</p>
        </div>
        <div class="space-y-2"><Label for="minimo">Pedido mínimo (R$)</Label><Input id="minimo" v-model.number="form.pedidoMinimo" type="number" min="0" step="0.01" /></div>
        <div class="space-y-2">
          <Label>Modelo de frete</Label>
          <Select v-model="form.modoFrete"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FIXO">Taxa fixa</SelectItem><SelectItem value="ZONAS">Zonas por endereço</SelectItem></SelectContent></Select>
        </div>
        <div v-if="form.modoFrete === 'FIXO'" class="space-y-2"><Label for="taxa">Taxa fixa de delivery (R$)</Label><Input id="taxa" v-model.number="form.taxaFixa" type="number" min="0" step="0.01" /></div>
        <div v-if="form.modoFrete === 'FIXO'" class="space-y-2"><Label for="gratis">Frete grátis acima de (R$)</Label><Input id="gratis" v-model="freteGratis" type="number" min="0" step="0.01" /></div>
        <div v-else class="space-y-2 sm:col-span-2"><Label for="contingencia">Taxa de contingência (R$)</Label><Input id="contingencia" v-model="contingencia" type="number" min="0" step="0.01" /><p class="text-xs text-muted-foreground">Deixe vazio para recusar endereços fora das zonas.</p></div>

        <div class="flex items-center justify-between rounded-lg border p-4 sm:col-span-2"><div><Label>Cardápio publicado</Label><p class="text-xs text-muted-foreground">Clientes poderão consultar e criar pedidos.</p></div><Switch v-model="form.ativo" :disabled="!dadosPublicacaoValidos" /></div>
        <div class="flex items-center justify-between rounded-lg border p-4 sm:col-span-2"><div><Label>QR direto para produção</Label><p class="text-xs text-muted-foreground">Desative para exigir aprovação da equipe.</p></div><Switch v-model="form.pedidosQrDireto" /></div>
        <div class="flex items-center justify-between rounded-lg border p-4"><div><Label>Retirada</Label><p class="text-xs text-muted-foreground">Permitir retirada no local.</p></div><Switch v-model="form.retiradaAtiva" /></div>
        <div class="flex items-center justify-between rounded-lg border p-4"><div><Label>Delivery</Label><p class="text-xs text-muted-foreground">Permitir entrega própria.</p></div><Switch v-model="form.deliveryAtivo" /></div>
        <div class="flex items-center justify-between rounded-lg border p-4"><div><Label>Pagamento online</Label><p class="text-xs text-muted-foreground">Pix e Checkout Pro do Mercado Pago.</p></div><Switch v-model="form.pagamentoOnlineAtivo" /></div>
        <div class="flex items-center justify-between rounded-lg border p-4"><div><Label>Pagamento no local</Label><p class="text-xs text-muted-foreground">Pagar na entrega ou retirada.</p></div><Switch v-model="form.pagamentoNaEntregaAtivo" /></div>
        <div class="flex justify-end sm:col-span-2"><Button :disabled="saving || !dadosPublicacaoValidos" @click="salvar"><LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" /><Save v-else class="mr-2 h-4 w-4" />Salvar</Button></div>
      </CardContent>
    </Card>

    <Card v-if="form.modoFrete === 'ZONAS'">
      <CardHeader class="flex-row items-start justify-between gap-4">
        <div><CardTitle>Zonas de entrega</CardTitle><CardDescription>A maior prioridade vence quando mais de uma zona corresponde ao endereço.</CardDescription></div>
        <Button size="sm" @click="newZone"><Plus class="mr-2 h-4 w-4" />Nova zona</Button>
      </CardHeader>
      <CardContent>
        <div v-if="!zones.length" class="rounded-xl border border-dashed p-8 text-center"><MapPin class="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p class="font-medium">Nenhuma zona cadastrada</p><p class="text-sm text-muted-foreground">Sem contingência, pedidos de delivery serão recusados.</p></div>
        <div v-else class="grid gap-3 md:grid-cols-2">
          <button v-for="zone in zones" :key="zone.id" type="button" class="rounded-xl border bg-card p-4 text-left transition-colors hover:bg-muted/40" @click="editZone(zone)">
            <div class="flex items-start justify-between gap-3"><div><p class="font-medium">{{ zone.nome }}</p><p class="text-xs text-muted-foreground">Prioridade {{ zone.prioridade }}</p></div><Badge :variant="zone.ativa ? 'secondary' : 'outline'">{{ zone.ativa ? 'Ativa' : 'Inativa' }}</Badge></div>
            <p class="mt-3 text-sm text-muted-foreground">{{ zone.cidade || 'Qualquer cidade' }}<span v-if="zone.bairros.length"> · {{ zone.bairros.join(', ') }}</span></p>
            <div class="mt-3 flex items-center justify-between text-sm"><span>Taxa {{ Number(zone.taxa).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) }}</span><Pencil class="h-4 w-4" /></div>
          </button>
        </div>
      </CardContent>
    </Card>

    <Dialog v-model:open="zoneDialogOpen">
      <DialogContent class="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader><DialogTitle>{{ editingZoneId ? 'Editar zona' : 'Nova zona de entrega' }}</DialogTitle><DialogDescription>Combine cidade, bairros e intervalo de CEP. Campos vazios não restringem a correspondência.</DialogDescription></DialogHeader>
        <div class="grid gap-4 py-2 sm:grid-cols-2">
          <div class="space-y-2"><Label>Nome</Label><Input v-model="zoneForm.nome" placeholder="Ex.: Centro" /></div>
          <div class="space-y-2"><Label>Cidade</Label><Input :model-value="zoneForm.cidade ?? ''" @update:model-value="zoneForm.cidade = String($event) || null" /></div>
          <div class="space-y-2 sm:col-span-2"><Label>Bairros</Label><Input v-model="bairrosText" placeholder="Centro, Bela Vista, Jardins" /><p class="text-xs text-muted-foreground">Separe os bairros por vírgula.</p></div>
          <div class="space-y-2"><Label>CEP inicial</Label><Input :model-value="zoneForm.cepInicial ?? ''" placeholder="00000000" @update:model-value="zoneForm.cepInicial = String($event) || null" /></div>
          <div class="space-y-2"><Label>CEP final</Label><Input :model-value="zoneForm.cepFinal ?? ''" placeholder="99999999" @update:model-value="zoneForm.cepFinal = String($event) || null" /></div>
          <div class="space-y-2"><Label>Taxa (R$)</Label><Input v-model.number="zoneForm.taxa" type="number" min="0" step="0.01" /></div>
          <div class="space-y-2"><Label>Pedido mínimo (R$)</Label><Input v-model.number="zoneForm.pedidoMinimo" type="number" min="0" step="0.01" /></div>
          <div class="space-y-2"><Label>Frete grátis acima de (R$)</Label><Input :model-value="zoneForm.freteGratisAcima ?? ''" type="number" min="0" step="0.01" @update:model-value="zoneForm.freteGratisAcima = $event === '' ? null : Number($event)" /></div>
          <div class="space-y-2"><Label>Prioridade</Label><Input v-model.number="zoneForm.prioridade" type="number" /></div>
          <div class="flex items-center justify-between rounded-lg border p-4 sm:col-span-2"><div><Label>Zona ativa</Label><p class="text-xs text-muted-foreground">Somente zonas ativas participam do checkout.</p></div><Switch v-model="zoneForm.ativa" /></div>
        </div>
        <DialogFooter><Button variant="outline" @click="zoneDialogOpen = false">Cancelar</Button><Button :disabled="savingZone || zoneForm.nome.trim().length < 2" @click="saveZone"><LoaderCircle v-if="savingZone" class="mr-2 h-4 w-4 animate-spin" />Salvar zona</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
