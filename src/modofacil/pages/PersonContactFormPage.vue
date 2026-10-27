<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import PersonFields from '../components/PersonFields.vue'
import { emptyPerson, personPayload } from '../application/personForm'
import { api, type Row } from '../adapters/domain'
import { useFormContext } from '../application/modalWorkspace'
import { useDomainMutation } from '../application/useDomainMutation'
import { useFlow } from '../application/useFlow'
import { errorMessage } from '../application/format'
import PageFrame from '../components/PageFrame.vue'
import Feedback from '../components/Feedback.vue'
import FormBack from '../components/FormBack.vue'
import SuccessPanel from '../components/SuccessPanel.vue'
const id = Number(useFormContext().params.id)
const record = ref<Row | null>(null),
  loading = ref(false),
  loadError = ref(''),
  dirty = ref(false),
  done = ref(false)
const form = reactive(emptyPerson())
const validation = ref('')
const { busy, error, message, uncertain, run } = useDomainMutation()
useFlow(dirty, busy)
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    record.value = await api.read(`/modofacil/pessoas/${id}`)
    if (!record.value?.id) throw new Error('Pessoa não encontrada.')
    for (const key of Object.keys(form) as (keyof typeof form)[])
      form[key] = record.value![key] ?? emptyPerson()[key]
  } catch (e) {
    record.value = null
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
async function save() {
  if (!record.value) return
  validation.value = ''
  let body
  try {
    body = personPayload(form, record.value)
  } catch (e) {
    validation.value = errorMessage(e)
    return
  }
  if (Object.keys(body).length) {
    const result = await run(
      () => api.patch(`/modofacil/pessoas/${id}/basico`, body),
      'Cadastro da pessoa atualizado.',
    )
    if (!result) return
  }
  dirty.value = false
  done.value = true
}
</script>
<template>
  <PageFrame compact>
    <Feedback
      :loading="loading"
      :error="loadError || validation || error"
      :message="message"
      @retry="load"
    />
    <form
      v-if="record && !loading && !done"
      class="grid gap-4"
      @submit.prevent="save"
      @input="dirty = true"
    >
      <fieldset class="grid grid-cols-1 gap-4 md:grid-cols-2" :disabled="busy || uncertain">
        <PersonFields :form="form" editing @change="dirty = true" />
      </fieldset>
      <div
        class="mf-form-actions mf-actions flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
      >
        <FormBack to="/modofacil/pessoas" :disabled="busy">Cancelar</FormBack>
        <button :disabled="busy || uncertain" class="!border-blue-600 !bg-blue-600 !text-white">
          {{ busy ? 'Salvando…' : 'Salvar alterações' }}
        </button>
      </div>
    </form>
    <SuccessPanel
      v-if="done"
      title="Pessoa atualizada"
      description="As alterações do cadastro foram salvas."
      to="/modofacil/pessoas"
      label="Concluir"
    />
  </PageFrame>
</template>
