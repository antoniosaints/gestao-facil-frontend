<script setup lang="ts">
import { Input } from '@/components/ui/input'

import ModalDialog from '../components/ModalDialog.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted } from 'vue'
import { usePage } from '../application/usePage'
import { api } from '../adapters/domain'
import { errorMessage } from '../application/format'
import Feedback from '../components/Feedback.vue'
import PageControls from '../components/PageControls.vue'
const { rows, page, pages, total, search, loading, error, load } = usePage(
  () => '/modofacil/produtos/categorias',
)
const creating = ref(false)
const nome = ref(''),
  busy = ref(false),
  message = ref('')
onMounted(() => load())
async function save() {
  busy.value = true
  error.value = ''
  try {
    await api.post('/modofacil/produtos/categorias', { nome: nome.value.trim() })
    nome.value = ''
    message.value = 'Categoria cadastrada.'
    creating.value = false
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <PageFrame>
    <PageHeader
      ><template #title>Categorias</template
      ><template #description>Organize seus produtos por assunto.</template
      ><template #back
        ><RouterLink to="/modofacil/produtos">← Produtos</RouterLink></template
      ></PageHeader
    >

    <button
      type="button"
      class="!border-blue-600 !bg-blue-600 !text-white"
      @click="creating = true"
    >
      Nova categoria
    </button>
    <ModalDialog
      v-if="creating"
      title="Nova categoria"
      size="sm"
      :busy="busy"
      :error="error"
      @close="creating = false"
    >
      <form
        class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-actions my-4 flex flex-wrap items-end gap-3"
        @submit.prevent="save"
      >
        <label>Nome da nova categoria<Input v-model="nome" required /></label
        ><button
          class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          :disabled="busy"
        >
          Criar categoria
        </button>
      </form>
    </ModalDialog>
    <form class="mf-actions my-4 flex flex-wrap items-end gap-3" @submit.prevent="load(true)">
      <label>Buscar categoria<Input v-model="search" type="search" /></label><button>Buscar</button>
    </form>
    <Feedback :error="error" :loading="loading" :message="message" @retry="load()" />
    <ul class="mf-list m-0 grid list-none gap-3 p-0">
      <li
        class="mf-row flex flex-wrap items-center justify-between gap-4 break-words rounded-[6px] border border-border p-4 [&>div]:min-w-0 min-w-0 bg-card"
        v-for="row in rows"
        :key="row.id"
      >
        {{ row.nome }}
      </li>
    </ul>
    <PageControls
      :page="page"
      :pages="pages"
      :total="total"
      :loading="loading"
      @change="
        ($event) => {
          page = $event
          load()
        }
      "
    />
  </PageFrame>
</template>
