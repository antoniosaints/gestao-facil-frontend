<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'

import StatusBadge from '../components/StatusBadge.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'

import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { api, type Row } from '../adapters/domain'
import { errorMessage } from '../application/format'

import Feedback from '../components/Feedback.vue'
import PersonHistory from '../components/PersonHistory.vue'

const ui = useUiStore()
const route = useRoute(),
  person = ref<Row | null>(null),
  error = ref(''),
  loading = ref(false)
async function load() {
  loading.value = true
  error.value = ''
  try {
    person.value = await api.read(`/modofacil/pessoas/${Number(route.params.id)}`)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<template>
  <PageFrame>
    <RouterLink to="/modofacil/pessoas">← Pessoas</RouterLink
    ><Feedback :error="error" :loading="loading" @retry="error = ''" />
    <section
      v-if="person"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
    >
      <div class="space-y-3 border-b border-border pb-4">
        <PageHeader
          ><template #title>{{ person.nome }}</template></PageHeader
        >
        <div class="flex flex-wrap items-center gap-3">
          <StatusBadge :value="person.status" /><span class="text-xs text-muted-foreground">{{
            person.tipo === 'FORNECEDOR' ? 'Fornecedor' : 'Cliente'
          }}</span>
        </div>
      </div>

      <dl>
        <dt>Telefone</dt>
        <dd>{{ person.telefone || '—' }}</dd>
        <dt>E-mail</dt>
        <dd>{{ person.email || '—' }}</dd>
        <dt>WhatsApp</dt>
        <dd>{{ person.whastapp || '—' }}</dd>
        <dt>Documento</dt>
        <dd>{{ person.documento || '—' }}</dd>
        <dt>Endereço</dt>
        <dd>
          {{ person.endereco }} {{ person.numero }} {{ person.bairro }} {{ person.cidade }}
          {{ person.estado }} {{ person.cep }}
        </dd>
        <dt>Observações</dt>
        <dd>{{ person.observacaos || '—' }}</dd>
      </dl>
      <ModalAction form="pessoa-editar" :params="{ id: person.id }"
        >Editar nome e contato</ModalAction
      >
      <ModalAction form="pessoa-avancado" :params="{ id: person.id }"
        >Editar documento, endereço e situação</ModalAction
      >
    </section>
    <PersonHistory v-if="person && hasPermission(ui.usuarioLogged, 3)" :person-id="person.id" />
  </PageFrame>
</template>
