<script setup lang="ts">
import { computed, nextTick, ref, watch, type ComponentPublicInstance } from 'vue'
import { Button } from '@/components/ui/button'
import { useRoute } from 'vue-router'
import { Bot, X } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui/uiStore'
import { useCoreIaWidget } from '@/composables/useCoreIaWidget'
import ChatPage from '@/pages/agente/ChatPage.vue'

const ui = useUiStore()
const route = useRoute()
const open = ref(false)
const launcher = ref<ComponentPublicInstance | null>(null)
function focusLauncher() {
  ;(launcher.value?.$el as HTMLButtonElement | undefined)?.focus()
}
const panel = ref<HTMLElement | null>(null)
const { habilitado } = useCoreIaWidget()
const visible = computed(
  () => ui.hasActiveModule('core-ia') && habilitado.value && route.name !== 'ia',
)
async function toggle() {
  open.value = !open.value
  await nextTick()
  if (open.value)
    (
      panel.value?.querySelector<HTMLElement>('textarea:not(:disabled)') ||
      panel.value?.querySelector<HTMLElement>(
        '[data-action-id] button:not(:disabled), a[href], button:not(:disabled)',
      )
    )?.focus()
  else focusLauncher()
}
function close() {
  open.value = false
  focusLauncher()
}
watch(visible, (value) => {
  if (!value) open.value = false
})
function trapFocus(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key !== 'Tab' || !panel.value) return
  const controls = Array.from(
    panel.value.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], textarea:not(:disabled), input:not([type="hidden"]), summary, audio[controls]',
    ),
  ).filter((element) => element.getClientRects().length)
  const first = controls[0]
  const last = controls[controls.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first?.focus()
  }
}
</script>

<template>
  <template v-if="visible">
    <div
      v-show="open"
      id="core-ia-panel"
      ref="panel"
      role="dialog"
      aria-label="Conversa com Core IA"
      class="fixed inset-x-2 bottom-[max(5.5rem,env(safe-area-inset-bottom))] top-16 z-[80] flex min-h-0 flex-col overflow-hidden rounded-lg border bg-card shadow-lg md:inset-x-auto md:bottom-24 md:right-6 md:top-auto md:h-[min(78dvh,760px)] md:w-[440px] xl:w-[520px]"
      @keydown="trapFocus"
    >
      <ChatPage embedded :active="open" @close="close" />
    </div>
    <Button
      ref="launcher"
      type="button"
      :aria-label="open ? 'Fechar assistente' : 'Abrir assistente Core IA'"
      :aria-expanded="open"
      aria-controls="core-ia-panel"
      aria-haspopup="dialog"
      size="icon"
      class="fixed bottom-6 right-4 z-[90] h-14 w-14 rounded-full text-white shadow-lg md:right-6 [&_svg]:size-6"
      @click="toggle"
    >
      <X v-if="open" class="h-6 w-6" /><Bot v-else class="h-6 w-6" />
    </Button>
  </template>
</template>
