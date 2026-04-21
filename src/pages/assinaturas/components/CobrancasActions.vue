<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Ban,
  Copy,
  ExternalLink,
  Menu,
  ReceiptText,
  RefreshCcw,
  RotateCcw,
  Trash2,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import ModalView from '@/components/formulario/ModalView.vue'
import { useConfirm } from '@/composables/useConfirm'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AssinaturaRepository,
  type AssinaturaCicloListItem,
  type AssinaturaDetalheResponse,
} from '@/repositories/assinatura-repository'
import { useAssinaturasStore } from '@/stores/assinaturas/useAssinaturas'
import { formatCurrencyBR } from '@/utils/formatters'

type CicloAssinatura = AssinaturaCicloListItem | AssinaturaDetalheResponse['data']['ciclos'][number]

const props = defineProps<{
  data: CicloAssinatura
  onChanged?: () => Promise<void> | void
}>()

const toast = useToast()
const store = useAssinaturasStore()
const processing = ref<'gateway' | 'cancelar' | 'estornar' | 'reajustar' | 'deletar' | null>(null)
const openReajuste = ref(false)
const valorReajuste = ref<string>('')

const tipoOperavel = computed(() => ['PIX', 'BOLETO'].includes(props.data.tipoCobrancaUsado || ''))
const externalLink = computed(() => props.data.cobranca?.externalLink || null)
const canGenerateGateway = computed(() => {
  if (props.data.status === 'PAGO') return false
  if (!props.data.cobranca) return true
  return ['CANCELADO', 'ESTORNADO'].includes(props.data.cobranca.status)
})
const canCancel = computed(() =>
  Boolean(props.data.cobranca && props.data.cobranca.status === 'PENDENTE' && tipoOperavel.value),
)
const canRefund = computed(() =>
  Boolean(props.data.cobranca && props.data.cobranca.status === 'EFETIVADO' && tipoOperavel.value),
)
const canDelete = computed(() => {
  if (!props.data.cobranca) return false
  if (props.data.status === 'PAGO' || props.data.cobranca.status === 'EFETIVADO') return false

  if (tipoOperavel.value) {
    return ['CANCELADO', 'ESTORNADO'].includes(props.data.cobranca.status)
  }

  return true
})
const canReprice = computed(() => {
  if (props.data.status === 'PAGO') return false
  if (!props.data.cobranca) return true
  return ['PENDENTE', 'CANCELADO', 'ESTORNADO'].includes(props.data.cobranca.status)
})

function resetReajuste() {
  valorReajuste.value = String(props.data.valorCobrado || '')
}

function openGatewayLink() {
  if (!externalLink.value) return
  window.open(externalLink.value, '_blank')
}

async function copyGatewayLink() {
  if (!externalLink.value) return
  await navigator.clipboard.writeText(externalLink.value)
  toast.success('Link da cobrança copiado.')
}

async function notifyChanged(defaultMessage?: string) {
  await props.onChanged?.()
  if (!props.onChanged && defaultMessage) {
    toast.success(defaultMessage)
  }
  store.refreshCobrancas()
}

async function gerarGateway() {
  try {
    processing.value = 'gateway'
    const response = await AssinaturaRepository.gerarCobrancaGateway(props.data.id)
    toast.success(response.message || 'Cobrança gerada com sucesso no gateway.')
    await notifyChanged()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao gerar cobrança no gateway.')
  } finally {
    processing.value = null
  }
}

async function cancelar() {
  const ok = await useConfirm().confirm({
    title: 'Cancelar cobrança',
    message: 'Tem certeza que deseja cancelar esta cobrança no gateway?',
    confirmText: 'Sim, cancelar',
  })
  if (!ok) return

  try {
    processing.value = 'cancelar'
    const response = await AssinaturaRepository.cancelarCobranca(props.data.id)
    toast.success(response.message || 'Cobrança cancelada com sucesso.')
    await notifyChanged()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao cancelar a cobrança.')
  } finally {
    processing.value = null
  }
}

async function estornar() {
  const ok = await useConfirm().confirm({
    title: 'Estornar cobrança',
    message: 'Tem certeza que deseja estornar esta cobrança já efetivada?',
    confirmText: 'Sim, estornar',
  })
  if (!ok) return

  try {
    processing.value = 'estornar'
    const response = await AssinaturaRepository.estornarCobranca(props.data.id)
    toast.success(response.message || 'Cobrança estornada com sucesso.')
    await notifyChanged()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao estornar a cobrança.')
  } finally {
    processing.value = null
  }
}

