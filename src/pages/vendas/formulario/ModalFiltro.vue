<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import Button from '@/components/ui/button/Button.vue'
import { useVendasStore } from '@/stores/vendas/useVenda'
import { Funnel } from 'lucide-vue-next'
import { inject, ref, watch } from 'vue'

const open = inject('openModalFiltroVendas', ref(false))
const store = useVendasStore()

const periodo = ref<Date[] | null>(null)
const status = ref<string | number | null>(null)
const clienteId = ref<string | number | null>(null)
const produtoId = ref<string | number | null>(null)
const servicoId = ref<string | number | null>(null)
const vendedorId = ref<string | number | null>(null)
const desconto = ref<string | number | null>(null)

function parseDate(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function syncFromStore() {
  const inicio = parseDate(store.filters.periodo?.inicio || null)
  const fim = parseDate(store.filters.periodo?.fim || null)

  periodo.value = inicio && fim ? [inicio, fim] : null
  status.value = store.filters.status || null
  clienteId.value = store.filters.clienteId || null
  produtoId.value = store.filters.produtoId || null
  servicoId.value = store.filters.servicoId || null
  vendedorId.value = store.filters.vendedorId || null
  desconto.value = store.filters.desconto || null
}

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) {
      syncFromStore()
    }
  },
  { immediate: true },
)

function aplicarFiltro() {
  const formated: { inicio: string | null; fim: string | null } = {
    inicio: null,
    fim: null,
  }

  if (periodo.value?.length === 2) {
    formated.inicio = periodo.value[0].toISOString().split('T')[0]
    formated.fim = periodo.value[1].toISOString().split('T')[0]
  }

  store.filters.periodo = formated
  store.filters.status = (status.value as string) || ''
  store.filters.clienteId = clienteId.value ? Number(clienteId.value) : null
  store.filters.produtoId = produtoId.value ? Number(produtoId.value) : null
  store.filters.servicoId = servicoId.value ? Number(servicoId.value) : null
  store.filters.vendedorId = vendedorId.value ? Number(vendedorId.value) : null
  store.filters.desconto = (desconto.value as string) || ''
  store.updateTable()
  open.value = false
}

function limparFiltro() {
  periodo.value = null
  status.value = null
  clienteId.value = null
  produtoId.value = null
  servicoId.value = null
  vendedorId.value = null
  desconto.value = null

  store.filters.periodo = { inicio: null, fim: null }
  store.filters.status = ''
  store.filters.clienteId = null
  store.filters.produtoId = null
  store.filters.servicoId = null
  store.filters.vendedorId = null
  store.filters.desconto = ''
  store.updateTable()
  open.value = false
}
</script>

<template>
  <ModalView
    v-model:open="open"
    title="Filtrar vendas"
    size="lg"
    description="Preencha os dados para filtrar as vendas"
  >
    <div class="flex flex-col px-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div class="md:col-span-6">
          <label class="mb-1 block text-sm">Período de vendas</label>
          <Calendarpicker v-model="periodo" placeholder="Período" :range="true" :teleport="true" />
        </div>

        <div class="md:col-span-6">
          <label class="mb-1 block text-sm">Status</label>
          <Select2Ajax
            v-model="status"
            class="w-full"
            url="/vendas/filtros/select2"
            :params="[{ key: 'kind', value: 'status' }]"
            placeholder="Selecione o status"
            allow-clear
          />
        </div>

        <div class="md:col-span-6">
          <label class="mb-1 block text-sm">Cliente</label>
          <Select2Ajax
            v-model="clienteId"
            class="w-full"
            url="/clientes/select2"
            placeholder="Selecione o cliente"
            allow-clear
          />
        </div>

        <div class="md:col-span-6">
          <label class="mb-1 block text-sm">Vendedor</label>
          <Select2Ajax
            v-model="vendedorId"
            class="w-full"
            url="/usuarios/select2"
            placeholder="Selecione o vendedor"
            allow-clear
          />
        </div>

        <div class="md:col-span-6">
          <label class="mb-1 block text-sm">Produto</label>
          <Select2Ajax
            v-model="produtoId"
            class="w-full"
            url="/produtos/select2"
            placeholder="Selecione o produto"
            allow-clear
          />
        </div>

        <div class="md:col-span-6">
          <label class="mb-1 block text-sm">Serviço</label>
          <Select2Ajax
            v-model="servicoId"
            class="w-full"
            url="/servicos/select2"
            placeholder="Selecione o serviço"
            allow-clear
          />
        </div>

        <div class="md:col-span-6">
          <label class="mb-1 block text-sm">Desconto</label>
          <Select2Ajax
            v-model="desconto"
            class="w-full"
            url="/vendas/filtros/select2"
            :params="[{ key: 'kind', value: 'desconto' }]"
            placeholder="Selecione a regra de desconto"
            allow-clear
          />
        </div>

        <div class="md:col-span-12 flex justify-end gap-2 text-end">
          <Button variant="outline" @click="limparFiltro">
            Limpar
          </Button>
          <Button class="text-white" @click="aplicarFiltro">
            <Funnel />
            Filtrar
          </Button>
        </div>
      </div>
    </div>
  </ModalView>
</template>
