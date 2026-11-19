<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Check, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { hasPermission } from '@/hooks/authorize'
import { useUiStore } from '@/stores/ui/uiStore'
import { appAccessCatalog, requiredAppCodes, safeAppReturnPath } from '@/utils/appAccess'
import AppRequirementNotice from '@/components/apps/AppRequirementNotice.vue'

const route = useRoute()
const ui = useUiStore()
const loading = ref(false)
const failed = ref(false)
const apps = computed(() => requiredAppCodes(route.query.apps))
const returnTo = computed(() => safeAppReturnPath(route.query.retorno))
const ready = computed(() => apps.value.length > 0 && apps.value.every(ui.hasActiveModule))
async function refresh() {
  loading.value = true
  failed.value = false
  try { await ui.loadAppModules(true); failed.value = !ui.appModulesLoaded }
  catch { failed.value = true }
  finally { loading.value = false }
}
onMounted(refresh)
watch(() => route.query.apps, refresh)
</script>

<template>
  <main class="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
    <header class="space-y-2"><p class="text-sm font-medium text-muted-foreground">Apps necessários</p><h1 class="text-2xl font-semibold">Prepare seu acesso</h1><p class="text-sm text-muted-foreground">Este recurso depende dos apps abaixo. Ative o que estiver faltando e conclua a configuração indicada antes de usar.</p></header>
    <p v-if="loading" role="status" class="text-sm text-muted-foreground">Verificando os apps da conta…</p>
    <div v-else-if="failed" role="alert" class="rounded-xl border p-4"><p>Não foi possível verificar os apps. Tente novamente para conferir seu acesso.</p></div>
    <div v-else class="space-y-4">
      <template v-for="app in apps" :key="app">
        <AppRequirementNotice v-if="!ui.hasActiveModule(app)" :app="app" :return-to="returnTo" />
        <section v-else class="space-y-3 rounded-xl border p-4">
          <h2 class="flex items-center gap-2 font-medium"><Check class="size-4 text-success" aria-hidden="true" />{{ appAccessCatalog[app].name }} ativo</h2>
          <AppRequirementNotice v-if="appAccessCatalog[app].configuration" :app="app" review :return-to="returnTo" />
          <p v-else class="text-sm text-muted-foreground">Nenhuma configuração adicional é exigida para abrir este app.</p>
        </section>
      </template>
      <p v-if="!apps.length" class="text-sm text-muted-foreground">Escolha um app na loja para consultar a ativação e a configuração.</p>
    </div>
    <footer class="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Button variant="outline" :disabled="loading" class="min-h-11 gap-2" @click="refresh"><RefreshCw class="size-4" :class="{ 'animate-spin': loading }" />Verificar novamente</Button>
      <Button v-if="ready && !loading && !failed && returnTo" as-child class="min-h-11 text-white"><RouterLink :to="returnTo">Continuar para o recurso</RouterLink></Button>
      <Button v-if="hasPermission(ui.usuarioLogged, 2)" variant="ghost" as-child class="min-h-11"><RouterLink :to="{ name: 'loja-home' }">Ver todos os apps</RouterLink></Button>
    </footer>
  </main>
</template>
