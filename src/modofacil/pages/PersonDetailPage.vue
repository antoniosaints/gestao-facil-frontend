<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'
import DeleteRecord from '../components/DeleteRecord.vue'
import PersonStatusAction from '../components/PersonStatusAction.vue'
import StatusBadge from '../components/StatusBadge.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import DetailMetrics from '../components/DetailMetrics.vue'
import { onMounted, ref, computed, provide } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { api, type Row } from '../adapters/domain'
import { money, errorMessage } from '../application/format'
import { deletionScopeKey } from '../application/deletionScope'
import { Pencil, Phone, Mail, MapPin, MessageCircle, FileText } from 'lucide-vue-next'
import Feedback from '../components/Feedback.vue'
import PersonHistory from '../components/PersonHistory.vue'
provide(deletionScopeKey, new Map())
const ui = useUiStore(),
  route = useRoute()
const person = ref<Row | null>(null),
  error = ref(''),
  loading = ref(false)
const stats = ref<Row | null>(null),
  statsError = ref(''),
  statsLoading = ref(false)
const canFinance = computed(() => hasPermission(ui.usuarioLogged, 3))
const financialMetrics = computed(() => [
  {
    label: 'Recebido',
    value: money(stats.value?.financeiro?.recebido),
    hint: 'Receitas pagas',
    tone: 'text-emerald-600 dark:text-emerald-300',
  },
  { label: 'Pago', value: money(stats.value?.financeiro?.pago), hint: 'Despesas pagas' },
  {
    label: 'A receber',
    value: money(stats.value?.financeiro?.pendenteReceber),
    hint: 'Parcelas em aberto',
    tone: 'text-orange-600 dark:text-orange-300',
  },
  {
    label: 'A pagar',
    value: money(stats.value?.financeiro?.pendentePagar),
    hint: 'Parcelas em aberto',
  },
])
const address = computed(() =>
  [person.value?.endereco, person.value?.numero].filter(Boolean).join(', '),
)
const city = computed(() =>
  [person.value?.cidade, person.value?.estado].filter(Boolean).join(' / '),
)
const whatsapp = computed(() => String(person.value?.whastapp || '').replace(/\D/g, ''))
function dateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Não informado'
    : date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}
