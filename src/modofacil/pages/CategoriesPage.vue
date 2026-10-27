<script setup lang="ts">
import { Input } from '@/components/ui/input'

import ModalDialog from '../components/ModalDialog.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import RecordsTable from '../components/RecordsTable.vue'
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
  message.value = ''
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
      <form class="grid gap-4" @submit.prevent="save">
        <fieldset :disabled="busy" class="grid gap-4">
          <label
            >Nome da nova categoria<Input placeholder="Ex.: Bebidas" v-model="nome" required
          /></label>
          <div class="mf-form-actions mf-actions">
            <button type="button" @click="creating = false">Cancelar</button>
            <button class="mf-primary" :disabled="busy">
              {{ busy ? 'Salvando…' : 'Criar categoria' }}
            </button>
          </div>
        </fieldset>
      </form>
    </ModalDialog>
    <form class="mf-actions my-4 flex flex-wrap items-end gap-3" @submit.prevent="load(true)">
      <label
        >Buscar categoria<Input
          placeholder="Buscar pelo nome da categoria"
          v-model="search"
          type="search" /></label
      ><button>Buscar</button>
    </form>
    <Feedback :error="error" :loading="loading" :message="message" @retry="load()" />
    <RecordsTable
      :rows="rows"
      :loading="loading"
      :failed="!!error"
      caption="Categorias de produtos"
      empty="Nenhuma categoria encontrada."
      :columns="[
        { key: 'id', label: 'Código' },
        { key: 'nome', label: 'Categoria' },
      ]"
    />
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
