<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'

const store = useProdutoStore()
const toast = useToast()
const loading = ref(false)
const formulario = ref({
  quantidade: 0,
  motivo: '',
})

function resetForm() {
  formulario.value = {
    quantidade: 0,
    motivo: '',
  }
}

async function submit() {
  try {
    if (!store.idMutation) return toast.error('ID nao informado!')
    if (!formulario.value.quantidade || formulario.value.quantidade <= 0) {
      return toast.error('Informe uma quantidade maior que zero.')
    }

    loading.value = true
    await ProdutoVarianteRepository.descartar({
      produtoId: store.idMutation,
      quantidade: formulario.value.quantidade,
      motivo: formulario.value.motivo,
    })

    toast.success('Descarte de produto registrado!')
    store.updateTable()
    store.openModalDescarte = false
    resetForm()
  } catch (error: any) {
    console.error(error)
    toast.error(error.response?.data?.message || 'Erro ao registrar o descarte de produto!')
  } finally {
    loading.value = false
  }
}

watch(
  () => store.openModalDescarte,
  (open) => {
    if (!open) resetForm()
  },
)
</script>

<template>
  <ModalView
    v-model:open="store.openModalDescarte"
    title="Descarte de Produto"
    size="md"
    description="Baixar quantidade do estoque sem gerar movimento de estoque"
  >
    <form class="grid gap-4 px-4" @submit.prevent="submit">
      <div>
        <label class="mb-1 block text-sm font-medium">
          Quantidade <span class="text-red-500">*</span>
        </label>
        <Input
          v-model.number="formulario.quantidade"
          type="number"
          min="1"
          step="1"
          placeholder="Ex: 5"
          required
        />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium">Motivo</label>
        <Textarea
          v-model="formulario.motivo"
          rows="4"
          placeholder="Ex: avaria, vencimento, ajuste fisico"
        />
      </div>

      <div class="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" :disabled="loading" @click="store.openModalDescarte = false">
          Fechar
        </Button>
        <Button type="submit" class="text-white" :disabled="loading">
          Registrar descarte
        </Button>
      </div>
    </form>
  </ModalView>
</template>
