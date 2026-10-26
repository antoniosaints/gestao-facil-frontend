<script setup lang="ts">
import FormResultLink from '../components/FormResultLink.vue'
import FormBack from '../components/FormBack.vue'
import { useFormDestination } from '../application/formReturn'
import { Input } from '@/components/ui/input'

import { reactive, ref } from 'vue'
import PageFrame from '../components/PageFrame.vue'
import PageHeader from '../components/PageHeader.vue'
import SuccessPanel from '../components/SuccessPanel.vue'
import { useFormContext } from '../application/modalWorkspace'
import { api } from '../adapters/domain'
import { errorMessage } from '../application/format'
import { useFlow } from '../application/useFlow'
import Feedback from '../components/Feedback.vue'
const route = useFormContext()
const form = reactive({
    nome: '',
    tipo: route.query.tipo === 'FORNECEDOR' ? 'FORNECEDOR' : 'CLIENTE',
    telefone: '',
    email: '',
  }),
  dirty = ref(false),
  busy = ref(false),
  error = ref(''),
  id = ref(0),
  uncertain = ref(false)
useFlow(dirty, busy)
async function save() {
  busy.value = true
  error.value = ''
  try {
    const result = await api.post('/modofacil/pessoas', {
      nome: form.nome.trim(),
      tipo: form.tipo,
      telefone: form.telefone || null,
      email: form.email || null,
    })
    id.value = result.id
    dirty.value = false
  } catch (e) {
    error.value = errorMessage(e)
    if (!(e as any).response) {
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
        <label
          >Nome completo <span class="text-red-500">*</span
          ><Input
            v-model="form.nome"
            required
            autocomplete="name"
            placeholder="Nome do cliente ou fornecedor"
        /></label>
        <label
          >Tipo de cadastro<select v-model="form.tipo">
            <option value="CLIENTE">Cliente</option>
            <option value="FORNECEDOR">Fornecedor</option>
          </select></label
        >
        <label
          >E-mail<Input
            v-model="form.email"
            type="email"
            autocomplete="email"
            placeholder="nome@email.com"
        /></label>
        <label
          >Telefone<Input
            v-model="form.telefone"
            type="tel"
            autocomplete="tel"
            placeholder="(00) 00000-0000"
        /></label>
        <p class="col-span-full rounded-[6px] bg-muted/50 p-3 !text-xs text-muted-foreground">
          Documento e endereço podem ser consultados nos cadastros existentes. Inclusão e edição
          desses dados ainda estão em adaptação.
        </p>
      </fieldset>
      <div
        class="mf-actions mt-4 flex flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end"
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
