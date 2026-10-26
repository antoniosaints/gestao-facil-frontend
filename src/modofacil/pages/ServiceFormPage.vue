<script setup lang="ts">
import FormBack from '../components/FormBack.vue'
import { useFormDestination } from '../application/formReturn'
import { Textarea } from '@/components/ui/textarea'

import { Input } from '@/components/ui/input'

import SuccessPanel from '../components/SuccessPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { api, ServicoRepository } from '../adapters/domain'
import { decimal, errorMessage } from '../application/format'
import { useFlow } from '../application/useFlow'
import Feedback from '../components/Feedback.vue'
const route = useFormContext(),
  id = Number(route.params.id) || undefined,
  loading = ref(false)
onMounted(async () => {
  if (!id) return
  loading.value = true
  try {
    const record = await api.read(`/modofacil/servicos/${id}`)
    nome.value = record.nome
    preco.value = String(record.preco)
    descricao.value = record.descricao || ''
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
})
const nome = ref(''),
  preco = ref(''),
  descricao = ref(''),
  busy = ref(false),
  dirty = ref(false),
  error = ref(''),
  done = ref(false),
  uncertain = ref(false)
useFlow(dirty, busy)
async function save() {
  busy.value = true
  error.value = ''
  let sent = false
  try {
    const value = decimal(preco.value)
    if (value <= 0) throw new Error('O cadastro atual de serviços exige preço maior que zero.')
    sent = true
    await ServicoRepository.saveOrUpdate({
      ...(id ? { id } : {}),
      nome: nome.value.trim(),
      preco: value,
      descricao: descricao.value,
      status: true,
    })
    done.value = true
    dirty.value = false
  } catch (e) {
    error.value = errorMessage(e)
    if (sent && !(e as any).response) {
      uncertain.value = true
      error.value += ' Confira a lista antes de repetir.'
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
      ><template #title>{{ id ? 'Editar serviço' : 'Cadastrar serviço' }}</template
      ><template #back
        ><FormBack :to="formDestination('/modofacil/servicos')">← Serviços</FormBack></template
      ></PageHeader
    >
    <p v-if="id">
      A edição altera somente nome, preço e descrição. Fiscal e status são preservados.
    </p>
    <Feedback
      :loading="loading"
      :error="error"
      :message="done ? 'Serviço salvo.' : ''"
      @retry="error = ''"
    />
    <form
      v-if="!done && !loading"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="save"
      @input="dirty = true"
    >
      <fieldset class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2" :disabled="busy || uncertain">
        <label>Nome<Input v-model="nome" required /></label
        ><label>Preço<Input v-model="preco" inputmode="decimal" required /></label
        ><label class="mf-full col-span-full">Descrição<Textarea v-model="descricao" /></label>
        <div
          class="mf-actions col-span-full flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
        >
          <button
            class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          >
            {{ busy ? 'Salvando…' : 'Salvar serviço' }}
          </button>
        </div>
      </fieldset>
    </form>
    <SuccessPanel
      v-if="done"
      title="Serviço salvo"
      :to="formDestination('/modofacil/servicos')"
      label="Voltar aos serviços"
    />
  </PageFrame>
</template>
