<script setup lang="ts">
import { Input } from '@/components/ui/input'

import ModalDialog from '../components/ModalDialog.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, onMounted } from 'vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { api, type Row } from '../adapters/domain'
import { decimal, money, errorMessage } from '../application/format'
import { useDomainMutation } from '../application/useDomainMutation'
import { useFlow } from '../application/useFlow'
import Feedback from '../components/Feedback.vue'
const editorOpen = ref(false)
const ui = useUiStore(),
  tab = ref<'contas' | 'categorias'>('contas'),
  rows = ref<Row[]>([]),
  categories = ref<Row[]>([]),
  name = ref(''),
  balance = ref('0'),
  color = ref('#12617b'),
  parent = ref<number | null>(null),
  editId = ref<number | null>(null),
  loading = ref(false),
  loadError = ref(''),
  validation = ref(''),
  review = ref(false)
const { busy, error, message, uncertain, run } = useDomainMutation()
const canManage = computed(() => tab.value === 'categorias' || hasPermission(ui.usuarioLogged, 4))
useFlow(computed(() => !!name.value))
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    ;[rows.value, categories.value] = await Promise.all([
      api.read(`/modofacil/financeiro/${tab.value}`),
      api.read('/modofacil/financeiro/categorias'),
    ])
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
function createNew() {
  reset()
  editorOpen.value = true
}
function closeEditor() {
  editorOpen.value = false
  reset()
}
function reset() {
  name.value = ''
  balance.value = '0'
  parent.value = null
  editId.value = null
  review.value = false
}
function edit(row: Row) {
  editorOpen.value = true
  reset()
  editId.value = row.id
  name.value = row.nome || ''
  parent.value = row.categoriaPai ?? null
  color.value = row.corDestaque || '#12617b'
}
onMounted(load)
async function save() {
  validation.value = ''
  if (!canManage.value || !name.value.trim()) {
    validation.value = 'Informe o nome e confira sua permissão.'
    return
  }
  let operation: () => Promise<any>
  try {
    const initialBalance = decimal(balance.value)
    operation =
      tab.value === 'contas'
        ? editId.value
          ? () =>
              api.patch(`/modofacil/financeiro/contas/${editId.value}`, {
                nome: name.value.trim(),
                corDestaque: color.value,
              })
          : () =>
              api.post('/modofacil/financeiro/contas', {
                nome: name.value.trim(),
                saldoInicial: initialBalance,
                corDestaque: color.value,
              })
        : () =>
            api.post('/modofacil/financeiro/categorias', {
              ...(editId.value ? { id: editId.value } : {}),
              nome: name.value.trim(),
              categoriaPai: parent.value,
            })
  } catch (e) {
    validation.value = errorMessage(e)
    return
  }
  const result = await run(operation, 'Cadastro financeiro salvo.')
  if (result) {
    editorOpen.value = false
    reset()
    await load()
  }
}
</script>
<template>
  <PageFrame>
    <PageHeader
      ><template #title>Contas e categorias</template
      ><template #back
        ><RouterLink to="/modofacil/financeiro">← Dinheiro</RouterLink></template
      ></PageHeader
    >

    <nav class="mf-actions my-4 flex flex-wrap items-end gap-3" aria-label="Cadastros financeiros">
      <button
        :aria-pressed="tab === 'contas'"
        :class="tab === 'contas' ? '!border-blue-600 !bg-blue-600 !text-white' : ''"
        @click="
          () => {
            tab = 'contas'
            reset()
            load()
          }
        "
      >
        Contas financeiras</button
      ><button
        @click="
          () => {
            tab = 'categorias'
            reset()
            load()
          }
        "
      >
        Categorias
      </button>
    </nav>
    <Feedback
      :loading="loading"
      :error="validation || loadError || error"
      :message="message"
      @retry="load"
    />
    <ul class="mf-list m-0 grid list-none gap-3 p-0">
      <li
        v-for="row in rows"
        :key="row.id"
        class="mf-row flex flex-wrap items-center justify-between gap-4 break-words rounded-[6px] border border-border p-4 [&>div]:min-w-0 min-w-0 bg-card"
      >
        <div>
          <strong>{{ row.nome }}</strong
          ><small v-if="tab === 'contas'">Saldo inicial {{ money(row.saldoInicial) }}</small>
        </div>
        <button v-if="canManage" :disabled="busy || uncertain" @click="edit(row)">
          Editar {{ row.nome }}
        </button>
      </li>
    </ul>
    <button
      v-if="canManage"
      type="button"
      class="!border-blue-600 !bg-blue-600 !text-white"
      :disabled="busy || uncertain"
      @click="createNew"
    >
      {{ tab === 'contas' ? 'Nova conta financeira' : 'Nova categoria' }}
    </button>
    <ModalDialog
      v-if="canManage && editorOpen"
      :title="`${editId ? 'Editar' : 'Criar'} ${tab === 'contas' ? 'conta financeira' : 'categoria'}`"
      :busy="busy"
      :error="validation || error"
      :uncertain="uncertain"
      @close="closeEditor"
    >
      <form
        class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
        @submit.prevent="review ? save() : (review = true)"
      >
        <h2>
          {{ editId ? 'Editar' : 'Criar' }}
          {{ tab === 'contas' ? 'conta financeira' : 'categoria' }}
        </h2>
        <fieldset
          class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2"
          :disabled="busy || uncertain"
        >
          <template v-if="!review"
            ><label>Nome<Input v-model="name" required maxlength="191" /></label
            ><template v-if="tab === 'contas'"
              ><label v-if="!editId"
                >Saldo inicial<Input v-model="balance" inputmode="decimal" required /></label
              ><label>Cor de identificação<Input v-model="color" type="color" /></label>
              <p v-if="editId">O saldo inicial não é alterado por esta edição.</p></template
            ><label v-else
              >Categoria superior<select v-model="parent">
                <option :value="null">Sem categoria superior</option>
                <option
                  v-for="row in categories.filter((c) => c.id !== editId)"
                  :key="row.id"
                  :value="row.id"
                >
                  {{ row.nome }}
                </option>
              </select></label
            ></template
          >
          <section v-else class="mf-full col-span-full">
            <p>
              {{ name }} ·
              {{
                tab === 'contas'
                  ? editId
                    ? 'Saldo inicial preservado'
                    : `Saldo inicial ${balance}`
                  : `Categoria superior: ${parent || 'nenhuma'}`
              }}
            </p>
            <p>
              Somente os dados deste cadastro são alterados. A hierarquia será validada pelo
              servidor.
            </p>
          </section>
          <div
            class="mf-actions col-span-full flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
          >
            <button type="button" @click="review ? (review = false) : reset()">
              Voltar / limpar</button
            ><button
              class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
            >
              {{ busy ? 'Salvando…' : review ? 'Salvar cadastro' : 'Conferir' }}
            </button>
          </div>
        </fieldset>
      </form>
    </ModalDialog>
    <p v-if="!canManage">
      Seu perfil pode consultar as contas; criação e edição exigem administração da conta.
    </p>
  </PageFrame>
</template>
