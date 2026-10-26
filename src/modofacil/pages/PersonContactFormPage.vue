<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { Input } from '@/components/ui/input'
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
const form = reactive({ nome: '', telefone: '', email: '', whastapp: '' })
const { busy, error, message, uncertain, run } = useDomainMutation()
useFlow(dirty, busy)
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    record.value = await api.read(`/modofacil/pessoas/${id}`)
    for (const key of Object.keys(form) as (keyof typeof form)[])
      form[key] = record.value![key] || ''
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
  const body: Record<string, string | null> = {}
  for (const key of Object.keys(form) as (keyof typeof form)[]) {
    const value = form[key].trim() || null
    if (value !== (record.value[key] || null)) body[key] = value
  }
  if (Object.keys(body).length) {
    const result = await run(
      () => api.patch(`/modofacil/pessoas/${id}/basico`, body),
      'Nome e contato atualizados.',
    )
    if (!result) return
  }
  dirty.value = false
  done.value = true
}
</script>
<template>
  <PageFrame compact>
    <Feedback :loading="loading" :error="loadError || error" :message="message" @retry="load" />
    <form v-if="record && !done" class="grid gap-4" @submit.prevent="save" @input="dirty = true">
      <fieldset class="grid grid-cols-1 gap-4 md:grid-cols-2" :disabled="busy || uncertain">
        <label>Nome<Input v-model="form.nome" required minlength="2" maxlength="191" /></label>
        <label>Telefone<Input v-model="form.telefone" type="tel" maxlength="191" /></label>
        <label>E-mail<Input v-model="form.email" type="email" maxlength="191" /></label>
        <label>WhatsApp<Input v-model="form.whastapp" type="tel" maxlength="191" /></label>
      </fieldset>
      <div
        class="mf-actions flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
      >
        <FormBack to="/modofacil/pessoas" :disabled="busy">Cancelar</FormBack>
        <button :disabled="busy || uncertain" class="!border-blue-600 !bg-blue-600 !text-white">
          {{ busy ? 'Salvando…' : 'Salvar nome e contato' }}
        </button>
      </div>
    </form>
    <SuccessPanel
      v-if="done"
      title="Nome e contato atualizados"
      description="Documento, endereço, tipo e status preservados."
      to="/modofacil/pessoas"
      label="Concluir"
    />
  </PageFrame>
</template>
