<script setup lang="ts" generic="T extends string | number | boolean | null">
import { computed, nextTick, ref, useAttrs, watch } from 'vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import type { SelectAjaxLoader, SelectAjaxOption } from '@/components/formulario/select-ajax'

defineOptions({ inheritAttrs: false })
const props = withDefaults(
  defineProps<{
    modelValue: T
    options?: { value: T; label?: string | number; disabled?: boolean }[]
    loadOptions?: SelectAjaxLoader
    placeholder?: string
    required?: boolean
    disabled?: boolean
  }>(),
  { options: () => [] },
)
const emit = defineEmits<{ 'update:modelValue': [value: T] }>()
const attrs = useAttrs()
const control = ref<InstanceType<typeof Select2Ajax>>()
const selected = computed(() =>
  (props.required ||
    (props.loadOptions && !props.options.some((option) => option.value === props.modelValue))) &&
  (props.modelValue == null || props.modelValue === '')
    ? null
    : JSON.stringify(props.modelValue),
)
const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
const load: SelectAjaxLoader = async (query) => {
  const options: SelectAjaxOption[] = props.options.map((option) => ({
    id: JSON.stringify(option.value),
    label: String(option.label ?? option.value ?? 'Padrão'),
    disabled: option.disabled,
  }))
  const local = options.filter((option) =>
    query.id != null
      ? option.id === query.id
      : normalize(option.label).includes(normalize(query.search)),
  )
  if (!props.loadOptions || (query.id != null && local.length)) return { results: local }
  const result = await props.loadOptions({
    ...query,
    ...(query.id != null ? { id: JSON.parse(String(query.id)) } : {}),
  })
  return {
    ...result,
    results: [
      ...local,
      ...result.results.map((option) => ({ ...option, id: JSON.stringify(option.id) })),
    ],
  }
}
async function update(value: string | number | null) {
  const next = value == null ? null : JSON.parse(String(value))
  if (next === props.modelValue) return
  emit('update:modelValue', next as T)
  await nextTick()
  control.value?.$el.dispatchEvent(new Event('input', { bubbles: true }))
}
watch(
  () => JSON.stringify(props.options),
  () => control.value?.refresh(),
)
</script>
<template>
  <Select2Ajax
    ref="control"
    v-bind="attrs"
    :model-value="selected"
    :load-options="load"
    :required="required"
    :disabled="disabled"
    :use-placeholder-as-label="false"
    :placeholder="placeholder || 'Selecione…'"
    @update:model-value="update"
  />
</template>
