<script setup lang="ts">
import { inject, ref, watch } from 'vue'
import { Funnel } from 'lucide-vue-next'

import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import Button from '@/components/ui/button/Button.vue'
import { useProdutoStore } from '@/stores/produtos/useProduto'

const open = inject('openModalFiltroProdutos', ref(false))
const store = useProdutoStore()

const status = ref<string | number | null>(null)
const categoriaId = ref<string | number | null>(null)
const estoqueBaixo = ref<string | number | null>(null)
const maisVendas = ref<string | number | null>(null)

function syncFromStore() {
  status.value = store.filters.status || null
  categoriaId.value = store.filters.categoriaId || null
  estoqueBaixo.value = store.filters.estoqueBaixo || null
  maisVendas.value = store.filters.maisVendas || null
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
  store.filters.status = (status.value as string) || ''
  store.filters.categoriaId = categoriaId.value ? Number(categoriaId.value) : null
  store.filters.estoqueBaixo = (estoqueBaixo.value as 'TODOS' | 'SIM' | 'NAO') || 'TODOS'
  store.filters.maisVendas = (maisVendas.value as 'TODOS' | 'SIM') || 'TODOS'
  store.updateTable()
  open.value = false
}

function limparFiltro() {
  status.value = null
  categoriaId.value = null
  estoqueBaixo.value = null
  maisVendas.value = null

  store.filters.status = ''
  store.filters.categoriaId = null
  store.filters.estoqueBaixo = 'TODOS'
  store.filters.maisVendas = 'TODOS'
  store.updateTable()
  open.value = false
}
</script>

<template>
  <ModalView
    v-model:open="open"
    title="Filtrar produtos"
    size="lg"
    description="Refine a listagem por status, categoria e critérios do estoque."
  >
    <div class="flex flex-col px-4">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div class="md:col-span-6">
          <label class="mb-1 block text-sm">Status</label>
          <Select2Ajax
            v-model="status"
            class="w-full"
            url="/produtos/filtros/select2"
            :params="[{ key: 'kind', value: 'status' }]"
            placeholder="Selecione o status"
            allow-clear
          />
        </div>

        <div class="md:col-span-6">
          <label class="mb-1 block text-sm">Categoria</label>
          <Select2Ajax
            v-model="categoriaId"
            class="w-full"
            url="/produtos/categorias/select2"
            placeholder="Selecione a categoria"
            allow-clear
          />
        </div>

        <div class="md:col-span-6">
          <label class="mb-1 block text-sm">Estoque baixo</label>
          <Select2Ajax
            v-model="estoqueBaixo"
            class="w-full"
            url="/produtos/filtros/select2"
            :params="[{ key: 'kind', value: 'estoqueBaixo' }]"
            placeholder="Selecione a condição"
            allow-clear
          />
        </div>

        <div class="md:col-span-6">
          <label class="mb-1 block text-sm">Mais vendas</label>
          <Select2Ajax
            v-model="maisVendas"
            class="w-full"
            url="/produtos/filtros/select2"
            :params="[{ key: 'kind', value: 'maisVendas' }]"
            placeholder="Selecione a ordenação"
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
