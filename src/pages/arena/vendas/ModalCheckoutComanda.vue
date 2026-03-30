<script setup lang="ts">
import { computed } from 'vue'
import { addHours, isBefore } from 'date-fns'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Copy, ExternalLink, Receipt } from 'lucide-vue-next'
import { ComandaRepository } from '@/repositories/comanda-repository'
import { useComandaStore } from '@/stores/arena/comandaStore'
import { useClientesStore } from '@/stores/clientes/useClientes'

const store = useComandaStore()
const storeClientes = useClientesStore()
const toast = useToast()

const quantidadeSelecionada = computed(() => store.checkoutForm.itemIds.length)

function copiarLink() {
  navigator.clipboard.writeText(store.checkoutForm.linkPayment)
  toast.success('Link copiado com sucesso.')
}

function abrirLink() {
  window.open(store.checkoutForm.linkPayment, '_blank')
}

async function submit() {
  try {
    if (!store.selectedComanda?.id) {
      toast.error('Comanda nao encontrada.')
      return
    }

    if (store.checkoutForm.valor <= 0) {
      toast.error('Informe um valor valido para a cobranca.')
      return
    }

    if (isBefore(store.checkoutForm.vencimento, addHours(new Date(), 23))) {
      toast.error('A data de vencimento deve ser pelo menos amanha.')
      return
    }

    store.checkoutForm.loading = true
    const response = await ComandaRepository.checkout(store.selectedComanda.id, {
      itemIds: store.checkoutForm.itemIds,
      valor: Number(store.checkoutForm.valor),
      gateway: store.checkoutForm.gateway,
      tipoCobranca:
        store.checkoutForm.gateway === 'mercadopago' ? store.checkoutForm.tipoCobranca : null,
      vencimento: store.checkoutForm.vencimento.toISOString(),
      observacao: store.checkoutForm.observacao || null,
      clienteId: store.checkoutForm.clienteId || null,
    })

    if (store.checkoutForm.gateway === 'mercadopago' && !response.data.paymentLink) {
      throw new Error(
        'O gateway nao retornou o link da cobranca. Verifique a configuracao do Pix e tente novamente.',
      )
    }

    store.checkoutForm.linkPayment = response.data.paymentLink || ''
    toast.success('Cobranca gerada com sucesso.')
    await store.reloadDetalhes()
    store.updateTable()

    if (!response.data.paymentLink) {
      store.openCheckoutModal = false
      store.resetCheckout()
    }
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || error.message || 'Erro ao gerar a cobranca.')
  } finally {
    store.checkoutForm.loading = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="store.openCheckoutModal"
    title="Gerar cobranca"
    description="Escolha os itens, defina o valor final e gere a cobranca da comanda."
    size="2xl"
  >
    <div v-if="store.checkoutForm.linkPayment" class="px-4">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Receipt />
          </EmptyMedia>
          <EmptyTitle>Cobranca gerada</EmptyTitle>
          <EmptyDescription>O link foi gerado. Voce pode copiar ou abrir em uma nova guia.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent class="space-y-3">
          <Input v-model="store.checkoutForm.linkPayment" class="text-xs" />
          <div class="flex justify-end gap-2">
            <Button type="button" class="text-white" @click="copiarLink">
              <Copy class="h-4 w-4" />
              Copiar link
            </Button>
            <Button type="button" variant="outline" @click="abrirLink">
              <ExternalLink class="h-4 w-4" />
              Abrir link
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>

    <form v-else @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-6 px-4 md:grid-cols-2">
        <div class="rounded-lg border border-border bg-muted/30 px-4 py-3 md:col-span-2">
          <div class="text-sm font-medium text-foreground">Itens selecionados: {{ quantidadeSelecionada }}</div>
          <div class="text-xs text-muted-foreground">
            O valor calculado pode ser alterado antes de confirmar a cobranca.
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">Valor da cobranca *</label>
          <Input v-model.number="store.checkoutForm.valor" type="number" min="0.01" step="0.01" placeholder="0,00" />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">Vencimento *</label>
          <Calendarpicker v-model="store.checkoutForm.vencimento" :required="true" teleport />
        </div>

        <div>
          <label class="mb-1 block text-sm font-medium">Gateway</label>
          <Select v-model="store.checkoutForm.gateway">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Selecione o gateway" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interno">Interno</SelectItem>
              <SelectItem value="mercadopago">Mercado Pago</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="store.checkoutForm.gateway === 'mercadopago'">
          <label class="mb-1 block text-sm font-medium">Tipo de cobranca</label>
          <Select v-model="store.checkoutForm.tipoCobranca">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PIX">PIX</SelectItem>
              <SelectItem value="BOLETO">Boleto</SelectItem>
              <SelectItem value="LINK">Link</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div
          v-if="store.checkoutForm.gateway === 'mercadopago' && store.checkoutForm.tipoCobranca === 'BOLETO'"
          class="md:col-span-2"
        >
          <label class="mb-1 block text-sm font-medium">
            Cliente para boleto
            <button type="button" class="px-2 text-blue-500" @click="storeClientes.openSave">+ Novo</button>
          </label>
          <Select2Ajax
            v-model="store.checkoutForm.clienteId"
            url="/clientes/select2"
            placeholder="Selecione um cliente"
            :allow-clear="true"
          />
        </div>

        <div class="md:col-span-2">
          <label class="mb-1 block text-sm font-medium">Observacao</label>
          <Textarea v-model="store.checkoutForm.observacao" rows="4" placeholder="Descricao da cobranca" />
        </div>

        <div class="flex justify-end gap-2 md:col-span-2">
          <Button type="button" variant="secondary" @click="store.openCheckoutModal = false">Fechar</Button>
          <Button :disabled="store.checkoutForm.loading" class="bg-primary text-white hover:bg-primary/90">
            {{ store.checkoutForm.loading ? 'Gerando...' : 'Gerar cobranca' }}
          </Button>
        </div>
      </div>
    </form>
  </ModalView>
</template>
