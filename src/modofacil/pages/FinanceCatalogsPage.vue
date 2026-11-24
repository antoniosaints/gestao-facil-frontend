<script setup lang="ts">
import { useRoute } from 'vue-router'
import { linkedRecordId } from '@/components/navigation/linkedRecord'
import EntityLink from '@/components/navigation/EntityLink.vue'
import { useLookupOptions } from '../adapters/lookups'
import FormSelect from '../components/FormSelect.vue'
import FormSwitch from '../components/FormSwitch.vue'
import { Input } from '@/components/ui/input'

import ModalDialog from '../components/ModalDialog.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import RecordsTable from '../components/RecordsTable.vue'
import { ref, computed, watch } from 'vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { api, type Row } from '../adapters/domain'
import { decimal, money, errorMessage } from '../application/format'
import { useDomainMutation } from '../application/useDomainMutation'
import { useFlow } from '../application/useFlow'
import Feedback from '../components/Feedback.vue'
const route = useRoute()
const categoriaSelecionada = ref<number | null>(null)
const editorOpen = ref(false)
const ui = useUiStore(),
  tab = ref<'contas' | 'categorias'>('contas'),
  rows = ref<Row[]>([]),
  name = ref(''),
  balance = ref('0'),
  color = ref('#12617b'),
  ignorarNosCalculos = ref(false),
  parent = ref<number | null>(null),
  editId = ref<number | null>(null),
  loading = ref(false),
  loadError = ref(''),
  validation = ref(''),
  review = ref(false)
const { load: loadCategories, rows: categories } = useLookupOptions('finance-categories', () => ({
  excludeId: editId.value || undefined,
}))
const { busy, error, message, uncertain, run } = useDomainMutation()
const canManage = computed(() => tab.value === 'categorias' || hasPermission(ui.usuarioLogged, 4))
useFlow(computed(() => !!name.value))
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    rows.value = await api.read(`/modofacil/financeiro/${tab.value}`)
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
  ignorarNosCalculos.value = false
  parent.value = null
  editId.value = null
  review.value = false
}
function edit(row: Row) {
  editorOpen.value = true
  reset()
  editId.value = row.id
  name.value = row.nome || ''
  parent.value = row.parentId ?? row.categoriaPai ?? null
  color.value = row.corDestaque || '#12617b'
  ignorarNosCalculos.value = Boolean(row.ignorarNosCalculos)
}
watch(() => [route?.query.tab, route?.query.categoria] as const, ([alvo, id]) => {
  tab.value = alvo === 'categorias' ? 'categorias' : 'contas'
  categoriaSelecionada.value = linkedRecordId(id)
  void load()
}, { immediate: true })
const visibleRows = computed(() => tab.value === 'categorias' && categoriaSelecionada.value
  ? rows.value.filter((row) => row.id === categoriaSelecionada.value)
  : rows.value)

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
                ignorarNosCalculos: ignorarNosCalculos.value,
              })
          : () =>
              api.post('/modofacil/financeiro/contas', {
                nome: name.value.trim(),
                saldoInicial: initialBalance,
                corDestaque: color.value,
                ignorarNosCalculos: ignorarNosCalculos.value,
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
            categoriaSelecionada = null
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
    <RecordsTable
      :rows="visibleRows"
      :loading="loading"
      :failed="!!loadError"
      :caption="tab === 'contas' ? 'Contas financeiras' : 'Categorias financeiras'"
      :columns="[
        { key: 'name', label: tab === 'contas' ? 'Conta financeira' : 'Categoria' },
        ...(tab === 'contas' ? [{ key: 'balance', label: 'Saldo atual', right: true }] : []),
        { key: 'actions', label: 'Ações', right: true },
      ]"
    >
      <template #name="{ row }">
        <strong><EntityLink v-if="tab === 'contas'" kind="conta" :record-id="row.id" :label="row.nome" /><template v-else>{{ row.nome }}</template></strong>
        <small v-if="row.ignorarNosCalculos" class="block text-muted-foreground">Fora dos cálculos gerais</small>
      </template>
      <template #balance="{ row }">{{ money(row.saldoAtual ?? row.saldoInicial) }}</template>
      <template #actions="{ row }"
        ><button v-if="canManage" :disabled="busy || uncertain" @click="edit(row)">
          Editar {{ row.nome }}
        </button></template
      >
    </RecordsTable>
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
            ><label
              >Nome<Input
                :placeholder="tab === 'contas' ? 'Ex.: Conta principal' : 'Ex.: Despesas fixas'"
                v-model="name"
                required
                maxlength="191" /></label
            ><template v-if="tab === 'contas'"
              ><label v-if="!editId"
                >Saldo inicial<Input
                  placeholder="0,00"
                  v-model="balance"
                  inputmode="decimal"
                  required /></label
              ><label>Cor de identificação<Input v-model="color" type="color" /></label>
              <label class="col-span-full">
                <FormSwitch v-model="ignorarNosCalculos" /> Ignorar nos cálculos gerais
                <small class="block text-muted-foreground">
                  A conta mantém o saldo próprio e continua disponível para receitas e despesas.
                </small>
              </label>
              <p v-if="editId">O saldo inicial não é alterado por esta edição.</p></template
            ><label v-else
              >Categoria superior<FormSelect
                v-model="parent"
                :load-options="loadCategories"
                :options="[{ value: null, label: 'Sem categoria superior' }]" /></label
          ></template>
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
            <p v-if="tab === 'contas'">
              {{ ignorarNosCalculos ? 'Conta fora dos cálculos gerais.' : 'Conta incluída nos cálculos gerais.' }}
            </p>
            <p v-else>O servidor valida a hierarquia da categoria.</p>
          </section>
          <div
            class="mf-form-actions mf-actions col-span-full flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
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
