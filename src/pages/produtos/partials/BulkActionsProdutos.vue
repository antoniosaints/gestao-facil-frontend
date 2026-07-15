<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, Loader2, Trash2, X } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { useConfirm } from '@/composables/useConfirm'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { ProdutoRepository } from '@/repositories/produto-repository'

const store = useProdutoStore()
const toast = useToast()

const total = computed(() => store.selectedIds.length)
const scope = computed<'base' | 'variante'>(() => (store.filters.listingMode === 'variante' ? 'variante' : 'base'))
const noun = computed(() => (scope.value === 'variante' ? 'variante(s)' : 'produto(s)'))
const loading = ref(false)

function limparSelecao() {
  store.resetSelectedIds()
}

async function alterarVisibilidade(mostrar: boolean) {
  if (!store.selectedIds.length || loading.value) return
  try {
    loading.value = true
    const { atualizados } = await ProdutoRepository.setCatalogoVisibilidade(
      [...store.selectedIds],
      mostrar,
      scope.value,
    )
    toast.success(
      mostrar
        ? `${atualizados} item(ns) agora aparecem no catálogo online`
        : `${atualizados} item(ns) ocultados do catálogo online`,
    )
    store.updateTable()
  } catch (error) {
    console.log(error)
    toast.error('Erro ao atualizar a visibilidade no catálogo')
  } finally {
    loading.value = false
  }
}

// Exclusão em massa só faz sentido nos produtos base (a variante padrão não pode ser excluída).
async function excluirEmLote() {
  if (!store.selectedIds.length || loading.value) return
  const confirm = await useConfirm().confirm({
    title: 'Excluir em lote',
    message: 'Tem certeza que deseja excluir esses produtos e suas variantes?',
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return
  try {
    loading.value = true
    await Promise.all(store.selectedIds.map((id) => ProdutoRepository.remove(id)))
    toast.success('Produtos excluídos com sucesso')
    store.updateTable()
  } catch (error) {
    console.log(error)
    toast.error('Erro ao excluir os produtos')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div
    v-if="total > 0"
    class="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2"
  >
    <span class="text-sm font-medium text-foreground">
      {{ total }} {{ noun }} selecionado(s)
    </span>

    <div class="ml-auto flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        class="bg-violet-600 text-white hover:bg-violet-700"
        :disabled="loading"
        @click="alterarVisibilidade(true)"
      >
        <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
        <Eye v-else class="h-4 w-4" /> Mostrar no catálogo
      </Button>
      <Button
        size="sm"
        variant="secondary"
        :disabled="loading"
        @click="alterarVisibilidade(false)"
      >
        <EyeOff class="h-4 w-4" /> Ocultar do catálogo
      </Button>
      <Button
        v-if="scope === 'base'"
        size="sm"
        variant="destructive"
        :disabled="loading"
        @click="excluirEmLote"
      >
        <Trash2 class="h-4 w-4" /> Excluir
      </Button>
      <Button
        size="sm"
        variant="ghost"
        class="text-muted-foreground"
        :disabled="loading"
        @click="limparSelecao"
      >
        <X class="h-4 w-4" /> Limpar
      </Button>
    </div>
  </div>
</template>
