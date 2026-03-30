<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProdutoCategoriaRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import type { ProdutoCategoria } from '@/types/schemas'
import type { Table } from '@tanstack/vue-table'
import { Menu } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'

const store = useProdutoStore()
const toast = useToast()

const props = defineProps<{
  data: ProdutoCategoria
  table: Table<ProdutoCategoria>
}>()

function editarCategoria() {
  store.categoriaForm = {
    id: props.data.id,
    nome: props.data.nome,
    status: props.data.status || 'ATIVO',
  }
  store.openModalCategoria = true
}

async function deletarCategoria(id?: number) {
  if (!id) return
  const confirm = await useConfirm().confirm({
    title: 'Excluir categoria',
    message: 'Tem certeza que deseja excluir esta categoria?',
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return
  try {
    await ProdutoCategoriaRepository.remove(id)
    store.updateTable()
    toast.success('Categoria excluída com sucesso')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao excluir a categoria')
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="default" class="h-8 w-8 p-0 text-white">
        <Menu class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="editarCategoria">Editar</DropdownMenuItem>
      <DropdownMenuItem class="text-danger" @click="deletarCategoria(props.data.id)">Excluir</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
