<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import { RouterView, onBeforeRouteLeave, onBeforeRouteUpdate, useRouter } from 'vue-router'
import { modalWorkspaceKey } from '../application/modalWorkspace'
import { forms } from '../application/formDialogs'
import { dataRevision } from '../application/dataChanges'
import ModalDialog from './ModalDialog.vue'
import ModalFormView from './ModalFormView.vue'
import Feedback from './Feedback.vue'
const workspace = inject(modalWorkspaceKey)!
const router = useRouter()
const entries = workspace.entries
const opened = computed(() => entries.value.length > 0)
const pageVersion = ref(0)
const paginatedLists = new Set([
  'produtos',
  'pessoas',
  'vendas',
  'ordens',
  'servicos',
  'financeiro',
  'movimentacoes',
  'categorias',
])
let beforeForm = dataRevision()
watch(
  opened,
  (open) => {
    if (open) beforeForm = dataRevision()
    else if (
      beforeForm !== dataRevision() &&
      !paginatedLists.has(String(router.currentRoute.value.name).replace(/^modofacil-/, ''))
    )
      pageVersion.value++
  },
  { flush: 'sync' },
)
onBeforeRouteLeave(() => workspace.canLeave(true))
onBeforeRouteUpdate(() => workspace.canLeave(true))
// Route navigation is only for real pages. Clear dialogs after navigation succeeds.
watch(
  () => router.currentRoute.value.fullPath,
  () => workspace.reset(),
  { flush: 'sync' },
)
</script>
<template>
  <Feedback :error="workspace.error.value" />
  <div :inert="opened" :aria-hidden="opened ? true : undefined">
    <RouterView v-slot="{ Component, route }">
      <component :is="Component" :key="`${route.path}-${pageVersion}`" />
    </RouterView>
  </div>
  <ModalDialog
    v-for="(entry, index) in entries"
    :key="entry.id"
    :title="forms[entry.target.form].title"
    size="lg"
    :busy="workspace.busy.value"
    :inactive="index !== entries.length - 1"
    @close="workspace.close()"
  >
    <ModalFormView :entry="entry" />
  </ModalDialog>
</template>
