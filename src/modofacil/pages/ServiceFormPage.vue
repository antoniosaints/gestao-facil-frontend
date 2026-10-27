<script setup lang="ts">
import FormBack from '../components/FormBack.vue'
import FormSection from '../components/FormSection.vue'
import FormSwitch from '../components/FormSwitch.vue'
import { useFormDestination } from '../application/formReturn'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import SuccessPanel from '../components/SuccessPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { api, ServicoRepository, type Row } from '../adapters/domain'
import { decimal, errorMessage } from '../application/format'
import { useFlow } from '../application/useFlow'
import { useDomainMutation } from '../application/useDomainMutation'
import Feedback from '../components/Feedback.vue'
const id = Number(useFormContext().params.id) || undefined
const loading = ref(!!id),
  loadError = ref(''),
  record = ref<Row | null>(null)
const nome = ref(''),
  preco = ref(''),
  descricao = ref(''),
  status = ref(true),
  dirty = ref(false),
  validation = ref(''),
  done = ref(false)
const { busy, error, uncertain, run } = useDomainMutation()
useFlow(dirty, busy)
async function load() {
  if (!id) return
  loading.value = true
  loadError.value = ''
  try {
    const result = await api.read(`/modofacil/servicos/${id}`)
    if (!result?.id || typeof result.status !== 'boolean')
      throw new Error('Não foi possível carregar os dados do serviço.')
    record.value = result
    nome.value = result.nome || ''
    preco.value = Number(result.preco).toFixed(2).replace('.', ',')
    descricao.value = result.descricao || ''
    status.value = result.status
  } catch (e) {
    record.value = null
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
async function save() {
  if (
    busy.value ||
    uncertain.value ||
    loading.value ||
    loadError.value ||
    done.value ||
    (id && !record.value)
  )
    return
  validation.value = ''
  let body
  try {
    const value = decimal(preco.value)
    if (nome.value.trim().length < 2 || nome.value.trim().length > 191)
      throw new Error('Informe um nome entre 2 e 191 caracteres.')
    if (value <= 0) throw new Error('O cadastro atual de serviços exige preço maior que zero.')
    if (descricao.value.length > 191) throw new Error('Use até 191 caracteres na descrição.')
    body = {
      nome: nome.value.trim(),
      preco: value,
      descricao: descricao.value.trim() || null,
      status: status.value,
    }
  } catch (e) {
    validation.value = errorMessage(e)
    return
  }
  if (id) {
    const changed: Record<string, unknown> = {}
    if (body.nome !== record.value!.nome) changed.nome = body.nome
    if (body.preco !== Number(record.value!.preco)) changed.preco = body.preco
    if (body.descricao !== (record.value!.descricao || null)) changed.descricao = body.descricao
    if (body.status !== record.value!.status) changed.status = body.status
    if (
      Object.keys(changed).length &&
      !(await run(
        () => api.patch(`/modofacil/servicos/${id}/basico`, changed),
        'Serviço atualizado.',
      ))
    )
      return
  } else if (!(await run(() => ServicoRepository.saveOrUpdate(body), 'Serviço cadastrado.'))) return
  done.value = true
  dirty.value = false
}
function retry() {
  if (loadError.value) void load()
  else {
    validation.value = ''
    error.value = ''
  }
}
const formDestination = useFormDestination()
</script>
<template>
  <PageFrame compact>
    <PageHeader
      :title="id ? 'Editar serviço' : 'Cadastrar serviço'"
      description="Nome, valor e disponibilidade do serviço."
    />
    <Feedback :loading="loading" :error="loadError || validation || error" @retry="retry" />
    <form
      v-if="!done && !loading && !loadError"
      class="grid gap-4"
      @submit.prevent="save"
      @input="dirty = true"
    >
      <fieldset class="grid grid-cols-1 gap-4 sm:grid-cols-2" :disabled="busy || uncertain">
        <FormSection
          title="Dados do serviço"
          description="Defina como o serviço aparece no catálogo e nos atendimentos."
        >
          <label class="sm:col-span-2"
            >Nome <span class="text-destructive">*</span
            ><Input
              v-model="nome"
              placeholder="Ex.: Instalação de equipamento"
              required
              minlength="2"
              maxlength="191"
          /></label>
          <label
            >Preço <span class="text-destructive">*</span
            ><Input v-model="preco" placeholder="Ex.: 80,50" inputmode="decimal" required /><small
              >Valor em reais para este serviço.</small
            ></label
          >
          <label
            >Situação
            <div
              class="flex h-10 items-center gap-3 rounded-md border border-input bg-background/70 px-3"
            >
              <FormSwitch
                v-model="status"
                aria-label="Serviço ativo"
                :disabled="busy || uncertain"
              /><span class="text-sm">{{ status ? 'Ativo' : 'Inativo' }}</span>
            </div>
            <small>{{
              status
                ? 'Disponível para uso no sistema.'
                : 'As operações já registradas são preservadas.'
            }}</small></label
          >
        </FormSection>
        <FormSection title="Descrição" description="Explique o que está incluído no atendimento.">
          <label class="sm:col-span-2"
            ><span class="sr-only">Descrição</span
            ><Textarea
              v-model="descricao"
              placeholder="Descreva o serviço e o que está incluído"
              :rows="3"
              maxlength="191"
            /><small>{{ descricao.length }}/191 caracteres · Opcional</small></label
          >
        </FormSection>
      </fieldset>
      <div class="mf-form-actions mf-actions">
        <FormBack :to="formDestination('/modofacil/servicos')" :disabled="busy">Cancelar</FormBack>
        <button
          :disabled="busy || uncertain"
          class="mf-primary !border-primary !bg-primary !text-primary-foreground"
        >
          {{ busy ? 'Salvando…' : 'Salvar serviço' }}
        </button>
      </div>
    </form>
    <SuccessPanel
      v-if="done"
      title="Serviço salvo"
      description="Os dados foram salvos. Informações fiscais não alteradas foram preservadas."
      :to="formDestination('/modofacil/servicos')"
      label="Voltar aos serviços"
    />
  </PageFrame>
</template>
