<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Bot, X } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui/uiStore'
import { useCoreIaWidget } from '@/composables/useCoreIaWidget'
import ChatPage from '@/pages/agente/ChatPage.vue'

const storeUi = useUiStore()
const route = useRoute()
const open = ref(false)
const { habilitado } = useCoreIaWidget()

// Aparece em todo o sistema, mas só quando: o app core-ia está ativo, o usuário não desativou o
// botão flutuante e não estamos na própria página do Core IA.
const visivel = computed(
  () => storeUi.hasActiveModule('core-ia') && habilitado.value && route.name !== 'ia',
)

function toggle() {
  open.value = !open.value
}
</script>

<template>
  <template v-if="visivel">
    <!-- Painel do chat (reutiliza a ChatPage no modo embutido) -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-3 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-3 opacity-0"
    >
      <div
        v-show="open"
        class="fixed left-0 right-0 top-16 bottom-20 z-[60] flex flex-col overflow-hidden md:rounded-xl border border-border bg-card shadow-2xl md:left-auto md:right-6 md:top-auto md:bottom-24 md:h-[min(72vh,660px)] md:w-[400px]"
      >
        <ChatPage embedded />
      </div>
    </transition>

    <!-- Launcher (também fecha o painel) -->
    <button
      type="button"
      :title="open ? 'Fechar assistente' : 'Abrir assistente Core IA'"
      class="fixed right-0 bottom-40 z-[90] flex h-14 w-10 items-center justify-center rounded-l-full bg-blue-600 pl-3 pr-0 text-white shadow-lg transition-transform hover:scale-[1.03] hover:bg-blue-700 active:scale-[0.96] md:right-6 md:bottom-6 md:w-14 md:rounded-full md:px-0"
      @click="toggle"
    >
      <X v-if="open" class="h-6 w-6" />
      <Bot v-else class="h-6 w-6" />
    </button>
  </template>
</template>
