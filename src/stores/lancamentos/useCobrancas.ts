import { ref } from 'vue'
import { defineStore } from 'pinia'
import { type CobrancaFinanceira } from '@/types/schemas'
import { ServicoRepository } from '@/repositories/servico-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useToast } from 'vue-toastification'

export interface CobrancaOperacao {
  linkExists: boolean
  loading: boolean
  gateway: 'mercadopago' | 'abacatepay' | 'pagseguro' | 'asaas' | undefined
  valor: string
  vencimento: Date
  criterio: 'avulso'
  tipo: 'LINK' | 'BOLETO' | 'PIX'
  clienteId: number | null
  observacao?: string
}

export const useCobrancasFinanceirasStore = defineStore('cobrancasFinanceirasStore', () => {
  const uiStore = useUiStore()
  const toast = useToast()
  const openModal = ref(false)
  const idMutation = ref<number | null>(null)
  const vinculoCobranca = ref<{ id: number; tipo: 'parcela' | 'venda' | 'os' } | undefined>(
    undefined,
  )

  const form = ref<CobrancaOperacao>({
    linkExists: false,
    loading: false,
    gateway: undefined,
    valor: '',
    vencimento: new Date(),
    criterio: 'avulso',
    tipo: 'PIX',
    clienteId: null,
    observacao: '',
  })

  const reset = () => {
    form.value = {
      linkExists: false,
      loading: false,
      gateway: undefined,
      valor: '',
      vencimento: new Date(),
      criterio: 'avulso',
      tipo: 'PIX',
      clienteId: null,
      observacao: '',
    }
    vinculoCobranca.value = undefined
  }

  const openSave = (vinculo?: { id: number; tipo: 'parcela' | 'venda' | 'os'; valor?: number }) => {
    if (!uiStore.canCreateCharge) {
      toast.info('A criação de cobranças está desativada nas configurações financeiras da conta.')
      return
    }

    reset()
    vinculoCobranca.value = vinculo
    if (vinculo?.valor) form.value.valor = String(vinculo?.valor).replace('.', ',')
    openModal.value = true
  }
  const openUpdate = async (id: number) => {
    const response = await ServicoRepository.get(id)
    openModal.value = true
  }

  const filters = ref<Partial<CobrancaFinanceira> & { update: boolean }>({
    update: false,
  })

  const updateTable = () => {
    filters.value.update = !filters.value.update
  }

  return {
    openModal,
    idMutation,
    openSave,
    openUpdate,
    updateTable,
    filters,
    reset,
    form,
    vinculoCobranca,
  }
})
