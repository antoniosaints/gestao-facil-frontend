<script setup lang="ts">
import { CheckCircle2, ArrowRight } from 'lucide-vue-next'
import type { RouteLocationRaw } from 'vue-router'
import FormResultLink from './FormResultLink.vue'
defineProps<{ title?: string; description?: string; to?: RouteLocationRaw; label?: string }>()
</script>
<template>
  <section
    class="min-w-0 rounded-[8px] border border-border bg-card p-6 text-center sm:p-8"
    role="status"
  >
    <CheckCircle2
      :size="40"
      :stroke-width="1.5"
      class="mx-auto mb-4 text-emerald-500"
      aria-hidden="true"
    />
    <h2>{{ title || 'Operação concluída' }}</h2>
    <p v-if="description" class="mx-auto max-w-lg text-muted-foreground">{{ description }}</p>
    <slot /><FormResultLink
      v-if="to"
      :to="to"
      class="mf-button mt-4 !border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
      >{{ label || 'Ver registros' }}<ArrowRight :size="15"
    /></FormResultLink>
  </section>
</template>
