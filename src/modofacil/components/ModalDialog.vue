<script setup lang="ts">
import { nextTick, provide, ref, watch } from 'vue'
import { AlertCircle, X } from 'lucide-vue-next'
import ModalView from '@/components/formulario/ModalView.vue'
import { darkPaletteClasses, surfaceClasses } from '../application/ui'
import { formThemeClassesKey } from '@/components/formulario/form-theme'
import { useFeedbackToasts } from '../application/notifications'
provide(formThemeClassesKey, darkPaletteClasses)
const props = defineProps<{
  title: string
  description?: string
  busy?: boolean
  error?: string
  uncertain?: boolean
  danger?: boolean
  size?: 'sm' | 'md' | 'lg'
  inactive?: boolean
}>()
const emit = defineEmits<{ close: [] }>()
useFeedbackToasts(() => props.error)
const alert = ref<HTMLElement | null>(null)
watch(
  () => props.error,
  async (error) => {
    if (error) {
      await nextTick()
      alert.value?.focus()
    }
  },
)
function close(open: boolean) {
  if (!open && !props.busy) emit('close')
}
</script>
<template>
  <ModalView
    mobile-variant="dialog"
    ignore-toast-interactions
    :open="true"
    :title="title"
    :description="description"
    :size="size === 'sm' ? 'sm' : size === 'lg' ? '3xl' : 'xl'"
    :content-class="`${surfaceClasses} modo-facil-dialog [&>button]:hidden !bg-card text-foreground max-h-[92dvh] !gap-0 overflow-hidden max-md:!mt-0 max-md:!left-0 max-md:!top-auto max-md:!bottom-0 max-md:!translate-x-0 max-md:!translate-y-0 max-md:!w-full max-md:!max-w-none md:w-[calc(100%-2rem)] rounded-t-xl md:rounded-lg ${busy ? '[&>button]:pointer-events-none [&>button]:opacity-40' : ''}`"
    header-class="[&>div]:!pr-0 border-b border-border px-4 py-5 sm:px-5 [&_h2]:!text-lg [&_h2]:!font-semibold [&_p]:mt-2 [&_p]:!mb-0"
    body-class="min-h-0 min-w-0 space-y-4 overflow-y-auto overscroll-contain p-4 sm:p-5 [&_.mf-form-actions]:sticky [&_.mf-form-actions]:bottom-0 [&_.mf-form-actions]:z-10 [&_.mf-form-actions]:bg-card [&_.mf-form-actions]:py-2"
    @update:open="close"
  >
    <template #header-actions>
      <button
        type="button"
        class="!h-9 !min-h-9 !w-9 shrink-0 !border-0 !p-0"
        :disabled="busy || inactive"
        aria-label="Fechar diálogo"
        @click="close(false)"
      >
        <X :size="18" />
      </button>
    </template>
    <div
      v-if="danger"
      class="flex items-start gap-3 rounded-md border border-orange-500/20 bg-orange-500/10 p-3 text-xs text-orange-800 dark:text-orange-300"
    >
      <AlertCircle :size="19" class="shrink-0" aria-hidden="true" /><span
        >Confira os dados e os efeitos desta ação antes de confirmar.</span
      >
    </div>
    <p
      v-if="error"
      ref="alert"
      tabindex="-1"
      class="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
      role="alert"
    >
      {{ error }}
    </p>
    <p
      v-if="uncertain"
      class="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300"
      role="status"
    >
      O resultado da operação ainda não foi confirmado. Feche este diálogo e consulte o registro
      antes de repetir.
    </p>
    <div :inert="inactive" :aria-hidden="inactive ? true : undefined"><slot /></div>
    <template v-if="$slots.footer" #footer>
      <div
        class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end [&>button]:w-full sm:[&>button]:w-auto"
      >
        <slot name="footer" />
      </div>
    </template>
  </ModalView>
</template>
