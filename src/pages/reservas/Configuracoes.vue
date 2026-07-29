<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { ReservationsRepository, type ReservationResource, type ReservationService, type PaymentPolicy } from '@/repositories/reservas-gerais-repository'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { moneyMaskOptions } from '@/lib/imaska'
import { formatToNumberValue } from '@/utils/formatters'
import { vMaska } from 'maska/vue'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronUp, ExternalLink, MessageCircle, Palette, Save, Settings2, Trash2, WalletCards, Wrench } from 'lucide-vue-next'
import { FONT_OPTIONS } from '@/utils/themeCustomization'

const toast = useToast()
const confirm = useConfirm()
const saving = ref(false)
const config = reactive<any>({})
const resources = ref<ReservationResource[]>([])
const configured = ref<ReservationService[]>([])
const serviceForm = reactive({
  serviceId: null as number | null, durationMinutes: 60, bufferBeforeMinutes: 0, bufferAfterMinutes: 0,
  paymentPolicy: 'NENHUM' as PaymentPolicy, fixedDeposit: undefined as number | string | undefined,
  percentageDeposit: undefined as number | undefined, active: true, public: true,
  allowAnyResource: true, resourceIds: [] as number[],
})
const publicUrl = computed(() => config.slug ? `${window.location.origin}/reservar/${config.slug}` : '')
const reservationFont = computed({
  get: () => {
    const selected = String(config.themeConfig?.font || 'Inter')
    return FONT_OPTIONS.some((option) => option.value === selected) ? selected : 'Inter'
  },
  set: (font: string) => {
    config.themeConfig = { ...(config.themeConfig || {}), font }
  },
})
const sectionLabels: Record<string, string> = {
  apresentacao: 'Apresentação e banner',
  servicos: 'Serviços',
  agenda: 'Data e horários',
  termos: 'Termos e consentimentos',
}
const messageEvents = [
  { key: 'Pendente', title: 'Pendente de pagamento', hint: 'Enviada imediatamente após criar a reserva.' },
  { key: 'Confirmada', title: 'Reserva confirmada', hint: 'Enviada assim que o pagamento ou a confirmação ocorrer.' },
  { key: 'Lembrete', title: 'Horário próximo', hint: 'Enviada antes do início da reserva.' },
  { key: 'PosVenda', title: 'Pós-venda', hint: 'Enviada após a conclusão da reserva.' },
]
function toggleSection(key: string) {
  const current = Array.isArray(config.secoes) ? [...config.secoes] : Object.keys(sectionLabels)
  config.secoes = current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
}
function moveSection(key: string, direction: number) {
  const current = Array.isArray(config.secoes) ? [...config.secoes] : Object.keys(sectionLabels)
  const index = current.indexOf(key)
  const target = index + direction
  if (index < 0 || target < 0 || target >= current.length) return
  ;[current[index], current[target]] = [current[target], current[index]]
  config.secoes = current
}

