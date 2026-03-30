<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { NumberField, NumberFieldContent, NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput } from '@/components/ui/number-field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { ServicoRepository } from '@/repositories/servico-repository'
import { ComandaRepository } from '@/repositories/comanda-repository'
import { useComandaStore } from '@/stores/arena/comandaStore'

const store = useComandaStore()
const toast = useToast()
const loading = ref(false)
const itemLabel = ref('')
const maxQuantidade = ref(999999)
const canEditQuantity = ref(true)

async function hydrateItemData(id: number) {
  try {
    if (store.itemForm.tipo === 'PRODUTO') {
      const response = await ProdutoVarianteRepository.get(id)
      if (response.data.estoque <= 0) {
        canEditQuantity.value = false
        store.itemForm.valor = Number(response.data.preco || 0)
        maxQuantidade.value = 1
        toast.error('Produto sem estoque disponível.')
        return
      }

      canEditQuantity.value = true
      maxQuantidade.value = response.data.estoque
      store.itemForm.quantidade = 1
      store.itemForm.valor = Number(response.data.preco || 0)
      return
    }

    const servico = await ServicoRepository.get(id)
    canEditQuantity.value = true
    maxQuantidade.value = 999999
    store.itemForm.quantidade = 1
    store.itemForm.valor = Number(servico.preco || 0)
  } catch (error) {
    console.log(error)
    toast.warning('Não foi possível preencher o valor automaticamente.')
  }
}

watch(
  () => store.itemForm.tipo,
  () => {
    store.itemForm.itemId = null
    store.itemForm.valor = undefined
    store.itemForm.quantidade = 1
    itemLabel.value = ''
    canEditQuantity.value = true
    maxQuantidade.value = 999999
  },
)

watch(
  () => store.itemForm.itemId,
  async (id) => {
    if (!id) return
    await hydrateItemData(id)
  },
)

async function submit() {
  try {
    if (!store.selectedComanda?.id) {
      toast.error('Comanda não encontrada.')
      return
    }

    if (!store.itemForm.itemId) {
      toast.error('Selecione um item.')
      return
    }

    if (!store.itemForm.valor || store.itemForm.valor <= 0) {
      toast.error('Informe um valor válido.')
      return
    }

    loading.value = true
    await ComandaRepository.addItem(store.selectedComanda.id, {
      tipo: store.itemForm.tipo,
      itemId: store.itemForm.itemId,
      quantidade: store.itemForm.quantidade,
      valor: Number(store.itemForm.valor),
    })
    toast.success('Item adicionado com sucesso.')
    store.openItemModal = false
    store.resetItem()
    await store.reloadDetalhes()
    store.updateTable()
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao adicionar item.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="store.openItemModal"
    title="Adicionar item"
    description="Inclua produtos ou serviços na comanda selecionada."
    size="xl"
  >
    <form @submit.prevent="submit">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-4 px-4">
        <div class="md:col-span-6">
          <label class="block text-sm font-medium mb-1">Tipo *</label>
          <Select v-model="store.itemForm.tipo">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PRODUTO">Produto</SelectItem>
              <SelectItem value="SERVICO">Serviço</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="md:col-span-6">
          <label class="block text-sm font-medium mb-1">
            {{ store.itemForm.tipo === 'PRODUTO' ? 'Variante' : 'Serviço' }} *
          </label>
          <Select2Ajax
            v-model="store.itemForm.itemId"
            v-model:label="itemLabel"
            :url="store.itemForm.tipo === 'PRODUTO' ? '/produtos/select2' : '/servicos/select2'"
            :params="store.itemForm.tipo === 'PRODUTO' ? [{ key: 'withStock', value: true }] : []"
            :allow-clear="true"
            placeholder="Pesquisar item"
          />
        </div>

        <div class="md:col-span-6">
          <label class="block text-sm font-medium mb-1">Quantidade *</label>
          <NumberField v-model="store.itemForm.quantidade" :min="1" :max="maxQuantidade">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput :disabled="!canEditQuantity" />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>

        <div class="md:col-span-6">
          <label class="block text-sm font-medium mb-1">Valor unitário *</label>
          <Input v-model.number="store.itemForm.valor" type="number" min="0.01" step="0.01" placeholder="0,00" />
        </div>

        <div class="md:col-span-12 flex justify-end gap-2">
          <Button type="button" variant="secondary" @click="store.openItemModal = false">Fechar</Button>
          <Button :disabled="loading" class="bg-primary text-white hover:bg-primary/90">
            {{ loading ? 'Adicionando...' : 'Adicionar item' }}
          </Button>
        </div>
      </div>
    </form>
  </ModalView>
</template>