async function deletar() {
  const ok = await useConfirm().confirm({
    title: 'Apagar cobrança',
    message: 'Tem certeza que deseja apagar a cobrança vinculada a este ciclo? Esta ação remove o vínculo atual e permite gerar uma nova cobrança depois.',
    confirmText: 'Sim, apagar',
  })
  if (!ok) return

  try {
    processing.value = 'deletar'
    const response = await AssinaturaRepository.deletarCobranca(props.data.id)
    toast.success(response.message || 'Cobrança apagada com sucesso.')
    await notifyChanged()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao apagar a cobrança.')
  } finally {
    processing.value = null
  }
}

function abrirReajuste() {
  resetReajuste()
  openReajuste.value = true
}

async function confirmarReajuste() {
  const valor = Number(valorReajuste.value)
  if (!valor || valor <= 0) {
    toast.error('Informe um valor válido para reajustar a cobrança.')
    return
  }

  try {
    processing.value = 'reajustar'
    const response = await AssinaturaRepository.reajustarCobranca(props.data.id, valor)
    toast.success(response.message || 'Cobrança reajustada com sucesso.')
    openReajuste.value = false
    await notifyChanged()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao reajustar a cobrança.')
  } finally {
    processing.value = null
  }
}
</script>

<template>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button variant="outline" size="sm" :disabled="processing !== null">
          <Menu class="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem v-if="canGenerateGateway" :disabled="processing !== null" @click="gerarGateway">
          <ReceiptText class="mr-2 h-4 w-4" />
          Gerar no gateway
        </DropdownMenuItem>
        <DropdownMenuItem v-if="externalLink" @click="openGatewayLink">
          <ExternalLink class="mr-2 h-4 w-4" />
          Abrir link
        </DropdownMenuItem>
        <DropdownMenuItem v-if="externalLink" @click="copyGatewayLink">
          <Copy class="mr-2 h-4 w-4" />
          Copiar link
        </DropdownMenuItem>
        <DropdownMenuItem v-if="canCancel" :disabled="processing !== null" @click="cancelar">
          <Ban class="mr-2 h-4 w-4" />
          Cancelar cobrança
        </DropdownMenuItem>
        <DropdownMenuItem v-if="canRefund" :disabled="processing !== null" @click="estornar">
          <RotateCcw class="mr-2 h-4 w-4" />
          Estornar pagamento
        </DropdownMenuItem>
        <DropdownMenuItem v-if="canDelete" :disabled="processing !== null" @click="deletar">
          <Trash2 class="mr-2 h-4 w-4" />
          Apagar cobrança
        </DropdownMenuItem>
        <DropdownMenuSeparator v-if="canReprice" />
        <DropdownMenuItem v-if="canReprice" :disabled="processing !== null" @click="abrirReajuste">
          <RefreshCcw class="mr-2 h-4 w-4" />
          Reajustar cobrança
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <ModalView
      v-model:open="openReajuste"
      title="Reajustar cobrança"
      description="O sistema cancela a cobrança atual no gateway e cria uma nova cobrança com o valor informado."
      size="sm"
    >
      <div class="space-y-4 px-4">
        <div class="space-y-2">
          <Label for="valorReajusteCobranca">Novo valor</Label>
          <Input id="valorReajusteCobranca" v-model="valorReajuste" type="number" min="0.01" step="0.01" />
          <p class="text-xs text-muted-foreground">
            Valor atual: {{ formatCurrencyBR(props.data.valorCobrado) }}
          </p>
        </div>

        <div class="flex justify-end gap-2">
          <Button type="button" variant="secondary" :disabled="processing === 'reajustar'" @click="openReajuste = false">
            Cancelar
          </Button>
          <Button type="button" class="text-white" :disabled="processing === 'reajustar'" @click="confirmarReajuste">
            <RefreshCcw v-if="processing === 'reajustar'" class="mr-2 h-4 w-4 animate-spin" />
            {{ processing === 'reajustar' ? 'Reajustando...' : 'Confirmar reajuste' }}
          </Button>
        </div>
      </div>
    </ModalView>
</template>