async function load() {
  const [current, resourceList, configuredList] = await Promise.all([
    ReservationsRepository.getConfig(), ReservationsRepository.listResources(),
    ReservationsRepository.listServices(),
  ])
  Object.assign(config, current)
  resources.value = resourceList
  configured.value = configuredList
}
async function saveConfig() {
  if (config.lancamentoAutomatico && (!config.categoriaFinanceiraId || !config.contaFinanceiraId)) {
    toast.error('Selecione a categoria e a conta financeira para ativar a automação.')
    return
  }
  try {
    saving.value = true
    Object.assign(config, await ReservationsRepository.saveConfig(config))
    toast.success('Configurações salvas.')
  } catch (error: any) { toast.error(error?.response?.data?.message || 'Não foi possível salvar as configurações.') }
  finally { saving.value = false }
}
async function saveService() {
  if (!serviceForm.serviceId) {
    toast.error('Selecione um serviço cadastrado.')
    return
  }
  if (!serviceForm.resourceIds.length) {
    toast.error('Selecione pelo menos um recurso compatível.')
    return
  }
  if (Number(serviceForm.durationMinutes) <= 0) {
    toast.error('A duração do serviço deve ser maior que zero.')
    return
  }
  if (
    serviceForm.paymentPolicy === 'SINAL_PERCENTUAL'
    && (Number(serviceForm.percentageDeposit) <= 0 || Number(serviceForm.percentageDeposit) > 100)
  ) {
    toast.error('O percentual do sinal deve ficar entre 1% e 100%.')
    return
  }
  try {
    saving.value = true
    await ReservationsRepository.saveService({
      serviceId: Number(serviceForm.serviceId),
      durationMinutes: Number(serviceForm.durationMinutes),
      bufferBeforeMinutes: Number(serviceForm.bufferBeforeMinutes),
      bufferAfterMinutes: Number(serviceForm.bufferAfterMinutes),
      paymentPolicy: serviceForm.paymentPolicy,
      fixedDeposit: serviceForm.paymentPolicy === 'SINAL_FIXO' ? formatToNumberValue(serviceForm.fixedDeposit || 0) : null,
      percentageDeposit: serviceForm.paymentPolicy === 'SINAL_PERCENTUAL' ? Number(serviceForm.percentageDeposit) : null,
      active: serviceForm.active, public: serviceForm.public,
      allowAnyResource: serviceForm.allowAnyResource, resourceIds: serviceForm.resourceIds,
    })
    toast.success('Serviço configurado para reservas.')
    configured.value = await ReservationsRepository.listServices()
    Object.assign(serviceForm, {
      serviceId: null,
      durationMinutes: 60,
      bufferBeforeMinutes: 0,
      bufferAfterMinutes: 0,
      paymentPolicy: 'NENHUM',
      fixedDeposit: undefined,
      percentageDeposit: undefined,
      active: true,
      public: true,
      allowAnyResource: true,
      resourceIds: [],
    })
  } catch (error: any) { toast.error(error?.response?.data?.message || 'Não foi possível configurar o serviço.') }
  finally { saving.value = false }
}
async function deleteService(service: ReservationService) {
  const confirmed = await confirm.confirm({
    title: 'Remover serviço das reservas',
    message: `Deseja remover “${service.Servico.nome}” das reservas? O serviço continuará cadastrado no sistema.`,
    confirmText: 'Sim, remover',
    cancelText: 'Cancelar',
    colorButton: 'danger',
  })
  if (!confirmed) return
  try {
    saving.value = true
    await ReservationsRepository.deleteService(service.id)
    toast.success('Serviço removido das reservas.')
    configured.value = await ReservationsRepository.listServices()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível remover o serviço das reservas.')
  } finally {
    saving.value = false
  }
}
function toggleResource(id: number) {
  serviceForm.resourceIds = serviceForm.resourceIds.includes(id)
    ? serviceForm.resourceIds.filter((value) => value !== id) : [...serviceForm.resourceIds, id]
}
onMounted(load)
</script>

