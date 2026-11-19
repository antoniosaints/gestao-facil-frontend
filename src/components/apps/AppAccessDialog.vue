<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { appAccessPrompt } from '@/composables/useAppAccessPrompt'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import AppRequirementNotice from './AppRequirementNotice.vue'

const route = useRoute()
function close() { appAccessPrompt.value = null }
watch(() => route.fullPath, close)
</script>

<template>
  <Dialog :open="Boolean(appAccessPrompt) && !route.meta.isPublic" @update:open="open => { if (!open) close() }">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader><DialogTitle>Prepare o app para continuar</DialogTitle><DialogDescription>Conclua a etapa indicada e tente novamente a operação.</DialogDescription></DialogHeader>
      <AppRequirementNotice v-if="appAccessPrompt" :app="appAccessPrompt.app" :configured="false" :inactive="appAccessPrompt.kind === 'activation'" :configuration-to="appAccessPrompt.configurationTo" :return-to="route.fullPath" @navigate="close" />
      <DialogFooter><Button variant="outline" @click="close">Voltar</Button></DialogFooter>
    </DialogContent>
  </Dialog>
</template>
