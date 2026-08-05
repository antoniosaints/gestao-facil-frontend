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
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import HelpTooltip from './components/HelpTooltip.vue'
import {
  RestauranteRepository,
  type RestauranteConfig,
  type RestauranteZonaEntrega,
  type RestauranteZonaPayload,
  type RestaurantePapel,
  type RestauranteUsuarioPapeis,
} from '@/repositories/restaurante-repository'
import {
  CircleCheck,
  CreditCard,
  Globe2,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Truck,
} from 'lucide-vue-next'

const toast = useToast()
const loading = ref(true)
const saving = ref(false)
const savingZone = ref(false)
const zoneDialogOpen = ref(false)
const editingZoneId = ref<number | undefined>()
const zones = ref<RestauranteZonaEntrega[]>([])
const users = ref<RestauranteUsuarioPapeis[]>([])
const savingUserId = ref<number | null>(null)
const roleOptions: Array<{ value: RestaurantePapel; label: string }> = [
  { value: 'GESTOR', label: 'Gestor' },
  { value: 'CAIXA', label: 'Caixa' },
  { value: 'GARCOM', label: 'Garçom' },
  { value: 'COZINHA', label: 'Cozinha' },
  { value: 'EXPEDICAO', label: 'Expedição' },
]
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
    const [data, deliveryZones, restaurantUsers] = await Promise.all([
      RestauranteRepository.configuracao(),
      RestauranteRepository.zonasEntrega(),
      RestauranteRepository.usuariosPapeis(),
    ])
    if (data) Object.assign(form, data)
    zones.value = deliveryZones
    users.value = restaurantUsers
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar a configuração.')
  } finally {
    loading.value = false
  }
}

function toggleRole(user: RestauranteUsuarioPapeis, role: RestaurantePapel, checked: boolean) {
  user.papeis = checked ? [...new Set([...user.papeis, role])] : user.papeis.filter((item) => item !== role)
}

