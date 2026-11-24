<script setup lang="ts">
import { computed, onMounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  Bell,
  CalendarClock,
  ChevronDown,
  LoaderCircle,
  Mail,
  MessageCircle,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import SubscribeNotification from '@/components/layout/subscribeNotification.vue'
import {
  ContaRepository,
  type WhatsAppNotificationInstanceOption,
} from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import type { UpdateParametrosConta } from '@/types/schemas'

const props = defineProps<{ focusWhatsApp?: boolean }>()
const ui = useUiStore()
const toast = useToast()
const channelGrid = useTemplateRef<HTMLDivElement>('channelGrid')
const hasWhatsApp = computed(() => ui.hasActiveModule('whatsapp'))
const instances = ref<WhatsAppNotificationInstanceOption[]>([])
const loadingInstances = ref(false)
const instancesError = ref(false)
const loaded = ref(false)
const loadError = ref(false)
const saving = ref<Channel['key'] | 'schedule' | null>(null)

const defaults = {
  pushNotificacoesAtivo: true,
  eventoVendaConcluida: true,
  eventoEstoqueBaixo: true,
  eventoProdutoAlterado: true,
  eventoSangria: false,
  pushEventoVencimentoFinanceiro: true,
  emailNotificacoesAtivo: false,
  emailEventoEstoqueBaixo: true,
  emailEventoVencimentoFinanceiro: true,
  whatsappNotificacoesAtivo: false,
  whatsappEventoNovaVenda: true,
  whatsappEventoVendaConcluida: true,
  whatsappEventoEstoqueBaixo: false,
  whatsappEventoProdutoAlterado: false,
  whatsappEventoSangria: false,
  whatsappEventoNovaOs: true,
  whatsappEventoNovoLancamento: true,
  whatsappEventoNovoCliente: true,
  whatsappEventoComandaFaturada: true,
  whatsappEventoCaixaAberto: true,
  whatsappEventoCaixaFechado: true,
  whatsappEventoVencimentoFinanceiro: true,
  financeiroVencimentosNotificacoesAtivo: true,
}

const form = reactive({
  ...defaults,
  emailAvisos: '',
  whatsappNotificacoesInstanciaId: null as number | null,
})

const channels = [
  {
    key: 'push',
    title: 'Push',
    icon: Bell,
    description: 'Envia avisos aos navegadores inscritos com push ativo no perfil.',
    switchLabel: 'Ativar notificações push',
    enabledField: 'pushNotificacoesAtivo',
    events: [
      { field: 'eventoVendaConcluida', label: 'Venda concluída' },
      { field: 'eventoEstoqueBaixo', label: 'Estoque baixo' },
      {
        field: 'eventoProdutoAlterado',
        label: 'Alterações de produtos',
        description: 'Inclui cadastros, edições, exclusões, reposições e descartes.',
      },
      { field: 'eventoSangria', label: 'Sangria de caixa' },
      { field: 'pushEventoVencimentoFinanceiro', label: 'Vencimentos financeiros' },
    ],
  },
  {
    key: 'email',
    title: 'E-mail',
    icon: Mail,
    description: 'Envia alertas de estoque e de vencimento ao endereço da conta.',
    switchLabel: 'Ativar notificações por e-mail',
    enabledField: 'emailNotificacoesAtivo',
    events: [
      { field: 'emailEventoEstoqueBaixo', label: 'Estoque baixo' },
      { field: 'emailEventoVencimentoFinanceiro', label: 'Vencimentos financeiros' },
    ],
  },
  {
    key: 'whatsapp',
    title: 'WhatsApp',
    icon: MessageCircle,
    description: 'Envia avisos da operação à equipe usando a instância escolhida.',
    switchLabel: 'Ativar notificações por WhatsApp',
    enabledField: 'whatsappNotificacoesAtivo',
    events: [
      { field: 'whatsappEventoNovaVenda', label: 'Nova venda' },
      { field: 'whatsappEventoVendaConcluida', label: 'Venda concluída no PDV' },
      { field: 'whatsappEventoEstoqueBaixo', label: 'Estoque baixo' },
      {
        field: 'whatsappEventoProdutoAlterado',
        label: 'Alterações de produtos',
        description: 'Inclui cadastros, edições, exclusões, reposições e descartes.',
      },
      { field: 'whatsappEventoSangria', label: 'Sangria de caixa' },
      { field: 'whatsappEventoNovaOs', label: 'Nova ordem de serviço' },
      { field: 'whatsappEventoNovoLancamento', label: 'Novo lançamento' },
      { field: 'whatsappEventoNovoCliente', label: 'Novo cliente' },
      { field: 'whatsappEventoComandaFaturada', label: 'Comanda faturada' },
      { field: 'whatsappEventoCaixaAberto', label: 'Caixa aberto' },
      { field: 'whatsappEventoCaixaFechado', label: 'Caixa fechado' },
      { field: 'whatsappEventoVencimentoFinanceiro', label: 'Vencimentos financeiros' },
    ],
  },
] as const

type Channel = (typeof channels)[number]

const hasSelectedInstance = computed(() =>
  instances.value.some((instance) => instance.id === form.whatsappNotificacoesInstanciaId),
)

async function loadSettings() {
  loadError.value = false
  try {
    const { data } = await ContaRepository.getParametros()
    for (const field of Object.keys(defaults) as (keyof typeof defaults)[]) {
      form[field] = data?.[field] ?? defaults[field]
    }
    form.emailAvisos = data?.emailAvisos ?? ''
    form.whatsappNotificacoesInstanciaId = data?.whatsappNotificacoesInstanciaId ?? null
    loaded.value = true
  } catch {
    loadError.value = true
  }
}

async function loadInstances() {
  if (!hasWhatsApp.value || loadingInstances.value) return
  loadingInstances.value = true
  instancesError.value = false
  try {
    instances.value = await ContaRepository.listarInstanciasWhatsappNotificacao()
  } catch {
    instancesError.value = true
  } finally {
    loadingInstances.value = false
  }
}

async function save(section: Channel['key'] | 'schedule', settings: UpdateParametrosConta) {
  if (!loaded.value || saving.value) return
  saving.value = section
  try {
    await ContaRepository.parametros(settings)
    toast.success('Preferências de notificação salvas.')
  } catch (error) {
    const message = (error as { response?: { data?: { message?: string } } }).response?.data
      ?.message
    toast.error(message || 'Não foi possível salvar as preferências.')
  } finally {
    saving.value = null
  }
}

function saveChannel(channel: Channel) {
  const enabled = form[channel.enabledField]
  if (channel.key === 'whatsapp' && (!hasWhatsApp.value || (enabled && !hasSelectedInstance.value)))
    return

  const settings: UpdateParametrosConta = { [channel.enabledField]: enabled }
  for (const event of channel.events) settings[event.field] = form[event.field]
  if (channel.key === 'email') settings.emailAvisos = form.emailAvisos.trim() || null
  if (channel.key === 'whatsapp')
    settings.whatsappNotificacoesInstanciaId = form.whatsappNotificacoesInstanciaId
  void save(channel.key, settings)
}

watch(
  hasWhatsApp,
  (active) => {
    if (active) void loadInstances()
  },
  { immediate: true },
)
watch(
  [loaded, () => props.focusWhatsApp],
  ([ready, focus]) => {
    if (ready && focus)
      channelGrid.value
        ?.querySelector('#notificacoes-whatsapp')
        ?.scrollIntoView?.({ block: 'start' })
  },
  { flush: 'post' },
)
onMounted(loadSettings)
</script>

<template>
  <div class="space-y-5">
    <header>
      <h2 class="text-lg font-semibold">Canais de notificação</h2>
      <p class="text-sm text-muted-foreground">
        Escolha os canais e eventos que a equipe recebe. Salve cada canal separadamente.
      </p>
    </header>

    <div
      v-if="loadError"
      class="flex flex-wrap items-center gap-3 rounded-xl border p-4"
      role="alert"
    >
      <p class="text-sm">Não foi possível carregar as preferências de notificação.</p>
      <Button type="button" variant="outline" @click="loadSettings">Tentar novamente</Button>
    </div>
    <p
      v-else-if="!loaded"
      class="flex items-center gap-2 text-sm text-muted-foreground"
      role="status"
    >
      <LoaderCircle class="size-4 animate-spin" aria-hidden="true" /> Carregando preferências…
    </p>

    <template v-else>
      <div ref="channelGrid" class="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
        <form
          v-for="channel in channels"
          :id="`notificacoes-${channel.key}`"
          :key="channel.key"
          :aria-labelledby="`titulo-${channel.key}`"
          class="min-w-0 space-y-4 scroll-mt-24 rounded-xl border bg-card p-4 text-card-foreground sm:p-5"
          @submit.prevent="saveChannel(channel)"
        >
          <div class="flex items-start gap-3">
            <span
              class="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
            >
              <component :is="channel.icon" class="size-5" aria-hidden="true" />
            </span>
            <div class="min-w-0">
              <h3 :id="`titulo-${channel.key}`" class="font-semibold">{{ channel.title }}</h3>
              <p class="text-sm text-muted-foreground">{{ channel.description }}</p>
            </div>
          </div>

          <div
            v-if="channel.key === 'whatsapp' && !hasWhatsApp"
            class="space-y-3 rounded-lg border border-dashed p-3"
          >
            <p class="text-sm text-muted-foreground">
              Ative o app WhatsApp para configurar este canal.
            </p>
            <Button as-child variant="outline" size="sm">
              <RouterLink :to="{ name: 'loja-home', query: { app: 'whatsapp' } }"
                >Ativar app WhatsApp</RouterLink
              >
            </Button>
          </div>

          <template v-else>
            <div
              class="flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2"
            >
              <Label :for="channel.enabledField" class="min-h-7 cursor-pointer content-center">
                {{ channel.switchLabel }}
              </Label>
              <Switch
                :id="channel.enabledField"
                v-model="form[channel.enabledField]"
                :disabled="
                  !!saving ||
                  (channel.key === 'whatsapp' &&
                    !form.whatsappNotificacoesAtivo &&
                    !instances.length)
                "
              />
            </div>

            <SubscribeNotification v-if="channel.key === 'push'" />

            <div v-if="channel.key === 'email'" class="space-y-2">
              <Label for="notificationEmail">E-mail para avisos</Label>
              <Input
                id="notificationEmail"
                v-model="form.emailAvisos"
                type="email"
                placeholder="voce@empresa.com.br"
                maxlength="191"
                :required="form.emailNotificacoesAtivo"
                :disabled="!!saving || !form.emailNotificacoesAtivo"
              />
              <p class="text-xs text-muted-foreground">
                Recuperação de senha e boas-vindas são enviadas pelo sistema.
              </p>
            </div>

            <div v-if="channel.key === 'whatsapp'" class="space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-x-2">
                <Label for="notificationWhatsAppInstance">Instância principal</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  :disabled="loadingInstances"
                  @click="loadInstances"
                >
                  {{ loadingInstances ? 'Atualizando…' : 'Atualizar instâncias' }}
                </Button>
              </div>
              <select
                id="notificationWhatsAppInstance"
                v-model.number="form.whatsappNotificacoesInstanciaId"
                class="h-10 w-full rounded-md border bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                :disabled="!!saving || !form.whatsappNotificacoesAtivo || !instances.length"
              >
                <option :value="null">Selecione uma instância</option>
                <option v-for="instance in instances" :key="instance.id" :value="instance.id">
                  {{ instance.nome }} · {{ instance.status }}
                </option>
              </select>
              <p v-if="instancesError" class="text-xs text-destructive" role="alert">
                Não foi possível atualizar as instâncias.
              </p>
              <p
                v-else-if="!loadingInstances && !instances.length"
                class="text-xs text-muted-foreground"
              >
                Conecte uma instância no módulo WhatsApp para ativar os avisos.
              </p>
            </div>

            <details class="group rounded-lg border">
              <summary
                class="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"
              >
                Eventos
                <ChevronDown
                  class="size-4 text-muted-foreground group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>
              <div class="divide-y border-t px-3">
                <div
                  v-for="event in channel.events"
                  :key="event.field"
                  class="flex min-h-11 items-center justify-between gap-3 py-2"
                >
                  <Label :for="event.field" class="min-w-0 cursor-pointer">
                    {{ event.label }}
                    <span
                      v-if="'description' in event"
                      class="mt-1 block text-xs font-normal text-muted-foreground"
                    >
                      {{ event.description }}
                    </span>
                  </Label>
                  <Switch
                    :id="event.field"
                    v-model="form[event.field]"
                    :disabled="!!saving || !form[channel.enabledField]"
                  />
                </div>
              </div>
            </details>

            <p v-if="channel.key === 'push'" class="text-xs text-muted-foreground">
              Avisos de reservas, cobranças e integrações também seguem o controle do canal.
            </p>

            <Button
              type="submit"
              class="w-full"
              :disabled="
                !!saving ||
                (channel.key === 'whatsapp' &&
                  form.whatsappNotificacoesAtivo &&
                  !hasSelectedInstance)
              "
            >
              {{ saving === channel.key ? 'Salvando…' : `Salvar ${channel.title}` }}
            </Button>
          </template>
        </form>
      </div>

      <form
        aria-labelledby="schedule-title"
        class="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:p-5"
        @submit.prevent="
          save('schedule', {
            financeiroVencimentosNotificacoesAtivo: form.financeiroVencimentosNotificacoesAtivo,
          })
        "
      >
        <div class="flex min-w-0 flex-1 items-start gap-3">
          <CalendarClock class="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <h3 id="schedule-title" class="font-semibold">Agenda de vencimentos</h3>
            <p class="text-sm text-muted-foreground">
              Controla os avisos de vencimento em todos os canais e os lembretes automáticos de
              inadimplência.
            </p>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <Label for="financialDueSchedule" class="cursor-pointer">Ativar agenda</Label>
          <Switch
            id="financialDueSchedule"
            v-model="form.financeiroVencimentosNotificacoesAtivo"
            :disabled="!!saving"
          />
          <Button type="submit" variant="outline" :disabled="!!saving">
            {{ saving === 'schedule' ? 'Salvando…' : 'Salvar agenda' }}
          </Button>
        </div>
      </form>
    </template>
  </div>
</template>
