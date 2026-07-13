<script setup lang="ts">
import { FileDigit } from 'lucide-vue-next'
</script>

<template>
  <div class="container mx-auto flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
    <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
      <FileDigit class="h-8 w-8" />
    </div>
    <h1 class="text-xl font-semibold tracking-tight">Relatórios de Atendimento</h1>
    <p class="max-w-md text-sm text-muted-foreground">
      Relatórios e KPIs do atendimento (tempo de resposta, atendimentos por agente, conversas
      finalizadas) chegam em breve, aproveitando o registro de quem assumiu cada atendimento.
    </p>
    <span class="rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">Em desenvolvimento</span>
  </div>
</template>
