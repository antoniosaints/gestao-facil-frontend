<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { Bike, ConciergeBell, Route } from 'lucide-vue-next'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/ui/uiStore'

const PROMPT_KEY_PREFIX = 'gestao_facil:restaurante:modo-escolhido:'

const router = useRouter()
const uiStore = useUiStore()
const open = ref(false)

const podeAlternarModo = computed(() => {
  const papeis = uiStore.restaurantAccess.papeis
  return (
    uiStore.hasActiveModule('restaurante-delivery') &&
    papeis.includes('ENTREGADOR') &&
    papeis.includes('GARCOM')
  )
})

const promptKey = computed(
  () =>
    `${PROMPT_KEY_PREFIX}${uiStore.usuarioLogged.id || uiStore.usuarioLogged.email || 'usuario'}`,
)

function abrirEscolhaInicial() {
  if (!podeAlternarModo.value) return
  try {
    if (sessionStorage.getItem(promptKey.value)) return
    sessionStorage.setItem(promptKey.value, '1')
  } catch {
    // Se o navegador impedir armazenamento, a escolha ainda pode ser exibida nesta sessão.
  }
  open.value = true
}

function acessarDelivery() {
  open.value = false
  router.push({ name: 'restaurante-entregador' })
}

function acessarGestao() {
  open.value = false
  router.push({ name: 'restaurante-salao' })
}

watch(podeAlternarModo, abrirEscolhaInicial, { immediate: true })
</script>

<template>
  <div v-if="podeAlternarModo" class="flex justify-end">
    <Button type="button" variant="outline" size="sm" @click="acessarDelivery">
      <Bike class="mr-1.5 h-4 w-4" />Modo delivery
    </Button>
  </div>

  <ModalView
    v-model:open="open"
    title="Como deseja trabalhar agora?"
    description="Você tem acesso ao Delivery e ao Salão. Escolha o ambiente para esta sessão."
    size="lg"
  >
    <div class="grid gap-3 p-4 sm:grid-cols-2">
      <button
        type="button"
        class="group rounded-2xl border bg-card p-5 text-left transition hover:border-primary/50 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="acessarDelivery"
      >
        <span
          class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
        >
          <Bike class="h-5 w-5" />
        </span>
        <span class="block font-semibold">Modo delivery</span>
        <span class="mt-1 block text-sm text-muted-foreground">
          Receba ofertas, confirme retiradas e acompanhe as entregas.
        </span>
      </button>
      <button
        type="button"
        class="group rounded-2xl border bg-card p-5 text-left transition hover:border-primary/50 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="acessarGestao"
      >
        <span
          class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"
        >
          <ConciergeBell class="h-5 w-5" />
        </span>
        <span class="block font-semibold">Modo gestão</span>
        <span class="mt-1 block text-sm text-muted-foreground">
          Acesse o Salão e as demais telas permitidas para o seu usuário.
        </span>
      </button>
    </div>
    <div class="flex justify-end px-4 pb-4">
      <Button variant="ghost" size="sm" @click="open = false">
        <Route class="mr-1.5 h-4 w-4" />Decidir depois
      </Button>
    </div>
  </ModalView>
</template>