async function saveUserRoles(user: RestauranteUsuarioPapeis) {
  try {
    savingUserId.value = user.id
    const result = await RestauranteRepository.salvarUsuarioPapeis(user.id, user.papeis)
    user.papeis = result.papeis
    toast.success(`Papéis de ${user.nome} atualizados`)
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || error?.response?.data?.message || 'Não foi possível atualizar os papéis.')
  } finally {
    savingUserId.value = null
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
  <section class="mx-auto max-w-6xl space-y-5">
    <header class="flex items-start gap-3">
      <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Settings2 class="h-5 w-5" />
      </div>
      <div>
        <h1 class="text-balance text-2xl font-semibold tracking-tight">Configurações do restaurante</h1>
        <p class="text-pretty text-sm text-muted-foreground">Organize a publicação, o atendimento, as entregas e os acessos da equipe.</p>
      </div>
    </header>

    <Tabs default-value="cardapio" class="space-y-4">
      <TabsList class="grid h-auto w-full grid-cols-2 rounded-md gap-1 p-1 sm:grid-cols-3">
        <TabsTrigger value="cardapio"><Globe2 class="mr-2 h-4 w-4 inline-flex" />Cardápio e pedidos</TabsTrigger>
        <TabsTrigger value="entregas"><Truck class="mr-2 h-4 w-4 inline-flex" />Zonas de entrega</TabsTrigger>
        <TabsTrigger value="equipe"><ShieldCheck class="mr-2 h-4 w-4 inline-flex" />Equipe e acessos</TabsTrigger>
      </TabsList>

      <TabsContent value="equipe" class="mt-0">
    <Card>
      <CardHeader class="pb-3">
        <div class="flex items-start justify-between gap-3">
          <div><CardTitle class="flex items-center gap-2"><ShieldCheck class="h-5 w-5 text-primary" />Equipe e papéis</CardTitle>
          <CardDescription>Defina quais telas e operações cada pessoa pode acessar. Administradores continuam com acesso de gestor.</CardDescription></div>
          <HelpTooltip text="Os papéis limitam somente as funções do módulo Restaurante. Administradores da conta mantêm acesso completo." />
        </div>
      </CardHeader>
      <CardContent class="space-y-3">
        <Alert><AlertDescription>Ao salvar o primeiro papel da conta, usuários sem papel deixam de acessar o Restaurante.</AlertDescription></Alert>
        <div class="grid gap-3 lg:grid-cols-2">
          <div v-for="user in users" :key="user.id" class="rounded-xl border p-3">
            <div class="mb-3 flex items-start justify-between gap-3">
              <div class="min-w-0"><p class="truncate text-sm font-medium">{{ user.nome }}</p><p class="truncate text-xs text-muted-foreground">{{ user.email }}</p></div>
              <Badge :variant="user.status === 'ATIVO' ? 'secondary' : 'outline'">{{ user.status === 'ATIVO' ? 'Ativo' : 'Inativo' }}</Badge>
            </div>
            <div class="flex flex-wrap gap-x-4 gap-y-2">
              <label v-for="role in roleOptions" :key="role.value" class="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox :model-value="user.papeis.includes(role.value)" @update:model-value="toggleRole(user, role.value, Boolean($event))" />
                {{ role.label }}
              </label>
            </div>
            <div class="mt-3 flex justify-end"><Button size="sm" :disabled="savingUserId === user.id" @click="saveUserRoles(user)"><LoaderCircle v-if="savingUserId === user.id" class="mr-2 h-4 w-4 animate-spin" /><Save v-else class="mr-2 h-4 w-4" />Salvar papéis</Button></div>
          </div>
        </div>
      </CardContent>
    </Card>
      </TabsContent>

      <TabsContent value="cardapio" class="mt-0">
    <Card>
      <CardHeader>
        <div class="flex items-start justify-between gap-3">
          <div><CardTitle class="flex items-center gap-2"><Globe2 class="h-5 w-5 text-primary" />Cardápio e atendimento</CardTitle>
          <CardDescription>Defina como o cliente encontra o cardápio, faz o pedido e escolhe o pagamento.</CardDescription></div>
          <HelpTooltip text="Publicar o cardápio não ativa nem desativa o módulo na conta. Essa opção controla apenas o acesso dos clientes ao endereço público." />
        </div>
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
        <div class="rounded-lg bg-muted/40 p-3 sm:col-span-2">
          <div class="flex items-center gap-2 text-sm font-medium"><CreditCard class="h-4 w-4 text-primary" />Regras do pedido</div>
          <p class="mt-1 text-xs text-muted-foreground">Valores, entrega e formas de pagamento disponíveis no checkout.</p>
        </div>
        <div class="space-y-2"><Label for="minimo">Pedido mínimo (R$)</Label><Input id="minimo" v-model.number="form.pedidoMinimo" type="number" min="0" step="0.01" /></div>
        <div class="space-y-2">
          <Label>Modelo de frete</Label>
          <Select v-model="form.modoFrete"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="FIXO">Taxa fixa</SelectItem><SelectItem value="ZONAS">Zonas por endereço</SelectItem></SelectContent></Select>
        </div>
        <div v-if="form.modoFrete === 'FIXO'" class="space-y-2"><Label for="taxa">Taxa fixa de delivery (R$)</Label><Input id="taxa" v-model.number="form.taxaFixa" type="number" min="0" step="0.01" /></div>
        <div v-if="form.modoFrete === 'FIXO'" class="space-y-2"><Label for="gratis">Frete grátis acima de (R$)</Label><Input id="gratis" v-model="freteGratis" type="number" min="0" step="0.01" /></div>
        <div v-else class="space-y-2 sm:col-span-2"><Label for="contingencia">Taxa de contingência (R$)</Label><Input id="contingencia" v-model="contingencia" type="number" min="0" step="0.01" /><p class="text-xs text-muted-foreground">Deixe vazio para recusar endereços fora das zonas.</p></div>

        <div class="flex min-h-20 items-center justify-between gap-4 rounded-lg border p-4 sm:col-span-2"><div><Label>Cardápio publicado</Label><p class="text-pretty text-xs text-muted-foreground">Clientes poderão consultar o menu e criar pedidos pelo endereço público.</p></div><Switch v-model="form.ativo" :disabled="!dadosPublicacaoValidos" /></div>
        <div class="flex items-center justify-between rounded-lg border p-4 sm:col-span-2"><div><Label>QR direto para produção</Label><p class="text-xs text-muted-foreground">Desative para exigir aprovação da equipe.</p></div><Switch v-model="form.pedidosQrDireto" /></div>
        <div class="flex items-center justify-between rounded-lg border p-4"><div><Label>Retirada</Label><p class="text-xs text-muted-foreground">Permitir retirada no local.</p></div><Switch v-model="form.retiradaAtiva" /></div>
        <div class="flex items-center justify-between rounded-lg border p-4"><div><Label>Delivery</Label><p class="text-xs text-muted-foreground">Permitir entrega própria.</p></div><Switch v-model="form.deliveryAtivo" /></div>
        <div class="flex items-center justify-between rounded-lg border p-4"><div><Label>Pagamento online</Label><p class="text-xs text-muted-foreground">Pix e Checkout Pro do Mercado Pago.</p></div><Switch v-model="form.pagamentoOnlineAtivo" /></div>
        <div class="flex items-center justify-between rounded-lg border p-4"><div><Label>Pagamento no local</Label><p class="text-xs text-muted-foreground">Pagar na entrega ou retirada.</p></div><Switch v-model="form.pagamentoNaEntregaAtivo" /></div>
        <div class="flex justify-end sm:col-span-2"><Button :disabled="saving || !dadosPublicacaoValidos" @click="salvar"><LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" /><Save v-else class="mr-2 h-4 w-4" />Salvar</Button></div>
      </CardContent>
    </Card>
      </TabsContent>

      <TabsContent value="entregas" class="mt-0 space-y-4">
    <Card v-if="form.modoFrete === 'ZONAS'">
      <CardHeader class="flex-row items-start justify-between gap-4">
        <div class="flex min-w-0 items-start gap-1"><div><CardTitle class="flex items-center gap-2"><MapPin class="h-5 w-5 text-primary" />Zonas de entrega</CardTitle><CardDescription>A maior prioridade vence quando mais de uma zona corresponde ao endereço.</CardDescription></div><HelpTooltip text="Crie uma zona para cada região atendida. Se duas zonas aceitarem o mesmo endereço, será usada a de maior prioridade." /></div>
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
    <Card v-else>
      <CardContent class="flex flex-col items-center justify-center p-10 text-center">
        <Truck class="mb-3 h-9 w-9 text-muted-foreground" />
        <p class="font-medium">O frete está configurado como taxa fixa</p>
        <p class="mt-1 max-w-md text-pretty text-sm text-muted-foreground">Selecione “Zonas por endereço” na aba Cardápio e pedidos e salve para cadastrar regiões com taxas diferentes.</p>
      </CardContent>
    </Card>
      </TabsContent>
    </Tabs>

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
