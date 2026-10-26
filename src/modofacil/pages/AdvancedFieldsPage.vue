<script setup lang="ts">
import FormBack from '../components/FormBack.vue'
import SuccessPanel from '../components/SuccessPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed, onMounted } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { api, products, type Row } from '../adapters/domain'
import { fiscalFields, variantFields, personFields, serviceFields } from '../application/fields'
import { useDomainMutation } from '../application/useDomainMutation'
import { errorMessage } from '../application/format'
import FieldsEditor from '../components/FieldsEditor.vue'
import Feedback from '../components/Feedback.vue'
const route = useFormContext(),
  entity = String(route.meta.entity),
  record = ref<Row | null>(null),
  loading = ref(false),
  loadError = ref(''),
  done = ref(false)
const { busy, error, message, uncertain, run } = useDomainMutation()
const base = Number(route.params.produtoBaseId),
  variant = Number(route.params.varianteId),
  id = Number(route.params.id)
const fields = computed(() =>
  entity === 'base'
    ? fiscalFields
    : entity === 'variante'
      ? variantFields
      : entity === 'pessoa'
        ? personFields
        : serviceFields,
)
const path = computed(() =>
  entity === 'base'
    ? `/modofacil/produtos/${base}/avancado`
    : entity === 'variante'
      ? `/modofacil/produtos/${base}/variantes/${variant}/avancado`
      : entity === 'pessoa'
        ? `/modofacil/pessoas/${id}/avancado`
        : `/modofacil/servicos/${id}/avancado`,
)
const back = computed(() =>
  ['base', 'variante'].includes(entity)
    ? `/modofacil/produtos/${base}`
    : entity === 'pessoa'
      ? `/modofacil/pessoas/${id}`
      : '/modofacil/servicos',
)
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    record.value =
      entity === 'base'
        ? await products.get(base)
        : await api.read(
            entity === 'variante'
              ? `/modofacil/produtos/variantes/${variant}`
              : entity === 'pessoa'
                ? `/modofacil/pessoas/${id}`
                : `/modofacil/servicos/${id}`,
          )
    if (entity === 'variante' && Number(record.value?.produtoBaseId) !== base)
      throw new Error('A variante não pertence a este produto.')
  } catch (e) {
    loadError.value = errorMessage(e)
    record.value = null
  } finally {
    loading.value = false
  }
}
onMounted(load)
async function save(body: Record<string, unknown>) {
  const result = await run(
    () => api.patch(path.value, body),
    'Alterações salvas. Campos não alterados foram preservados.',
  )
  if (result) done.value = true
}
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>
        {{
          entity === 'pessoa'
            ? 'Documento, endereço e cadastro'
            : entity === 'base'
              ? 'Informações fiscais do produto'
              : entity === 'variante'
                ? 'Informações adicionais da variante'
                : 'Informações adicionais do serviço'
        }} </template
      ><template #back><FormBack :to="back">← Voltar ao cadastro</FormBack></template></PageHeader
    >
    <Feedback
      :loading="loading"
      :error="loadError || error"
      :message="message"
      @retry="load"
    /><FieldsEditor
      v-if="record && !loading && !done"
      :fields="fields"
      :initial="record"
      :busy="busy"
      :uncertain="uncertain"
      :scope="
        entity === 'base'
          ? 'Estas informações pertencem ao produto base; os campos da variante são editados separadamente.'
          : entity === 'variante'
            ? 'As alterações pertencem somente à variante selecionada. O saldo de estoque não é alterado por este formulário.'
            : 'Os dados básicos e os campos não alterados permanecem como estão.'
      "
      @save="save"
    />
    <SuccessPanel v-if="done" title="Cadastro atualizado" :to="back" label="Voltar ao cadastro" />
  </PageFrame>
</template>