<template>
  <div class="space-y-5">
    <header class="flex flex-col gap-2 md:flex-row md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Settings2 class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Configurações de reservas
        </h2>
        <p class="text-sm text-muted-foreground">Página pública, serviços, mensagens, pagamento e financeiro.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <Button v-if="publicUrl" variant="outline" as-child>
          <a :href="publicUrl" target="_blank" rel="noopener"><ExternalLink class="mr-2 h-4 w-4" />Ver página</a>
        </Button>
        <Button :disabled="saving" @click="saveConfig"><Save class="mr-2 h-4 w-4" />Salvar configurações</Button>
      </div>
    </header>

    <Tabs default-value="page">
      <div class="mb-2">
        <TabsList class="grid h-auto rounded-lg w-full grid-cols-2 sm:grid-cols-5 lg:w-fit">
          <TabsTrigger value="page"><Palette class="mr-2 h-4 w-4 inline-flex" />Página</TabsTrigger>
          <TabsTrigger value="rules"><Settings2 class="mr-2 h-4 w-4 inline-flex" />Regras</TabsTrigger>
          <TabsTrigger value="services"><Wrench class="mr-2 h-4 w-4 inline-flex" />Serviços</TabsTrigger>
          <TabsTrigger value="messages"><MessageCircle class="mr-2 h-4 w-4 inline-flex" />Mensagens</TabsTrigger>
          <TabsTrigger value="finance" class="col-span-2 sm:col-span-1"><WalletCards class="mr-2 h-4 w-4 inline-flex" />Financeiro</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="page">
        <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card>
            <CardContent class="grid gap-4 p-5 sm:grid-cols-2">
              <div class="space-y-1.5">
                <Label for="reserva-slug">Slug público</Label>
                <Input id="reserva-slug" v-model="config.slug" name="slug" autocomplete="off" placeholder="Ex.: studio-aurora…" />
                <p class="text-xs text-muted-foreground">Usado no endereço público da agenda.</p>
              </div>
              <div class="space-y-1.5">
                <Label for="reserva-titulo">Título</Label>
                <Input id="reserva-titulo" v-model="config.titulo" name="titulo" autocomplete="off" placeholder="Ex.: Reserve seu horário…" />
              </div>
              <div class="space-y-1.5 sm:col-span-2">
                <Label for="reserva-descricao">Descrição</Label>
                <Textarea id="reserva-descricao" v-model="config.descricao" name="descricao" autocomplete="off" placeholder="Explique em poucas palavras como funciona o agendamento…" />
              </div>
              <div class="space-y-1.5 sm:col-span-2">
                <Label for="reserva-banner">Banner (URL)</Label>
                <Input id="reserva-banner" v-model="config.bannerUrl" name="banner" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="Ex.: https://site.com/imagens/banner.jpg…" />
              </div>
              <div class="space-y-1.5"><Label for="cor-primaria">Cor principal</Label><Input id="cor-primaria" v-model="config.corPrimaria" type="color" class="h-11 p-1" /></div>
              <div class="space-y-1.5"><Label for="cor-destaque">Cor de destaque</Label><Input id="cor-destaque" v-model="config.corSecundaria" type="color" class="h-11 p-1" /></div>
              <div class="space-y-1.5 sm:col-span-2">
                <Label for="fonte-pagina-publica">Fonte da página pública</Label>
                <Select v-model="reservationFont">
                  <SelectTrigger id="fonte-pagina-publica">
                    <SelectValue placeholder="Selecione a fonte" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="font in FONT_OPTIONS" :key="font.value" :value="font.value">
                      {{ font.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p class="text-xs text-muted-foreground">Aplicada em toda a experiência pública de reserva.</p>
              </div>
              <div class="space-y-1.5 sm:col-span-2">
                <Label for="reserva-termos">Termos e política de cancelamento</Label>
                <Textarea id="reserva-termos" v-model="config.termos" name="termos" autocomplete="off" class="min-h-36" placeholder="Descreva prazos, regras de cancelamento e condições de atendimento…" />
              </div>
              <div class="space-y-2 sm:col-span-2">
                <Label>Ordem e visibilidade</Label>
                <div v-for="(key, index) in (config.secoes || Object.keys(sectionLabels))" :key="key" class="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
                  <div class="flex items-center gap-3">
                    <Switch :id="`secao-${key}`" :model-value="config.secoes?.includes(key)" @update:model-value="toggleSection(key)" />
                    <Label :for="`secao-${key}`">{{ sectionLabels[key] || key }}</Label>
                  </div>
                  <div class="flex gap-1">
                    <Button type="button" size="icon" variant="ghost" :disabled="index === 0" :aria-label="`Mover ${sectionLabels[key]} para cima`" @click="moveSection(key, -1)"><ChevronUp class="h-4 w-4" /></Button>
                    <Button type="button" size="icon" variant="ghost" :disabled="index === (config.secoes || []).length - 1" :aria-label="`Mover ${sectionLabels[key]} para baixo`" @click="moveSection(key, 1)"><ChevronDown class="h-4 w-4" /></Button>
                  </div>
                </div>
                <Button v-for="key in Object.keys(sectionLabels).filter(key => !config.secoes?.includes(key))" :key="key" type="button" size="sm" variant="outline" class="mr-2" @click="toggleSection(key)">Adicionar {{ sectionLabels[key] }}</Button>
              </div>
              <div class="flex items-center justify-between gap-4 rounded-lg border p-4 sm:col-span-2">
                <div><Label for="pagina-publica-ativa">Página pública ativa</Label><p class="text-xs text-muted-foreground">Permite que visitantes criem novas reservas.</p></div>
                <Switch id="pagina-publica-ativa" v-model="config.ativo" />
              </div>
            </CardContent>
          </Card>

          <aside class="h-fit overflow-hidden rounded-3xl border bg-white text-slate-900 shadow-xl" :style="{ '--app-font': reservationFont }">
            <div class="h-28 bg-cover bg-center" :style="{ backgroundColor: config.corPrimaria, backgroundImage: config.bannerUrl ? `url(${config.bannerUrl})` : undefined }" />
            <div class="p-6">
              <span class="text-xs font-bold uppercase tracking-[.2em]" :style="{ color: config.corPrimaria }">Agende online</span>
              <h3 class="mt-2 text-pretty text-2xl font-bold">{{ config.titulo || 'Reserve seu horário' }}</h3>
              <p class="mt-2 break-words text-sm text-slate-500">{{ config.descricao || 'Escolha o serviço, profissional e melhor horário.' }}</p>
              <div class="mt-5 w-full rounded-xl p-3 text-center font-semibold text-white" :style="{ backgroundColor: config.corPrimaria }">Ver horários</div>
            </div>
          </aside>
        </div>
      </TabsContent>

      <TabsContent value="rules">
        <Card>
          <CardHeader><CardTitle>Regras operacionais</CardTitle><p class="text-sm text-muted-foreground">Defina os limites usados no cálculo de disponibilidade.</p></CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div class="space-y-1.5"><Label for="timezone">Fuso horário</Label><Input id="timezone" v-model="config.timezone" autocomplete="off" placeholder="Ex.: America/Sao_Paulo…" /></div>
            <div class="space-y-1.5"><Label for="antecedencia-minima">Antecedência mínima (min)</Label><Input id="antecedencia-minima" v-model.number="config.antecedenciaMinimaMinutos" type="number" min="0" inputmode="numeric" placeholder="Ex.: 60…" /></div>
            <div class="space-y-1.5"><Label for="horizonte-dias">Horizonte (dias)</Label><Input id="horizonte-dias" v-model.number="config.horizonteDias" type="number" min="1" max="31" inputmode="numeric" placeholder="Ex.: 31…" /></div>
            <div class="space-y-1.5"><Label for="hold-pagamento">Hold de pagamento (min)</Label><Input id="hold-pagamento" v-model.number="config.expiracaoPagamentoMinutos" type="number" min="1" inputmode="numeric" placeholder="Ex.: 15…" /></div>
            <div class="space-y-1.5"><Label for="prazo-remarcacao">Remarcação até (horas)</Label><Input id="prazo-remarcacao" v-model.number="config.antecedenciaRemarcacaoHoras" type="number" min="0" inputmode="numeric" placeholder="Ex.: 24…" /></div>
            <div class="space-y-1.5"><Label for="prazo-cancelamento">Cancelamento até (horas)</Label><Input id="prazo-cancelamento" v-model.number="config.antecedenciaCancelamentoHoras" type="number" min="0" inputmode="numeric" placeholder="Ex.: 24…" /></div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="services">
        <div class="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Novo serviço reservável</CardTitle><p class="text-sm text-muted-foreground">Conecte um serviço existente aos recursos e regras da agenda.</p></CardHeader>
            <CardContent class="space-y-4">
              <div class="space-y-1.5"><Label>Serviço cadastrado</Label><Select2Ajax v-model="serviceForm.serviceId" url="/servicos/select2" required placeholder="Busque um serviço…" /></div>
              <div class="grid gap-3 sm:grid-cols-3">
                <div class="space-y-1.5"><Label for="duracao">Duração (min)</Label><Input id="duracao" v-model.number="serviceForm.durationMinutes" type="number" min="1" inputmode="numeric" placeholder="Ex.: 60…" /></div>
                <div class="space-y-1.5"><Label for="intervalo-antes">Intervalo antes</Label><Input id="intervalo-antes" v-model.number="serviceForm.bufferBeforeMinutes" type="number" min="0" inputmode="numeric" placeholder="Ex.: 10…" /></div>
                <div class="space-y-1.5"><Label for="intervalo-depois">Intervalo depois</Label><Input id="intervalo-depois" v-model.number="serviceForm.bufferAfterMinutes" type="number" min="0" inputmode="numeric" placeholder="Ex.: 10…" /></div>
              </div>
              <div class="space-y-1.5">
                <Label>Pagamento</Label>
                <Select v-model="serviceForm.paymentPolicy">
                  <SelectTrigger><SelectValue placeholder="Selecione a política" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NENHUM">Sem pagamento online</SelectItem>
                    <SelectItem value="INTEGRAL">Pagamento integral</SelectItem>
                    <SelectItem value="SINAL_FIXO">Sinal fixo</SelectItem>
                    <SelectItem value="SINAL_PERCENTUAL">Sinal percentual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div v-if="serviceForm.paymentPolicy === 'SINAL_FIXO'" class="space-y-1.5"><Label for="valor-sinal">Valor do sinal</Label><Input id="valor-sinal" v-model="serviceForm.fixedDeposit" v-maska="moneyMaskOptions" type="text" inputmode="decimal" placeholder="Ex.: 50,00" /></div>
              <div v-if="serviceForm.paymentPolicy === 'SINAL_PERCENTUAL'" class="space-y-1.5"><Label for="percentual-sinal">Percentual do sinal</Label><Input id="percentual-sinal" v-model.number="serviceForm.percentageDeposit" type="number" min="1" max="100" inputmode="numeric" placeholder="Ex.: 30…" /></div>
              <div>
                <Label>Recursos compatíveis</Label>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button v-for="resource in resources" :key="resource.id" type="button" class="rounded-full border px-3 py-1.5 text-sm transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" :class="serviceForm.resourceIds.includes(resource.id) ? 'border-primary bg-primary text-primary-foreground' : ''" @click="toggleResource(resource.id)">{{ resource.nome }}</button>
                  <p v-if="!resources.length" class="text-sm text-muted-foreground">Cadastre um recurso antes de configurar o serviço.</p>
                </div>
              </div>
              <div class="grid gap-3 sm:grid-cols-2">
                <div class="flex items-center justify-between rounded-lg border p-3"><Label for="servico-publico">Visível ao público</Label><Switch id="servico-publico" v-model="serviceForm.public" /></div>
                <div class="flex items-center justify-between rounded-lg border p-3"><Label for="qualquer-recurso">Permitir qualquer recurso</Label><Switch id="qualquer-recurso" v-model="serviceForm.allowAnyResource" /></div>
              </div>
              <Button class="w-full sm:w-auto" :disabled="saving || !serviceForm.serviceId || !serviceForm.resourceIds.length" @click="saveService">Salvar serviço reservável</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Serviços publicados</CardTitle><p class="text-sm text-muted-foreground">{{ configured.length }} configurações cadastradas.</p></CardHeader>
            <CardContent class="space-y-3">
              <div v-for="service in configured" :key="service.id" class="rounded-xl border p-4">
                <div class="flex min-w-0 items-center justify-between gap-3">
                  <b class="truncate">{{ service.Servico.nome }}</b>
                  <div class="flex shrink-0 items-center gap-2">
                    <span class="text-sm tabular-nums text-muted-foreground">{{ service.duracaoMinutos }} min</span>
                    <Button size="icon" variant="ghost" class="h-8 w-8 text-destructive hover:text-destructive" :disabled="saving" :aria-label="`Remover ${service.Servico.nome} das reservas`" @click="deleteService(service)">
                      <Trash2 class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p class="mt-1 break-words text-sm text-muted-foreground">{{ service.Recursos.map(item => item.Recurso.nome).join(', ') }} · {{ service.politicaPagamento.replace(/_/g, ' ') }}</p>
              </div>
              <p v-if="!configured.length" class="py-16 text-center text-muted-foreground">Nenhum serviço publicado.</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="messages">
        <div class="grid gap-4 lg:grid-cols-2">
          <Card v-for="item in messageEvents" :key="item.key">
            <CardHeader>
              <div class="flex items-start justify-between gap-4"><div><CardTitle class="text-lg">{{ item.title }}</CardTitle><p class="mt-1 text-sm text-muted-foreground">{{ item.hint }}</p></div><Switch :id="`mensagem-${item.key}`" v-model="(config as any)[`whatsapp${item.key}Ativo`]" :aria-label="`Ativar mensagem ${item.title}`" /></div>
            </CardHeader>
            <CardContent class="space-y-3">
              <div v-if="['Lembrete','PosVenda'].includes(item.key)" class="space-y-1.5"><Label :for="`horas-${item.key}`">Intervalo em horas</Label><Input :id="`horas-${item.key}`" v-model.number="(config as any)[`whatsapp${item.key}Horas`]" type="number" min="0" inputmode="numeric" placeholder="Ex.: 24…" /></div>
              <div class="space-y-1.5"><Label :for="`template-${item.key}`">Mensagem</Label><Textarea :id="`template-${item.key}`" v-model="(config as any)[`whatsapp${item.key}Template`]" class="min-h-32" autocomplete="off" placeholder="Ex.: Olá, {cliente}! Sua reserva de {servico} está confirmada para {data} às {hora}…" /></div>
              <p class="break-words text-xs text-muted-foreground">Variáveis: {cliente}, {empresa}, {servico}, {recurso}, {data}, {hora}, {valor}, {link_pagamento}, {link_reserva}</p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="finance">
        <Card>
          <CardHeader><CardTitle>Automação financeira</CardTitle><p class="text-sm text-muted-foreground">Defina onde as receitas das reservas serão registradas.</p></CardHeader>
          <CardContent class="grid gap-4 sm:grid-cols-2">
            <div class="flex items-center justify-between gap-4 rounded-lg border p-4 sm:col-span-2"><div><Label for="lancamento-automatico">Criar lançamento automaticamente</Label><p class="text-xs text-muted-foreground">A confirmação do pagamento gera a receita conforme a política do serviço.</p></div><Switch id="lancamento-automatico" v-model="config.lancamentoAutomatico" /></div>
            <div class="space-y-1.5"><Label>Categoria financeira</Label><Select2Ajax v-model="config.categoriaFinanceiraId" url="/lancamentos/categorias/select2" :disabled="!config.lancamentoAutomatico" allow-clear placeholder="Busque a categoria…" /></div>
            <div class="space-y-1.5"><Label>Conta financeira</Label><Select2Ajax v-model="config.contaFinanceiraId" url="/lancamentos/contas/select2" :disabled="!config.lancamentoAutomatico" allow-clear placeholder="Busque a conta…" /></div>
            <p class="sm:col-span-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">Pagamento integral cria receita quitada. Em sinal, o valor total é lançado e a entrada fica registrada, mantendo o saldo pendente.</p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
