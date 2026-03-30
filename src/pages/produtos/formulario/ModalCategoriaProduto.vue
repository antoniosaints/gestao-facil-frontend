<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProdutoCategoriaRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'

const store = useProdutoStore()
const toast = useToast()

const title = computed(() => (store.categoriaForm.id ? 'Editar categoria de produto' : 'Nova categoria de produto'))

async function submit() {
  try {
    if (!store.categoriaForm.nome.trim()) {
      toast.error('Informe o nome da categoria')
      return
    }

    await ProdutoCategoriaRepository.save({
      ...store.categoriaForm,
      nome: store.categoriaForm.nome.trim(),
    })
    toast.success('Categoria salva com sucesso')
    store.resetCategoria()
    store.openModalCategoria = false
    store.updateTable()
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao salvar categoria')
  }
}
</script>

<template>
  <ModalView
    v-model:open="store.openModalCategoria"
    :title="title"
    description="Cadastre categorias para organizar os produtos base."
    size="md"
  >
    <form @submit.prevent="submit" class="grid gap-4 px-4">
      <div>
        <label class="mb-1 block text-sm font-medium">
          Nome da categoria <span class="text-red-500">*</span>
        </label>
        <Input v-model="store.categoriaForm.nome" type="text" placeholder="Ex: Vestuário" />
      </div>

      <div>
        <label class="mb-1 block text-sm font-medium">Status</label>
        <Select v-model="store.categoriaForm.status">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ATIVO">Ativo</SelectItem>
            <SelectItem value="INATIVO">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div class="flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="store.openModalCategoria = false">Fechar</Button>
        <Button class="text-white" type="submit">Salvar categoria</Button>
      </div>
    </form>
  </ModalView>
</template>
