<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Table } from '@tanstack/vue-table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { LoaderCircle, Tags, Trash2, UserRound, X } from 'lucide-vue-next'
import { useConfirm } from '@/composables/useConfirm'
import { useToast } from 'vue-toastification'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'

const props = defineProps<{ table: Table<any> }>()
const store = useLancamentosStore()
const toast = useToast()
const categoriaDialogOpen = ref(false)
const clienteDialogOpen = ref(false)
const categoriaId = ref<number | null>(null)
const clienteId = ref<number | null>(null)
const saving = ref(false)

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

function abrirCategoria() {
  categoriaId.value = null
  categoriaDialogOpen.value = true
}

function abrirCliente() {
  clienteId.value = null
  clienteDialogOpen.value = true
}

async function atualizarEmMassa(tipo: 'categoria' | 'cliente') {
  if (!store.selectedIds.length) return
  if (tipo === 'categoria' && !categoriaId.value) {
    toast.info('Selecione a categoria para aplicar.')
    return
  }

  const confirm = await useConfirm().confirm({
    title: tipo === 'categoria' ? 'Alterar categoria' : 'Alterar cliente/fornecedor',
    message: `Aplicar esta alteração em ${store.selectedIds.length} lançamento(s) selecionado(s)?`,
    confirmText: 'Sim, aplicar',
  })
  if (!confirm) return

  try {
    saving.value = true
    const response = await LancamentosRepository.atualizarEmMassa([...store.selectedIds],
      tipo === 'categoria' ? { categoriaId: categoriaId.value! } : { clienteId: clienteId.value },
    )
    toast.success(`${response.data.atualizados} lançamento(s) atualizado(s) com sucesso.`)
    categoriaDialogOpen.value = false
    clienteDialogOpen.value = false
    limparSelecao()
    store.updateTable()
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível atualizar os lançamentos selecionados.')
  } finally {
    saving.value = false
  }
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
      <Button size="sm" variant="outline" @click="abrirCategoria">
        <Tags class="h-4 w-4" /> Categoria
      </Button>
      <Button size="sm" variant="outline" @click="abrirCliente">
        <UserRound class="h-4 w-4" /> Cliente
      </Button>
      <Button size="sm" variant="destructive" @click="excluir">
        <Trash2 class="h-4 w-4" /> Excluir
      </Button>
      <Button size="sm" variant="ghost" class="text-muted-foreground" @click="limparSelecao">
        <X class="h-4 w-4" /> Limpar
      </Button>
    </div>
  </div>

  <Dialog v-model:open="categoriaDialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Alterar categoria em massa</DialogTitle>
        <DialogDescription>A categoria será aplicada aos {{ total }} lançamentos selecionados.</DialogDescription>
      </DialogHeader>
      <div class="space-y-2 py-2">
        <Label for="categoria-lancamentos-massa">Categoria</Label>
        <Select2Ajax id="categoria-lancamentos-massa" v-model:model-value="categoriaId" url="/lancamentos/categorias/select2" placeholder="Selecione a categoria" />
      </div>
      <DialogFooter>
        <Button variant="outline" :disabled="saving" @click="categoriaDialogOpen = false">Cancelar</Button>
        <Button :disabled="saving || !categoriaId" @click="atualizarEmMassa('categoria')"><LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />Aplicar categoria</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="clienteDialogOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Alterar cliente/fornecedor em massa</DialogTitle>
        <DialogDescription>O cliente/fornecedor será aplicado aos {{ total }} lançamentos selecionados.</DialogDescription>
      </DialogHeader>
      <div class="space-y-2 py-2">
        <Label for="cliente-lancamentos-massa">Cliente / fornecedor</Label>
        <Select2Ajax id="cliente-lancamentos-massa" v-model:model-value="clienteId" url="/clientes/select2" placeholder="Selecione o cliente ou fornecedor" />
      </div>
      <DialogFooter>
        <Button variant="outline" :disabled="saving" @click="clienteDialogOpen = false">Cancelar</Button>
        <Button :disabled="saving || !clienteId" @click="atualizarEmMassa('cliente')"><LoaderCircle v-if="saving" class="mr-2 h-4 w-4 animate-spin" />Aplicar cliente</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
