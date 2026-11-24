<script setup lang="ts">
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, computed } from 'vue'
import { useUiStore } from '@/stores/ui/uiStore'
import { createOperationalSettingsApi } from '../adapters/operationalSettings'
import type { FieldDefinition } from '../application/fields'
import { useDomainMutation } from '../application/useDomainMutation'
import { errorMessage } from '../application/format'
import ExperienceSettings from '../components/ExperienceSettings.vue'
import FieldsEditor from '../components/FieldsEditor.vue'
import Feedback from '../components/Feedback.vue'
const ui = useUiStore(),
  tab = ref('experiencia'),
  record = ref<Record<string, unknown> | null>(null),
  loading = ref(false),
  loadError = ref('')
const { busy, error, message, uncertain, run } = useDomainMutation()
const settingsApi = createOperationalSettingsApi()
const bool = (key: string, label: string, group: string): FieldDefinition => ({
  key,
  label,
  type: 'boolean',
  nullable: false,
  group,
})
const fields = computed<FieldDefinition[]>(() => {
  const account = (key: string, label: string, group: string): FieldDefinition => ({
    key,
    label,
    group,
    type: 'select',
    numeric: true,
    lookup: 'finance-accounts',
  })
  const category = (key: string, label: string, group: string): FieldDefinition => ({
    key,
    label,
    group,
    type: 'select',
    numeric: true,
    lookup: 'finance-categories',
  })
  return [
    account('contaFinanceiraPadraoId', 'Conta financeira padrão', 'Dinheiro'),
    bool('permitirLancamentoRetroativo', 'Permite lançamentos retroativos', 'Dinheiro'),
    bool('permitirEfetivacaoFutura', 'Permite pagamento com data futura', 'Dinheiro'),
    bool('permitirTransferenciaContaFinanceira', 'Permite transferências', 'Dinheiro'),
    bool('permitirCriacaoCobranca', 'Permite criar cobranças', 'Dinheiro'),
    bool('vendaLancamentoAutomatico', 'Financeiro automático de vendas', 'Vendas'),
    account('vendaContaFinanceiraId', 'Conta de receitas de vendas', 'Vendas'),
    category('vendaCategoriaFinanceiraId', 'Categoria de receitas de vendas', 'Vendas'),
    {
      key: 'modeloPdv',
      label: 'Modelo do PDV completo',
      group: 'Vendas',
      type: 'select',
      nullable: false,
      options: [
        ['BASICO', 'Básico'],
        ['PRO', 'Pro'],
      ],
    },
    bool('osLancamentoAutomatico', 'Financeiro automático de OS', 'Ordens de serviço'),
    account('osContaFinanceiraId', 'Conta de receitas de OS', 'Ordens de serviço'),
    category('osCategoriaFinanceiraId', 'Categoria de receitas de OS', 'Ordens de serviço'),
    bool('osOcultarAssinatura', 'Ocultar campo de assinatura na OS completa', 'Ordens de serviço'),
    bool('eventoVendaConcluida', 'Avisar venda concluída', 'Notificações'),
    bool('eventoProdutoAlterado', 'Avisar alteração de produto', 'Notificações'),
    bool('eventoEstoqueBaixo', 'Avisar estoque baixo', 'Notificações'),
    bool('eventoSangria', 'Avisar retirada do caixa', 'Notificações'),
  ]
})
async function load() {
  tab.value = 'operacao'
  if (loading.value) return
  loading.value = true
  loadError.value = ''
  try {
    record.value = await settingsApi.get()
  } catch (e) {
    record.value = null
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
async function save(body: Record<string, unknown>) {
  const result = await run(
    () => settingsApi.save(body),
    'Configurações operacionais atualizadas. Outros parâmetros e credenciais preservados.',
  )
  if (result) {
    record.value = result.value
    Object.assign(ui.financeiroFlags, result.value)
  }
}
</script>
<template>
  <PageFrame>
    <PageHeader
      ><template #title>Configurações da conta</template
      ><template #description
        >Preferências por assunto, com alteração apenas dos campos revisados.</template
      ></PageHeader
    >

    <nav
      class="mf-actions my-4 flex flex-wrap items-end gap-3"
      aria-label="Assuntos de configuração"
    >
      <button
        type="button"
        :aria-pressed="tab === 'experiencia'"
        :class="tab === 'experiencia' ? '!border-blue-600 !bg-blue-600 !text-white' : ''"
        @click="tab = 'experiencia'"
      >
        Experiência</button
      ><button
        type="button"
        :aria-pressed="tab === 'operacao'"
        :class="tab === 'operacao' ? '!border-blue-600 !bg-blue-600 !text-white' : ''"
        @click="load"
      >
        Vendas, dinheiro, OS e avisos</button
      ><button
        type="button"
        :aria-pressed="tab === 'empresa'"
        :class="tab === 'empresa' ? '!border-blue-600 !bg-blue-600 !text-white' : ''"
        @click="tab = 'empresa'"
      >
        Empresa</button
      >
      <RouterLink to="/configuracoes?tab=aparencia">Aparência</RouterLink>
      <RouterLink to="/configuracoes?tab=notificacoes">Notificações</RouterLink>
      <RouterLink to="/administracao/usuarios">Equipe na interface completa</RouterLink>
    </nav>
    <ExperienceSettings v-if="tab === 'experiencia'" />
    <section
      v-else-if="tab === 'empresa'"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5"
    >
      <h2>Dados da empresa</h2>
      <dl>
        <dt>Nome</dt>
        <dd>{{ ui.contaInfo.nome }}</dd>
        <dt>Nome fantasia</dt>
        <dd>{{ ui.contaInfo.nomeFantasia || 'Não informado' }}</dd>
        <dt>Documento</dt>
        <dd>{{ ui.contaInfo.documento || 'Não informado' }}</dd>
        <dt>E-mail</dt>
        <dd>{{ ui.contaInfo.email }}</dd>
        <dt>Telefone</dt>
        <dd>{{ ui.contaInfo.telefone || 'Não informado' }}</dd>
      </dl>
      <p>
        Atualização cadastral da empresa permanece na configuração completa; não há fronteira de
        edição restrita publicada para esses dados.
      </p>
      <RouterLink to="/configuracoes" class="mf-button"
        >Abrir configuração completa da empresa</RouterLink
      >
    </section>
    <template v-else
      ><Feedback
        :loading="loading"
        :error="loadError || error"
        :message="message"
        @retry="load" /><FieldsEditor
        v-if="record && !loading"
        :initial="record"
        :fields="fields"
        :busy="busy"
        :uncertain="uncertain"
        scope="As preferências valem para toda a conta. O estilo de navegação e as credenciais de gateways permanecem independentes."
        @save="save"
    /></template>
  </PageFrame>
</template>
