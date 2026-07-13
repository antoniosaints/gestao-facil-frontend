<script setup lang="ts">
import { Bot } from 'lucide-vue-next'
</script>

<template>
  <div class="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <Bot class="h-8 w-8" />
    </div>
    <h1 class="text-xl font-semibold tracking-tight">Agentes de Atendimento</h1>
    <p class="max-w-md text-sm text-muted-foreground">
      Configuração de agentes de IA e regras de atendimento automático chegam em breve.
    </p>
    <span class="rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">Em desenvolvimento</span>
  </div>
</template>
