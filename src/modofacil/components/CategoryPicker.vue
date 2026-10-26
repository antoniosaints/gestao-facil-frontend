<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { SelectAjaxLoader } from '@/components/formulario/select-ajax'
import { api } from '../adapters/domain'
import { errorMessage } from '../application/format'
import ModalDialog from './ModalDialog.vue'
const selected = defineModel<number | null>({ required: true })
const props = defineProps<{ initialLabel?: string }>()
const label = ref(props.initialLabel || ''),
  creating = ref(false),
  busy = ref(false),
  name = ref(''),
  error = ref('')
const revision = ref(0)
const load: SelectAjaxLoader = async ({ search, page, id }) => {
  if (id != null && label.value) return { results: [{ id, label: label.value }] }
  const result = await api.page('/modofacil/produtos/categorias', {
    search,
    page,
    ...(id != null ? { id } : {}),
  })
  return {
    results: result.rows
      .filter((row) => id == null || row.id === Number(id))
      .map((row) => ({ id: row.id, label: row.nome || `#${row.id}` })),
    hasMore: page < result.pages,
  }
}
async function create() {
  if (busy.value || !name.value.trim()) return
  busy.value = true
  error.value = ''
  try {
    const row = await api.post('/modofacil/produtos/categorias', { nome: name.value.trim() })
    selected.value = row.id
    label.value = row.nome
    name.value = ''
    revision.value++
    creating.value = false
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <div class="grid min-w-0 gap-1.5">
    <span class="text-xs font-medium">Categoria</span>
    <div class="flex min-w-0 items-start gap-1">
      <Select2Ajax
        :key="revision"
        :model-value="selected"
        v-model:label="label"
        :load-options="load"
        placeholder="Selecionar categoria"
        allow-clear
        @update:model-value="selected = $event == null ? null : Number($event)"
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        class="shrink-0"
        aria-label="Criar categoria sem sair"
        @click="creating = true"
        ><Plus :size="16"
      /></Button>
    </div>
    <ModalDialog
      v-if="creating"
      title="Nova categoria"
      size="sm"
      :busy="busy"
      :error="error"
      @close="creating = false"
    >
      <form class="grid gap-4" @submit.prevent="create">
        <label
          >Nome da categoria<Input v-model="name" required maxlength="100" :disabled="busy"
        /></label>
        <div class="flex justify-end gap-2">
          <Button type="button" variant="outline" :disabled="busy" @click="creating = false"
            >Cancelar</Button
          ><Button type="submit" :disabled="busy || !name.trim()">{{
            busy ? 'Salvando…' : 'Criar e escolher categoria'
          }}</Button>
        </div>
      </form>
    </ModalDialog>
  </div>
</template>
