<script setup lang="ts">
import { nextTick } from 'vue'
import { ArrowRight, Compass } from 'lucide-vue-next'
import ModalView from '@/components/formulario/ModalView.vue'
import { useTour } from '@/composables/useTour'
import { tours } from '@/components/onboarding/tours'

const { menuOpen, start } = useTour()

async function escolher(id: string) {
  // Fecha o seletor antes de iniciar o tour (que pode navegar de rota). O pequeno atraso
  // evita o bug de pointer-events preso quando um dialog fecha durante a navegação.
  menuOpen.value = false
  await nextTick()
  setTimeout(() => start(id, { manual: true }), 220)
}
</script>

<template>
  <ModalView v-model:open="menuOpen" size="lg" :icon="Compass" title="Tours guiados"
    description="Escolha um tour para aprender a usar o sistema no seu ritmo.">
    <div class="grid gap-3 px-2 pb-2">
      <button v-for="tour in tours" :key="tour.id" type="button" @click="escolher(tour.id)"
        class="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left transition hover:border-primary/40 hover:bg-muted/40 hover:shadow-sm">
        <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl" :class="tour.colorClass">
          <component :is="tour.icon" class="h-5 w-5" />
        </span>
        <div class="min-w-0 flex-1">
          <p class="font-semibold leading-tight">{{ tour.title }}</p>
          <p class="mt-0.5 text-sm text-muted-foreground">{{ tour.description }}</p>
        </div>
        <ArrowRight
          class="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </button>
    </div>
  </ModalView>
</template>
