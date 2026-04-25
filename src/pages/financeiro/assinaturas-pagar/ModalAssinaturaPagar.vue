<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import {
  CalendarDays,
  ImagePlus,
  Link2,
  LoaderCircle,
  PaintBucket,
  Plus,
  ReceiptText,
  Repeat2,
  Sparkles,
  Trash2,
} from 'lucide-vue-next'

import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  AssinaturaPagarRepository,
  type AssinaturaPagarPayload,
  type PeriodicidadeAssinaturaPagar,
  type StatusAssinaturaPagar,
} from '@/repositories/assinatura-pagar-repository'
import { useAssinaturasPagarStore } from '@/stores/lancamentos/useAssinaturasPagar'
import { resolveFileUrl } from '@/utils/fileUrl'

const store = useAssinaturasPagarStore()
const toast = useToast()

const saving = ref(false)
const loading = ref(false)
const iconInput = ref<HTMLInputElement | null>(null)
const iconFile = ref<File | null>(null)
const iconPreview = ref<string | null>(null)
const iconVersion = ref(0)

const periodicidadeOptions: Array<{ value: PeriodicidadeAssinaturaPagar; label: string }> = [
  { value: 'MENSAL', label: 'Mensal' },
  { value: 'ANUAL', label: 'Anual' },
  { value: 'SEMANAL', label: 'Semanal' },
  { value: 'QUINZENAL', label: 'Quinzenal' },
  { value: 'PERSONALIZADO', label: 'Personalizada' },
]

const statusOptions: Array<{ value: StatusAssinaturaPagar; label: string }> = [
  { value: 'ATIVA', label: 'Ativa' },
  { value: 'INATIVA', label: 'Inativa' },
  { value: 'CANCELADA', label: 'Cancelada' },
]

const paymentOptions = [
  { value: 'PIX', label: 'PIX' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
  { value: 'DEBITO', label: 'Débito' },
  { value: 'CREDITO', label: 'Crédito' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'OUTRO', label: 'Outro' },
]

const form = reactive<{
  id?: number
  nomeServico: string
  valor: number
  periodicidade: PeriodicidadeAssinaturaPagar
  intervaloDiasPersonalizado: number
  inicio: Date | null
  fim: Date | null
  proximoVencimento: Date | null
  status: StatusAssinaturaPagar
  gerarFinanceiro: boolean
  gerarAutomatico: boolean
  contaFinanceiraId: number | null
  categoriaId: number | null
  formaPagamento: string | null
  corDestaque: string
  observacoes: string
  icone: string | null
  links: Array<{ titulo: string; url: string }>
}>({
  nomeServico: '',
  valor: 0,
  periodicidade: 'MENSAL',
  intervaloDiasPersonalizado: 30,
  inicio: new Date(),
  fim: null,
  proximoVencimento: new Date(),
  status: 'ATIVA',
  gerarFinanceiro: true,
  gerarAutomatico: true,
  contaFinanceiraId: null,
  categoriaId: null,
  formaPagamento: 'PIX',
  corDestaque: '#6366F1',
  observacoes: '',
  icone: null,
  links: [{ titulo: '', url: '' }],
})

const modalTitle = computed(() => (store.editingId ? 'Editar assinatura a pagar' : 'Nova assinatura a pagar'))
const modalDescription = computed(() =>
  store.editingId
    ? 'Ajuste serviço, recorrência, links e regras de geração financeira sem mexer no histórico já criado.'
    : 'Cadastre uma despesa recorrente com visual próprio e, se quiser, já vincule a geração financeira do ciclo atual.',
)

const imageSrc = computed(() => {
  if (iconPreview.value) return iconPreview.value
  if (!form.icone) return null
  return resolveFileUrl(form.icone, { fallback: '/imgs/logo.png', bustCache: iconVersion.value > 0 })
})

function resetIconPreview() {
  if (iconPreview.value?.startsWith('blob:')) {
    URL.revokeObjectURL(iconPreview.value)
  }
  iconPreview.value = null
}

function resetForm() {
  form.id = undefined
  form.nomeServico = ''
  form.valor = 0
  form.periodicidade = 'MENSAL'
  form.intervaloDiasPersonalizado = 30
  form.inicio = new Date()
  form.fim = null
  form.proximoVencimento = new Date()
  form.status = 'ATIVA'
  form.gerarFinanceiro = true
  form.gerarAutomatico = true
  form.contaFinanceiraId = null
  form.categoriaId = null
  form.formaPagamento = 'PIX'
  form.corDestaque = '#6366F1'
  form.observacoes = ''
  form.icone = null
  form.links = [{ titulo: '', url: '' }]
  iconFile.value = null
  iconVersion.value = 0
  resetIconPreview()
}

function parseDate(value?: string | Date | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function toIsoDate(value: Date | null) {
  return value ? value.toISOString() : null
}

function normalizeLinks() {
  return form.links
    .map((item) => ({ titulo: item.titulo.trim(), url: item.url.trim() }))
    .filter((item) => item.titulo || item.url)
}

function openIconInput() {
  iconInput.value?.click()
}

function onIconChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]

  if (file.size > 5 * 1024 * 1024) {
    toast.error('O ícone deve ter no máximo 5MB.')
    input.value = ''
    return
  }

  resetIconPreview()
  iconFile.value = file
  iconPreview.value = URL.createObjectURL(file)
  input.value = ''
}

