<script setup lang="ts">
import { computed, ref } from 'vue'
import { Loader2, Trash2, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useConfirm } from '@/composables/useConfirm'
import { ProdutoCategoriaRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { useToast } from 'vue-toastification'

const store = useProdutoStore()
const toast = useToast()
const loading = ref(false)
const total = computed(() => store.selectedCategoriaIds.length)

async function excluirEmLote() {
  if (!total.value || loading.value) return
  const confirmed = await useConfirm().confirm({
    title: 'Excluir categorias em lote',
    message: `Deseja excluir ${total.value} categoria(s)? Os produtos vinculados permanecerão cadastrados, mas ficarão sem categoria.`,
    confirmText: 'Excluir categorias',
    cancelText: 'Cancelar',
    colorButton: 'danger',
  })
  if (!confirmed) return

  try {
    loading.value = true
    const ids = [...store.selectedCategoriaIds]
    await Promise.all(ids.map((id) => ProdutoCategoriaRepository.remove(id)))
    toast.success(`${ids.length} categoria(s) excluída(s) com sucesso.`)
    store.updateTable()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível excluir as categorias selecionadas.')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="total" class="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2">
    <span class="text-sm font-medium text-foreground">{{ total }} categoria(s) selecionada(s)</span>
    <div class="ml-auto flex flex-wrap items-center gap-2">
      <Button size="sm" variant="destructive" :disabled="loading" @click="excluirEmLote"><Loader2 v-if="loading" class="h-4 w-4 animate-spin" /><Trash2 v-else class="h-4 w-4" />Excluir</Button>
      <Button size="sm" variant="ghost" class="text-muted-foreground" :disabled="loading" @click="store.resetSelectedCategoriaIds()"><X class="h-4 w-4" />Limpar</Button>
    </div>
  </div>
</template>
