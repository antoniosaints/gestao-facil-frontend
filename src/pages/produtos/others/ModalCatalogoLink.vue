<script setup lang="ts">
import { computed } from 'vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/ui/uiStore'
import { HashGenerator } from '@/utils/generators'
import { Copy, ExternalLink, Store } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

const open = defineModel<boolean>('open', { default: false })
const uiStore = useUiStore()
const toast = useToast()

const link = computed(() => {
  const id = uiStore.contaInfo.id
  if (!id) return ''
  return `${window.location.origin}/catalogo/${HashGenerator.encode(id)}`
})

function copiar() {
  if (!link.value) return
  navigator.clipboard.writeText(link.value)
  toast.success('Link do catálogo copiado!')
}

function abrir() {
  if (link.value) window.open(link.value, '_blank')
}
</script>

<template>
  <ModalView
    v-model:open="open"
    title="Catálogo online"
    description="Compartilhe o link da sua loja virtual. Todos os produtos ativos aparecem no catálogo."
    :icon="Store"
    size="lg"
  >
    <div class="flex flex-col gap-4 px-4 pb-2">
      <div class="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
        <span class="min-w-0 flex-1 truncate text-xs text-muted-foreground">{{ link }}</span>
        <button
          type="button"
          class="flex shrink-0 items-center gap-1 rounded-md bg-blue-100 px-3 py-2 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-100"
          @click="copiar"
        >
          <Copy class="h-3.5 w-3.5" /> Copiar
        </button>
      </div>

      <div class="flex justify-end gap-2">
        <Button variant="outline" @click="open = false">Fechar</Button>
        <Button class="text-white" @click="abrir">
          <ExternalLink class="mr-1 h-4 w-4" /> Abrir catálogo
        </Button>
      </div>
    </div>
  </ModalView>
</template>
