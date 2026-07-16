<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Bot, X } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui/uiStore'
import ChatPage from '@/pages/agente/ChatPage.vue'

const storeUi = useUiStore()
const route = useRoute()
const open = ref(false)

// Aparece em todo o sistema, mas só com o app core-ia ativo e fora da própria página do Core IA.
const visivel = computed(() => storeUi.hasActiveModule('core-ia') && route.name !== 'ia')

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
        class="fixed left-2 right-2 top-16 bottom-24 z-[60] flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl md:left-auto md:right-6 md:top-auto md:bottom-24 md:h-[min(72vh,660px)] md:w-[400px]"
      >
        <ChatPage embedded />
      </div>
    </transition>

    <!-- Launcher (também fecha o painel) -->
    <button
      type="button"
      :title="open ? 'Fechar assistente' : 'Abrir assistente Core IA'"
      class="fixed bottom-6 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700 md:right-6"
      @click="toggle"
    >
      <X v-if="open" class="h-6 w-6" />
      <Bot v-else class="h-6 w-6" />
    </button>
  </template>
</template>