function addLink() {
  form.links.push({ titulo: '', url: '' })
}

function removeLink(index: number) {
  if (form.links.length === 1) {
    form.links = [{ titulo: '', url: '' }]
    return
  }
  form.links.splice(index, 1)
}

async function loadDetail(id: number) {
  const response = await AssinaturaPagarRepository.detalhes(id)
  const data = response.data

  form.id = data.id
  form.nomeServico = data.nomeServico
  form.valor = Number(data.valor || 0)
  form.periodicidade = data.periodicidade
  form.intervaloDiasPersonalizado = data.intervaloDiasPersonalizado || 30
  form.inicio = parseDate(data.inicio)
  form.fim = parseDate(data.fim)
  form.proximoVencimento = parseDate(data.proximoVencimento)
  form.status = data.status
  form.gerarFinanceiro = data.gerarFinanceiro
  form.gerarAutomatico = data.gerarAutomatico
  form.contaFinanceiraId = data.contaFinanceiraId || null
  form.categoriaId = data.categoriaId || null
  form.formaPagamento = data.formaPagamento || 'PIX'
  form.corDestaque = data.corDestaque || '#6366F1'
  form.observacoes = data.observacoes || ''
  form.icone = data.icone || null
  form.links = data.links.length ? data.links.map((item) => ({ titulo: item.titulo, url: item.url })) : [{ titulo: '', url: '' }]
  iconFile.value = null
  iconVersion.value = 0
  resetIconPreview()
}

