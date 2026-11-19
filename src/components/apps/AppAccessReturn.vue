<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Button } from '@/components/ui/button'
import { safeAppReturnPath } from '@/utils/appAccess'

const route = useRoute()
const target = computed(() => route.meta.isPublic ? undefined : safeAppReturnPath(route.query.retorno))
</script>

<template>
  <aside v-if="target && !['loja-home', 'apps-acesso'].includes(String(route.name))" class="m-4 flex flex-col gap-3 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between" aria-label="Retomar recurso após configuração">
    <p class="text-sm text-muted-foreground">Depois de concluir a configuração, volte ao recurso que você estava usando.</p>
    <Button as-child variant="outline" class="min-h-11 shrink-0"><RouterLink :to="target">Voltar para o recurso</RouterLink></Button>
  </aside>
</template>
