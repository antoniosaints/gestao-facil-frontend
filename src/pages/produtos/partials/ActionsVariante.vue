<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ProdutoVarianteRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import type { ProdutoVariante } from '@/types/schemas'
import type { Table } from '@tanstack/vue-table'
import { Menu } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import router from '@/router'

const store = useProdutoStore()
const toast = useToast()

const { data } = defineProps<{
  data: ProdutoVariante & { produtoBaseNome?: string }
  table: Table<ProdutoVariante>
}>()

function openModalReposicao(varianteId?: number | null) {
  if (!varianteId) {
    toast.error('Variante não encontrada')
    return
  }
  store.idMutation = varianteId
  store.openModalReposicao = true
}

function gerarRelatorio(varianteId?: number | null) {
  if (!varianteId) {
    toast.error('Variante não encontrada')
    return
  }
  store.openReportModal({
    reportType: 'movimentacoes',
    scope: 'variante',
    targetId: varianteId,
    targetLabel: `${data.produtoBaseNome || data.nome} / ${data.nomeVariante || 'Padrão'}`,
  })
}

function abrirEtiquetas(varianteId?: number | null) {
  if (!varianteId) {
    toast.error('Variante não encontrada')
    return
  }
  store.idMutation = varianteId
  store.openModalEtiquetas = true
}

async function deletar(id: number) {
  if (!id) return toast.error('ID não informado')
  const confirm = await useConfirm().confirm({
    title: 'Excluir variante',
    message: 'Tem certeza que deseja excluir esta variante?',
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return
  try {
    await ProdutoVarianteRepository.remove(id)
    store.updateTable()
    toast.success('Variante deletada com sucesso')
  } catch (error) {
    console.log(error)
    toast.error('Erro ao deletar a variante')
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
      <DropdownMenuItem @click="router.push(`/produtos/detalhes?id=${data.produtoBaseId}&varianteId=${data.id}`)">Ver produto</DropdownMenuItem>
      <DropdownMenuItem @click="store.openUpdateVariante(data.id!)">Editar variante</DropdownMenuItem>
      <DropdownMenuItem @click="openModalReposicao(data.id)">Repor variante</DropdownMenuItem>
      <DropdownMenuItem @click="gerarRelatorio(data.id)">Central de relatórios</DropdownMenuItem>
      <DropdownMenuItem @click="abrirEtiquetas(data.id)">Etiquetas da variante</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        class="text-danger"
        :disabled="data.ehPadrao === true"
        @click="deletar(data.id!)"
      >
        {{ data.ehPadrao ? 'Variante padrão não pode ser excluída' : 'Excluir variante' }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
