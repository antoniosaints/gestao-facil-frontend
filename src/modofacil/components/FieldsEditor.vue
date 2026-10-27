<script setup lang="ts">
import FormSelect from './FormSelect.vue'
import FormSwitch from './FormSwitch.vue'
import { useLookupOptions } from '../adapters/lookups'
import { Input } from '@/components/ui/input'

import ReviewPanel from './ReviewPanel.vue'
import { ref, reactive, computed, watch } from 'vue'
import { changedFields, fieldPlaceholder, type FieldDefinition } from '../application/fields'
import { errorMessage } from '../application/format'
import { useFlow } from '../application/useFlow'
import { useFeedbackToasts } from '../application/notifications'
const props = defineProps<{
    fields: FieldDefinition[]
    initial: Record<string, unknown>
    busy: boolean
    uncertain: boolean
    scope?: string
  }>(),
  emit = defineEmits<{ save: [body: Record<string, unknown>] }>()
const draft = reactive<Record<string, any>>({}),
  dirty = ref(false),
  review = ref<Record<string, unknown> | null>(null),
  error = ref('')
useFeedbackToasts(error)
useFlow(
  dirty,
  computed(() => !!props.busy),
)
watch(
  () => props.initial,
  (value) => {
    for (const field of props.fields)
      draft[field.key] = value[field.key] == null ? '' : String(value[field.key])
    dirty.value = false
    review.value = null
  },
  { immediate: true },
)
const groups = computed(() => [...new Set(props.fields.map((f) => f.group || 'Informações'))])
const lookupLoaders = {
  'finance-accounts': useLookupOptions('finance-accounts').load,
  'finance-categories': useLookupOptions('finance-categories').load,
  'product-categories': useLookupOptions('product-categories').load,
}
function next() {
  error.value = ''
  try {
    const body = changedFields(props.fields, draft, props.initial)
    if (!Object.keys(body).length) throw new Error('Nenhum campo foi alterado.')
    review.value = body
  } catch (e) {
    error.value = errorMessage(e)
  }
}
</script>
<template>
  <form
    class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
    @submit.prevent="review ? emit('save', review) : next()"
    @input="dirty = true"
  >
    <p>
      Somente os campos alterados são enviados. Campo vazio remove explicitamente o valor quando
      permitido pelo contrato.
    </p>
    <p
      v-if="error"
      class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300 mf-error !border-red-500/30 !bg-red-500/10 !text-red-800 dark:!text-red-300"
      role="alert"
    >
      {{ error }}
    </p>
    <fieldset class="mf-stack grid gap-4" :disabled="busy || uncertain">
      <template v-if="!review"
        ><details v-for="(group, i) in groups" :key="group" :open="i === 0">
          <summary>{{ group }}</summary>
          <div class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
            <label
              v-for="field in fields.filter((f) => (f.group || 'Informações') === group)"
              :key="field.key"
              :class="
                field.type === 'boolean' && field.nullable === false
                  ? 'mf-choice !flex items-center justify-between gap-4 rounded-md border border-border p-3 !space-y-0'
                  : ''
              "
              >{{ field.label
              }}<FormSwitch
                v-if="field.type === 'boolean' && field.nullable === false"
                :model-value="draft[field.key] === 'true'"
                @update:model-value="draft[field.key] = String($event)"
              /><FormSelect
                v-else-if="field.type === 'boolean'"
                v-model="draft[field.key]"
                :options="[
                  { value: '', label: 'Não informado' },
                  { value: 'true', label: 'Sim' },
                  { value: 'false', label: 'Não' },
                ]"
              /><FormSelect
                v-else-if="field.lookup"
                :model-value="draft[field.key] === '' ? null : Number(draft[field.key])"
                :load-options="lookupLoaders[field.lookup]"
                :options="field.nullable === false ? [] : [{ value: null, label: 'Não informado' }]"
                :required="field.nullable === false"
                @update:model-value="draft[field.key] = $event == null ? '' : String($event)"
              /><FormSelect
                v-else-if="field.type === 'select'"
                v-model="draft[field.key]"
                :options="[
                  { value: '', label: 'Não informado' },
                  ...(field.options || []).map(([code, label]) => ({ value: code, label: label })),
                ]"
              /><Input
                :placeholder="fieldPlaceholder(field)"
                v-else
                v-model="draft[field.key]"
                :inputmode="field.type === 'number' ? 'decimal' : undefined"
              /><small v-if="field.hint">{{ field.hint }}</small></label
            >
          </div>
        </details></template
      >
      <ReviewPanel v-else>
        <template #title>Confira as alterações</template>
        <p
          v-if="scope"
          class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300"
        >
          {{ scope }}
        </p>
        <dl>
          <template v-for="(value, key) in review" :key="key"
            ><dt>{{ fields.find((f) => f.key === key)?.label }}</dt>
            <dd>
              {{
                value === null
                  ? 'Remover valor'
                  : typeof value === 'boolean'
                    ? value
                      ? 'Sim'
                      : 'Não'
                    : value
              }}
            </dd></template
          >
        </dl>
      </ReviewPanel>
      <div class="mf-form-actions mf-actions my-4 flex flex-wrap items-end gap-3">
        <button v-if="review" type="button" @click="review = null">Voltar</button
        ><button
          class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
        >
          {{ busy ? 'Salvando…' : review ? 'Salvar alterações revisadas' : 'Conferir alterações' }}
        </button>
      </div>
    </fieldset>
  </form>
</template>
