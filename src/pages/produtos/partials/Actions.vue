<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import type { ProdutoBase } from '@/types/schemas'
import type { Table } from '@tanstack/vue-table'
import { Menu } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import router from '@/router'

const store = useProdutoStore()
const toast = useToast()

const { data } = defineProps<{
  data: ProdutoBase
  table: Table<ProdutoBase>
}>()

function openModalReposicao(varianteId?: number | null) {
  if (!varianteId) {
    toast.error('Variante padrão não encontrada')
    return
  }
  store.idMutation = varianteId
  store.openModalReposicao = true
}

function gerarRelatorio(varianteId?: number | null) {
  if (!varianteId) {
    toast.error('Variante padrão não encontrada')
    return
  }
  store.idMutation = varianteId
  store.openModalRelatorio = true
}

function abrirEtiquetas(varianteId?: number | null) {
  if (!varianteId) {
    toast.error('Variante padrão não encontrada')
    return
  }
  store.idMutation = varianteId
  store.openModalEtiquetas = true
}

async function deletar(id: number) {
  if (!id) return toast.error('ID não informado')
  const confirm = await useConfirm().confirm({
    title: 'Excluir produto',
    message: 'Tem certeza que deseja excluir este produto base e suas variantes?',
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return
  try {
    await ProdutoRepository.remove(id)
    store.updateTable()
    toast.success('Produto deletado com sucesso')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao deletar o produto')
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="default" class="h-8 w-8 p-0 text-white">
        <span class="sr-only">Abrir opções</span>
        <Menu class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="router.push(`/produtos/detalhes?id=${data.id}`)">Ver detalhes</DropdownMenuItem>
      <DropdownMenuItem @click="store.openUpdate(data.id!)">Editar produto</DropdownMenuItem>
      <DropdownMenuItem @click="openModalReposicao(data.variantePadraoId)">Repor variante padrão</DropdownMenuItem>
      <DropdownMenuItem @click="gerarRelatorio(data.variantePadraoId)">Relatório da variante padrão</DropdownMenuItem>
      <DropdownMenuItem @click="abrirEtiquetas(data.variantePadraoId)">Etiquetas da variante padrão</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-danger" @click="deletar(data.id!)">Excluir</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