async function loadStats() {
  if (!canFinance.value || !person.value) return
  statsLoading.value = true
  statsError.value = ''
  try {
    const result = await api.read(`/modofacil/pessoas/${person.value.id}/estatisticas`)
    if (!result?.financeiro) throw new Error('Não foi possível consultar o resumo financeiro.')
    stats.value = result
  } catch (e) {
    stats.value = null
    statsError.value = errorMessage(e)
  } finally {
    statsLoading.value = false
  }
}
async function load() {
  loading.value = true
  error.value = ''
  try {
    const result = await api.read(`/modofacil/pessoas/${Number(route.params.id)}`)
    if (!result?.id) throw new Error('Pessoa não encontrada.')
    person.value = result
    void loadStats()
  } catch (e) {
    person.value = null
    stats.value = null
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<template>
  <PageFrame>
    <Feedback :error="error" :loading="loading" @retry="load" />
    <template v-if="person">
      <PageHeader
        :title="person.nome"
        :description="`${person.Uid || `Pessoa #${person.id}`} · ${person.tipo === 'FORNECEDOR' ? 'Fornecedor' : 'Cliente'}`"
        back="/modofacil/pessoas"
        back-label="Pessoas"
      >
        <template #actions>
          <ModalAction form="pessoa-editar" :params="{ id: person.id }" :disabled="loading"
            ><Pencil :size="15" />Editar pessoa</ModalAction
          >
          <PersonStatusAction :record="person" :disabled="loading" @changed="load" />
          <DeleteRecord
            kind="person"
            :record="person"
            :disabled="loading"
            redirect="/modofacil/pessoas"
          />
        </template>
      </PageHeader>
      <div class="flex flex-wrap items-center gap-3">
        <StatusBadge :value="person.status" /><span class="text-xs text-muted-foreground"
          >Cadastro #{{ person.id }}</span
        ><span v-if="person.createdAt" class="text-xs text-muted-foreground"
          >Criado em {{ dateTime(person.createdAt) }}</span
        >
      </div>
      <div class="grid min-w-0 gap-4 lg:grid-cols-2">
        <section
          class="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5"
          aria-labelledby="person-contact-title"
        >
          <h2 id="person-contact-title" class="flex items-center gap-2">
            <Phone :size="17" class="text-primary" />Contato
          </h2>
          <dl class="mf-info-grid lg:!grid-cols-2">
            <div>
              <dt>Telefone</dt>
              <dd>
                <a
                  v-if="person.telefone"
                  :href="`tel:${String(person.telefone).replace(/[^\d+]/g, '')}`"
                  >{{ person.telefone }}</a
                ><span v-else>Não informado</span>
              </dd>
            </div>
            <div>
              <dt>WhatsApp</dt>
              <dd>
                <a
                  v-if="whatsapp"
                  :href="`https://wa.me/${whatsapp.length <= 11 ? '55' : ''}${whatsapp}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="inline-flex items-center gap-1"
                  ><MessageCircle :size="14" />{{ person.whastapp }}</a
                ><span v-else>Não informado</span>
              </dd>
            </div>
            <div class="col-span-full">
              <dt>E-mail</dt>
              <dd>
                <a
                  v-if="person.email"
                  :href="`mailto:${person.email}`"
                  class="inline-flex items-center gap-1 break-all"
                  ><Mail :size="14" class="shrink-0" />{{ person.email }}</a
                ><span v-else>Não informado</span>
              </dd>
            </div>
          </dl>
        </section>
        <section
          class="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5"
          aria-labelledby="person-address-title"
        >
          <h2 id="person-address-title" class="flex items-center gap-2">
            <MapPin :size="17" class="text-primary" />Endereço
          </h2>
          <dl class="mf-info-grid lg:!grid-cols-2">
            <div class="col-span-full">
              <dt>Logradouro e número</dt>
              <dd>{{ address || 'Não informado' }}</dd>
            </div>
            <div>
              <dt>Bairro</dt>
              <dd>{{ person.bairro || 'Não informado' }}</dd>
            </div>
            <div>
              <dt>Cidade / UF</dt>
              <dd>{{ city || 'Não informado' }}</dd>
            </div>
            <div>
              <dt>CEP</dt>
              <dd>{{ person.cep || 'Não informado' }}</dd>
            </div>
          </dl>
        </section>
      </div>
      <section
        class="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="person-documents-title"
      >
        <h2 id="person-documents-title" class="flex items-center gap-2">
          <FileText :size="17" class="text-primary" />Documentos e informações adicionais
        </h2>
        <dl class="mf-info-grid">
          <div>
            <dt>CPF / CNPJ</dt>
            <dd>{{ person.documento || 'Não informado' }}</dd>
          </div>
          <div>
            <dt>Inscrição estadual</dt>
            <dd>{{ person.ie || 'Não informado' }}</dd>
          </div>
          <div>
            <dt>Inscrição municipal</dt>
            <dd>{{ person.im || 'Não informado' }}</dd>
          </div>
          <div>
            <dt>Código do município</dt>
            <dd>{{ person.municipio || 'Não informado' }}</dd>
          </div>
          <div v-if="person.updatedAt">
            <dt>Última atualização</dt>
            <dd>{{ dateTime(person.updatedAt) }}</dd>
          </div>
        </dl>
        <div class="mt-4 border-t border-border pt-4">
          <h3 class="mb-2 text-xs font-medium text-muted-foreground">Observações</h3>
          <p class="!mb-0 whitespace-pre-wrap break-words">
            {{ person.observacaos || 'Nenhuma observação registrada.' }}
          </p>
        </div>
      </section>
      <section v-if="canFinance" class="space-y-3" aria-labelledby="person-finance-title">
        <div>
          <h2 id="person-finance-title" class="!mb-1">Resumo financeiro</h2>
          <small>Todos os registros financeiros vinculados a esta pessoa.</small>
        </div>
        <Feedback :loading="statsLoading" :error="statsError" @retry="loadStats" />
        <DetailMetrics
          v-if="stats && !statsLoading"
          label="Resumo financeiro da pessoa"
          :metrics="financialMetrics"
        />
      </section>
      <PersonHistory
        v-if="canFinance"
        :person-id="person.id"
        :initial-tab="person.tipo === 'FORNECEDOR' ? 'lancamentos' : 'vendas'"
      />
    </template>
  </PageFrame>
</template>