watch(
  () => store.openModal,
  async (isOpen) => {
    if (!isOpen) {
      resetForm()
      loading.value = false
      return
    }

    try {
      loading.value = true
      if (store.editingId) {
        await loadDetail(store.editingId)
      } else {
        resetForm()
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao carregar a assinatura.')
      store.closeModal()
    } finally {
      loading.value = false
    }
  },
)

watch(
  () => form.gerarFinanceiro,
  (enabled) => {
    if (!enabled) {
      form.gerarAutomatico = false
      form.contaFinanceiraId = null
      form.categoriaId = null
      form.formaPagamento = 'PIX'
    }
  },
)

watch(
  () => form.periodicidade,
  (value) => {
    if (value !== 'PERSONALIZADO') {
      form.intervaloDiasPersonalizado = 30
    }
  },
)

async function save() {
  if (!form.nomeServico.trim()) {
    toast.error('Informe o nome do serviço.')
    return
  }

  if (!form.inicio || !form.proximoVencimento) {
    toast.error('Informe a data de início e o vencimento atual.')
    return
  }

  if (form.valor <= 0) {
    toast.error('Informe um valor maior que zero.')
    return
  }

  const links = normalizeLinks()
  const hasPartialLink = form.links.some((item) => (item.titulo.trim() && !item.url.trim()) || (!item.titulo.trim() && item.url.trim()))
  if (hasPartialLink) {
    toast.error('Preencha título e URL completos para cada link ou remova a linha vazia.')
    return
  }

  const payload: AssinaturaPagarPayload = {
    id: form.id,
    nomeServico: form.nomeServico.trim(),
    valor: Number(form.valor || 0),
    periodicidade: form.periodicidade,
    intervaloDiasPersonalizado: form.periodicidade === 'PERSONALIZADO' ? Number(form.intervaloDiasPersonalizado || 0) : null,
    inicio: toIsoDate(form.inicio) as string,
    fim: toIsoDate(form.fim),
    proximoVencimento: toIsoDate(form.proximoVencimento) as string,
    status: form.status,
    gerarFinanceiro: form.gerarFinanceiro,
    gerarAutomatico: form.gerarFinanceiro ? form.gerarAutomatico : false,
    contaFinanceiraId: form.gerarFinanceiro ? form.contaFinanceiraId : null,
    categoriaId: form.gerarFinanceiro ? form.categoriaId : null,
    formaPagamento: form.gerarFinanceiro ? (form.formaPagamento as any) : null,
    corDestaque: form.corDestaque,
    observacoes: form.observacoes.trim() || null,
    links,
  }

  try {
    saving.value = true
    const response = await AssinaturaPagarRepository.salvar(payload)
    const assinaturaId = response?.data?.id || form.id

    if (assinaturaId && iconFile.value) {
      await AssinaturaPagarRepository.uploadIcon(assinaturaId, iconFile.value)
      iconVersion.value = Date.now()
    }

    toast.success(response?.message || 'Assinatura salva com sucesso.')
    store.closeModal()
    store.updateTable()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Erro ao salvar a assinatura.')
  } finally {
    saving.value = false
  }
}

onBeforeUnmount(() => {
  resetIconPreview()
})
</script>

<template>
  <ModalView v-model:open="store.openModal" :title="modalTitle" :description="modalDescription" size="4xl">
    <div v-if="loading" class="flex items-center justify-center px-6 py-16 text-muted-foreground">
      <LoaderCircle class="mr-2 h-5 w-5 animate-spin" />
      Preparando assinatura...
    </div>

    <form v-else class="space-y-4 px-4 pb-4" @submit.prevent="save">
      <div class="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <Sparkles class="h-4 w-4 text-primary" />
              Dados da assinatura
            </CardTitle>
            <CardDescription>Cadastre a despesa recorrente com visual e recorrência próprios.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-2">
            <div class="grid gap-4 md:grid-cols-[auto_1fr]">
              <div class="space-y-3">
                <div
                  class="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted"
                  :style="{ backgroundColor: `${form.corDestaque}14`, borderColor: form.corDestaque || undefined }"
                >
                  <img v-if="imageSrc" :src="imageSrc" alt="Ícone da assinatura" class="h-full w-full object-cover" />
                  <Sparkles v-else class="h-8 w-8" :style="{ color: form.corDestaque }" />
                </div>
                <input ref="iconInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" class="hidden" @change="onIconChange" />
                <Button type="button" variant="outline" class="w-full" @click="openIconInput">
                  <ImagePlus class="mr-2 h-4 w-4" />
                  {{ iconFile ? 'Trocar ícone' : 'Enviar ícone' }}
                </Button>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <div class="md:col-span-2">
                  <Label for="assinaturaPagarNome">Nome do serviço *</Label>
                  <Input id="assinaturaPagarNome" v-model="form.nomeServico" placeholder="Ex.: Figma, Conta Azul, AWS, hospedagem, ERP complementar" />
                </div>
                <div>
                  <Label for="assinaturaPagarValor">Valor *</Label>
                  <Input id="assinaturaPagarValor" v-model.number="form.valor" type="number" min="0" step="0.01" placeholder="0,00" />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select v-model="form.status">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in statusOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Recorrência</Label>
                  <Select v-model="form.periodicidade">
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in periodicidadeOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div v-if="form.periodicidade === 'PERSONALIZADO'">
                  <Label for="assinaturaPagarIntervalo">Intervalo em dias *</Label>
                  <Input id="assinaturaPagarIntervalo" v-model.number="form.intervaloDiasPersonalizado" type="number" min="1" step="1" placeholder="30" />
                </div>
                <div>
                  <Label for="assinaturaPagarInicio">Data de início *</Label>
                  <Calendarpicker id="assinaturaPagarInicio" v-model="form.inicio" :teleport="true" />
                </div>
                <div>
                  <Label for="assinaturaPagarVencimento">Vencimento atual *</Label>
                  <Calendarpicker id="assinaturaPagarVencimento" v-model="form.proximoVencimento" :teleport="true" />
                </div>
                <div>
                  <Label for="assinaturaPagarFim">Data final</Label>
                  <Calendarpicker id="assinaturaPagarFim" v-model="form.fim" :teleport="true" :required="false" />
                </div>
                <div class="md:col-span-2">
                  <Label for="assinaturaPagarCor" class="flex items-center gap-2">
                    <PaintBucket class="h-4 w-4" />
                    Cor de destaque
                  </Label>
                  <div class="flex items-center gap-3 rounded-lg border border-border px-3 py-2">
                    <input id="assinaturaPagarCor" v-model="form.corDestaque" type="color" class="h-10 w-12 rounded border-0 bg-transparent p-0" />
                    <Input v-model="form.corDestaque" placeholder="#6366F1" class="border-0 px-0 shadow-none focus-visible:ring-0" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label for="assinaturaPagarObservacoes">Observações</Label>
              <Textarea
                id="assinaturaPagarObservacoes"
                v-model="form.observacoes"
                placeholder="Ex.: renovar antes do dia 10, plano anual com reajuste previsto, fornecedor responde mais rápido via portal."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle class="flex items-center gap-2 text-base">
              <ReceiptText class="h-4 w-4 text-primary" />
              Integração financeira
            </CardTitle>
            <CardDescription>Defina quando a assinatura deve gerar um lançamento a pagar no financeiro.</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <label class="flex items-start gap-3 rounded-xl border border-border p-3">
              <Checkbox v-model="form.gerarFinanceiro" />
              <div>
                <p class="font-medium text-foreground">Gerar financeiro</p>
                <p class="text-sm text-muted-foreground">Cria um lançamento a pagar vinculado à assinatura e o exibe na listagem financeira comum.</p>
              </div>
            </label>

            <label class="flex items-start gap-3 rounded-xl border border-border p-3" :class="!form.gerarFinanceiro ? 'opacity-60' : ''">
              <Checkbox v-model="form.gerarAutomatico" :disabled="!form.gerarFinanceiro" />
              <div>
                <p class="font-medium text-foreground">Gerar automático</p>
                <p class="text-sm text-muted-foreground">Quando o lançamento atual for quitado, o próximo ciclo é criado automaticamente sem duplicar competência.</p>
              </div>
            </label>

            <div v-if="form.gerarFinanceiro" class="space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
              <div>
                <Label for="assinaturaPagarConta">Conta financeira de saída *</Label>
                <Select2Ajax
                  id="assinaturaPagarConta"
                  :model-value="form.contaFinanceiraId ?? undefined"
                  url="/lancamentos/contas/select2"
                  class="w-full"
                  @update:model-value="(value) => (form.contaFinanceiraId = value ? Number(value) : null)"
                />
              </div>
              <div>
                <Label for="assinaturaPagarCategoria">Categoria financeira *</Label>
                <Select2Ajax
                  id="assinaturaPagarCategoria"
                  :model-value="form.categoriaId ?? undefined"
                  url="/lancamentos/categorias/select2"
                  class="w-full"
                  @update:model-value="(value) => (form.categoriaId = value ? Number(value) : null)"
                />
              </div>
              <div>
                <Label>Forma de pagamento padrão</Label>
                <Select v-model="form.formaPagamento">
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem v-for="option in paymentOptions" :key="option.value" :value="option.value">
                      {{ option.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div class="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              A assinatura usa a data de vencimento atual como ciclo em aberto. Se a automação estiver desligada, você ainda pode gerar o próximo lançamento manualmente depois.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2 text-base">
            <Link2 class="h-4 w-4 text-primary" />
            Links úteis
          </CardTitle>
          <CardDescription>Cadastre o portal do fornecedor, link de pagamento, boleto, painel ou qualquer URL operacional relacionada.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-3">
          <div v-for="(link, index) in form.links" :key="`${index}-${link.titulo}`" class="grid gap-3 rounded-xl border border-border p-3 md:grid-cols-[1fr_1.4fr_auto]">
            <div>
              <Label :for="`assinaturaPagarLinkTitulo-${index}`">Título</Label>
              <Input :id="`assinaturaPagarLinkTitulo-${index}`" v-model="link.titulo" placeholder="Ex.: Portal, boleto, painel, fatura" />
            </div>
            <div>
              <Label :for="`assinaturaPagarLinkUrl-${index}`">URL</Label>
              <Input :id="`assinaturaPagarLinkUrl-${index}`" v-model="link.url" placeholder="https://..." />
            </div>
            <div class="flex items-end">
              <Button type="button" variant="outline" class="w-full" @click="removeLink(index)">
                <Trash2 class="mr-2 h-4 w-4" />
                Remover
              </Button>
            </div>
          </div>

          <Button type="button" variant="outline" @click="addLink">
            <Plus class="mr-2 h-4 w-4" />
            Adicionar link
          </Button>
        </CardContent>
      </Card>

      <div class="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" @click="store.closeModal">Cancelar</Button>
        <Button type="submit" :disabled="saving">
          <LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />
          {{ saving ? 'Salvando...' : 'Salvar assinatura' }}
        </Button>
      </div>
    </form>
  </ModalView>
</template>
