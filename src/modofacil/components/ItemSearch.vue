<script setup lang="ts">
import { nextTick, ref } from 'vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import type { SelectAjaxLoader, SelectAjaxOption } from '@/components/formulario/select-ajax'
import { api, type Row } from '../adapters/domain'
import { money, quantity } from '../application/format'
const props = defineProps<{
  kind?: 'PRODUTO' | 'SERVICO' | 'PESSOA'
  personType?: 'CLIENTE' | 'FORNECEDOR'
}>()
const emit = defineEmits<{ select: [row: Row] }>()
const selected = ref<string | number | null>(null)
const load: SelectAjaxLoader = async ({ search, page }) => {
  const path =
    props.kind === 'PESSOA'
      ? '/modofacil/pessoas'
      : props.kind === 'SERVICO'
        ? '/modofacil/servicos'
        : '/produtos'
  const result = await api.page(path, {
    search,
    page,
    ...(props.kind === 'PESSOA' ? { tipo: props.personType } : {}),
    ...(props.kind !== 'PESSOA' && props.kind !== 'SERVICO' ? { listingMode: 'variante' } : {}),
  })
  return {
    results: result.rows.map((row) => ({
      id: row.id,
      label: [row.nome, row.nomeVariante].filter(Boolean).join(' · ') || `#${row.id}`,
      caminho:
        props.kind === 'PESSOA'
          ? row.nome
          : `${row.nome} ${row.nomeVariante || ''} · ${money(row.precoPromocional ?? row.preco)}${props.kind !== 'SERVICO' ? ` · Estoque ${quantity(row.estoque)} ${row.unidade || ''}` : ''}`,
      disabled: !!props.personType && row.tipo !== props.personType,
      record: row,
    })),
    hasMore: page < result.pages,
  }
}
async function choose(item: SelectAjaxOption) {
  emit('select', item.record as Row)
  await nextTick()
  selected.value = null
}
</script>
<template>
  <div class="my-3 min-w-0">
    <Select2Ajax
      :key="`${kind || 'PRODUTO'}:${personType || ''}`"
      v-model="selected"
      :load-options="load"
      :placeholder="
        kind === 'PESSOA'
          ? 'Buscar pessoa por nome ou código'
          : kind === 'SERVICO'
            ? 'Buscar serviço por nome ou código'
            : 'Buscar produto e variante por nome ou código'
      "
      @select="choose"
    />
  </div>
</template>
