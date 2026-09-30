<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Eye, FileText, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/hooks/authorize'
import { useUiStore } from '@/stores/ui/uiStore'
import type { Vendas } from '@/types/schemas'
import {
  NotasFiscaisRepository,
  type FiscalDocument,
} from '@/repositories/notas-fiscais-repository'
import FiscalDocumentActions from '@/pages/notas-fiscais/FiscalDocumentActions.vue'
import FiscalStatusBadge from '@/pages/notas-fiscais/FiscalStatusBadge.vue'
import { typeLabels } from '@/pages/notas-fiscais/fiscalPresentation'

const props = defineProps<{ notes: NonNullable<Vendas['NotaFiscals']> }>()
const emit = defineEmits<{ openDetail: [id: number]; changed: [] }>()
const ui = useUiStore()
const fiscalAtivo = computed(() => ui.hasActiveModule('notas-fiscais'))
const canRead = computed(() => fiscalAtivo.value && hasPermission(ui.usuarioLogged, 3))
const documents = ref<Record<number, FiscalDocument>>({})
const errors = ref<Record<number, string>>({})
const loading = ref(false)
let requestVersion = 0

async function load() {
  const version = ++requestVersion
  if (!canRead.value || !props.notes.length) {
    documents.value = {}
    errors.value = {}
    loading.value = false
    return
  }
  loading.value = true
  const ids = props.notes.map((note) => note.id)
  const results = await Promise.allSettled(ids.map((id) => NotasFiscaisRepository.getDocument(id)))
  if (version !== requestVersion) return
  const nextDocuments: Record<number, FiscalDocument> = {}
  const nextErrors: Record<number, string> = {}
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') nextDocuments[ids[index]] = result.value
    else
      nextErrors[ids[index]] =
        result.reason?.response?.data?.error?.message ||
        'Não foi possível atualizar o acompanhamento desta nota.'
  })
  documents.value = nextDocuments
  errors.value = nextErrors
  loading.value = false
}

async function refresh() {
  await load()
  emit('changed')
}
watch(
  () => [props.notes, canRead.value],
  () => {
    documents.value = {}
    void load()
  },
  { immediate: true, deep: true },
)
</script>

<template>
  <section
    v-if="fiscalAtivo"
    class="space-y-3 rounded-xl border bg-card p-4"
    aria-label="Notas fiscais da venda"
  >
    <div class="flex flex-wrap items-center justify-between gap-2">
      <h3 class="flex items-center gap-2 font-semibold">
        <FileText class="size-4 text-primary" />Nota fiscal
      </h3>
      <Button
        v-if="canRead && notes.length"
        size="sm"
        variant="outline"
        :disabled="loading"
        @click="refresh"
        ><RefreshCw :class="{ 'animate-spin': loading }" />Atualizar status</Button
      >
    </div>
    <p v-if="!notes.length" class="text-sm text-muted-foreground">
      Esta venda ainda não possui nota fiscal.
    </p>
    <div v-for="note in notes" :key="note.id" class="space-y-2 rounded-lg border p-3 text-sm">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-2">
          <strong
            >{{ typeLabels[note.tipo] }} #{{
              documents[note.id]?.numero || note.numero || note.id
            }}</strong
          >
          <FiscalStatusBadge
            :status="documents[note.id]?.status || note.status"
            :error="documents[note.id] ? documents[note.id].erroMensagem : note.erroMensagem"
          />
        </div>
        <Button v-if="canRead" size="sm" variant="outline" @click="emit('openDetail', note.id)"
          ><Eye />Acompanhar</Button
        >
      </div>
      <p v-if="errors[note.id]" class="text-xs text-destructive" role="alert">
        {{ errors[note.id] }}
      </p>
      <p v-if="loading" class="text-xs text-muted-foreground" role="status">
        Carregando acompanhamento...
      </p>
      <FiscalDocumentActions
        v-else-if="documents[note.id]"
        :document="documents[note.id]"
        @changed="refresh"
        @deleted="emit('changed')"
      />
    </div>
  </section>
</template>
