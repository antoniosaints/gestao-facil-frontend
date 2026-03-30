<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ComandaRepository } from '@/repositories/comanda-repository'
import { useComandaStore } from '@/stores/arena/comandaStore'
import { useClientesStore } from '@/stores/clientes/useClientes'

const store = useComandaStore()
const storeClientes = useClientesStore()
const toast = useToast()
const saving = ref(false)
const clienteLabel = ref('')

const title = computed(() => (store.form.id ? 'Editar comanda' : 'Nova comanda'))
const description = computed(() =>
  store.form.id ? 'Atualize os dados principais da comanda.' : 'Cadastre uma nova comanda para lançar itens e gerar cobranças.',
)

watch(
  () => store.openModal,
  (isOpen) => {
    if (!isOpen) {
      clienteLabel.value = ''
    }
  },
)

async function submit() {
  try {
    const clienteNome = store.form.clienteNome.trim() || clienteLabel.value.trim()

    if (!clienteNome) {
      toast.error('Informe a identificação da comanda.')
      return
    }

    saving.value = true
    await ComandaRepository.save({
      ...store.form,
      clienteNome,
    })
    toast.success('Comanda salva com sucesso.')
    store.openModal = false
    store.reset()
    store.updateTable()
    if (store.selectedComanda?.id) {
      await store.reloadDetalhes()
    }
  } catch (error: any) {
    console.log(error)
    toast.error(error.response?.data?.message || 'Erro ao salvar a comanda.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ModalView v-model:open="store.openModal" :title="title" :description="description" size="2xl">
    <form @submit.prevent="submit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 px-4">
        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Identificação da comanda *</label>
          <Input v-model="store.form.clienteNome" type="text" placeholder="Ex: Mesa 5, João, Balcão" />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">
            Cliente
            <button type="button" class="text-blue-500 px-2" @click="storeClientes.openSave">+ Novo</button>
          </label>
          <Select2Ajax
            v-model="store.form.clienteId"
            v-model:label="clienteLabel"
            url="/clientes/select2"
            placeholder="Selecione um cliente"
            :allow-clear="true"
          />
        </div>

        <div class="md:col-span-2">
          <label class="block text-sm font-medium mb-1">Observação</label>
          <Textarea v-model="store.form.observacao" rows="4" placeholder="Observações internas da comanda" />
        </div>

        <div class="md:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" @click="store.openModal = false">Fechar</Button>
          <Button :disabled="saving" class="bg-primary text-white hover:bg-primary/90">
            {{ saving ? 'Salvando...' : 'Salvar comanda' }}
          </Button>
        </div>
      </div>
    </form>
  </ModalView>
</template>
