<script setup lang="ts">
import { onMounted } from 'vue'
import { notifyError } from '../application/notifications'
onMounted(() =>
  notifyError('Não foi possível carregar o formulário. Feche e tente abrir novamente.'),
)
</script>
<template>
  <p
    role="alert"
    class="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
  >
    Não foi possível carregar o formulário. Feche e tente abrir novamente.
  </p>
</template>
