<script setup lang="ts">
import { computed } from 'vue'
import type { Table } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import { Trash2, X } from 'lucide-vue-next'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from 'vue-toastification'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'

const props = defineProps<{ table: Table<any> }>()
const store = useLancamentosStore()
const toast = useToast()

const total = computed(() => store.selectedIds.length)

function limparSelecao() {
  props.table.resetRowSelection()
  store.resetSelectedIds()
}

async function excluir() {
  if (!store.selectedIds.length) return
  const confirm = await useConfirm().confirm({
    title: 'Excluir lançamentos',
    message: `Excluir ${store.selectedIds.length} lançamento(s) selecionado(s)?`,
    confirmText: 'Sim, excluir!',
  })
  if (!confirm) return

  const ids = [...store.selectedIds]
  let sucesso = 0
  let falhas = 0
  for (const id of ids) {
    try {
      await LancamentosRepository.remove(id)
      sucesso++
    } catch (error) {
      console.log(error)
      falhas++
    }
  }
  if (sucesso > 0) toast.success(`${sucesso} lançamento(s) excluído(s) com sucesso.`)
  if (falhas > 0) toast.error(`${falhas} lançamento(s) não puderam ser excluído(s).`)

  store.resetSelectedIds()
  props.table.resetRowSelection()
  store.updateTable()
}
</script>

<template>
  <div
    v-if="total > 0"
    class="mb-2 flex flex-wrap items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2"
  >
    <span class="text-sm font-medium text-foreground">
      {{ total }} lançamento(s) selecionado(s)
    </span>

    <div class="ml-auto flex flex-wrap items-center gap-2">
      <Button size="sm" variant="destructive" @click="excluir">
        <Trash2 class="h-4 w-4" /> Excluir
      </Button>
      <Button size="sm" variant="ghost" class="text-muted-foreground" @click="limparSelecao">
        <X class="h-4 w-4" /> Limpar
      </Button>
    </div>
  </div>
</template>
