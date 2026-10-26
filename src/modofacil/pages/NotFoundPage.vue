<script setup lang="ts">
import PageFrame from '../components/PageFrame.vue'
</script>
<template>
  <PageFrame>
    <section class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5">
      <h1>Não encontramos esta página</h1>
      <p>Confira o endereço ou volte ao início do Modo Fácil.</p>
      <RouterLink
        class="mf-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/90 no-underline transition-colors hover:bg-muted/50"
        to="/modofacil"
        >Voltar ao início</RouterLink
      >
    </section>
  </PageFrame>
</template>
