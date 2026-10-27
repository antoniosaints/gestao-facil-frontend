<script setup lang="ts">
import PersonFields from '../components/PersonFields.vue'
import { emptyPerson, personPayload } from '../application/personForm'
import FormResultLink from '../components/FormResultLink.vue'
import FormBack from '../components/FormBack.vue'
import { useFormDestination } from '../application/formReturn'

import { reactive, ref } from 'vue'
import PageFrame from '../components/PageFrame.vue'
import PageHeader from '../components/PageHeader.vue'
import SuccessPanel from '../components/SuccessPanel.vue'
import { useFormContext } from '../application/modalWorkspace'
import { api } from '../adapters/domain'
import { errorMessage } from '../application/format'
import { useFlow } from '../application/useFlow'
import Feedback from '../components/Feedback.vue'
import { notifySuccess } from '../application/notifications'
const route = useFormContext()
const form = reactive(emptyPerson(route.query.tipo === 'FORNECEDOR' ? 'FORNECEDOR' : 'CLIENTE')),
  dirty = ref(false),
  busy = ref(false),
  error = ref(''),
  id = ref(0),
  uncertain = ref(false)
useFlow(dirty, busy)
async function save() {
  if (busy.value || uncertain.value || id.value) return
  busy.value = true
  error.value = ''
  let sent = false
  try {
    const body = personPayload(form)
    sent = true
    const result = await api.post('/modofacil/pessoas', body)
    if (!result?.id)
      throw new Error('Não foi possível confirmar o cadastro. Confira a lista de pessoas.')
    id.value = result.id
    dirty.value = false
    notifySuccess('Pessoa cadastrada.')
  } catch (e) {
    error.value = errorMessage(e)
    if (sent && (!(e as any).response || (e as any).response.status >= 500)) {
      uncertain.value = true
      error.value += ' Confira Pessoas antes de repetir; o cadastro pode ter sido criado.'
    }
  } finally {
    busy.value = false
  }
}

const formDestination = useFormDestination()
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>Nova pessoa</template
      ><template #description
        >Cadastre os dados básicos do cliente ou fornecedor.</template
      ></PageHeader
    >
    <Feedback :error="error" @retry="error = ''" />
    <form v-if="!id" @submit.prevent="save" @input="dirty = true">
      <fieldset class="grid grid-cols-1 gap-4 sm:grid-cols-2" :disabled="busy || uncertain">
        <PersonFields :form="form" @change="dirty = true" />
      </fieldset>
      <div
        class="mf-form-actions mf-actions mt-4 flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end"
      >
        <FormBack :to="formDestination('/modofacil/pessoas')" class="mf-button !bg-muted/50"
          >Cancelar</FormBack
        ><button
          class="!border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
          :disabled="busy || uncertain"
        >
          {{ busy ? 'Salvando…' : 'Salvar pessoa' }}
        </button>
      </div>
    </form>
    <SuccessPanel v-if="id" title="Pessoa cadastrada" description="Os dados foram salvos.">
      <FormResultLink
        :to="`/modofacil/pessoas/${id}`"
        class="mf-button !border-blue-600 !bg-blue-600 !text-white"
        >Ver pessoa cadastrada</FormResultLink
      >
    </SuccessPanel>
  </PageFrame>
</template>
