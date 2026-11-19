<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRoute, type RouteLocationRaw } from 'vue-router'
import { PackagePlus, Settings2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { appAccessCatalog, appActivationLocation, appConfigurationLocation } from '@/utils/appAccess'

const props = defineProps<{ app: string; configured?: boolean; loading?: boolean; configurationTo?: RouteLocationRaw; configureMessage?: string; returnTo?: string; inactive?: boolean; review?: boolean }>()
defineEmits<{ navigate: [] }>()
const ui = useUiStore()
const route = useRoute()
const checking = ref(false)
const pending = computed(() => props.loading || checking.value)
const unverified = computed(() => ui.appModulesLoaded === false && !props.inactive)
const definition = computed(() => appAccessCatalog[props.app])
const active = computed(() => !props.inactive && ui.hasActiveModule(props.app))
const canActivate = computed(() => hasPermission(ui.usuarioLogged, 2))
const canConfigure = computed(() => {
  if (!props.configurationTo && props.app === 'ourives') return ui.hasOuriveCapability('CONFIGURAR')
  if (!props.configurationTo && props.app === 'restaurante-delivery') return ui.hasRestaurantCapability('CONFIGURACOES_GERENCIAR')
  return hasPermission(ui.usuarioLogged, props.configurationTo ? 4 : definition.value?.permission || 2)
})
const visible = computed(() => definition.value && (unverified.value || !active.value || props.configured === false || props.review))
async function retry() {
  checking.value = true
  try { await ui.loadAppModules(true) } catch { /* A falha continua visível e permite tentar novamente. */ }
  finally { checking.value = false }
}
</script>

<template>
  <section v-if="visible" class="space-y-3 rounded-xl border border-dashed bg-muted/20 p-4" :aria-label="`Acesso ao app ${definition.name}`">
    <div class="flex items-start gap-3">
      <component :is="active ? Settings2 : PackagePlus" class="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <div class="min-w-0 space-y-1">
        <h3 class="text-sm font-semibold">{{ pending ? 'Verificando acesso…' : unverified ? `Não foi possível verificar o app ${definition.name}` : active ? review ? `Configuração do app ${definition.name}` : `Configure o app ${definition.name}` : `Instale e ative o app ${definition.name}` }}</h3>
        <p class="text-sm text-muted-foreground">{{ pending ? 'Aguarde a validação dos apps da conta.' : unverified ? 'Tente novamente para conferir se a conta tem acesso a este recurso.' : active ? configureMessage || definition.setup : `Este recurso depende do app ${definition.name} ativo na sua conta.` }}</p>
      </div>
    </div>
    <template v-if="!pending">
      <Button v-if="unverified" type="button" variant="outline" class="min-h-11" @click="retry">Verificar acesso novamente</Button>
      <Button v-else-if="!active && canActivate" type="button" as-child class="h-auto min-h-11 max-w-full whitespace-normal text-center text-white"><RouterLink :to="appActivationLocation(app, returnTo || route.fullPath)" @click="$emit('navigate')">Ver ativação do app {{ definition.name }}</RouterLink></Button>
      <p v-else-if="!active" class="text-sm text-muted-foreground">Peça ao administrador da conta para instalar e ativar este app.</p>
      <Button v-else-if="canConfigure && (configurationTo || definition.configuration)" type="button" as-child variant="outline" class="h-auto min-h-11 max-w-full whitespace-normal text-center"><RouterLink :to="appConfigurationLocation(configurationTo || definition.configuration!, returnTo || route.fullPath)" @click="$emit('navigate')">Configurar {{ definition.name }}</RouterLink></Button>
      <p v-else class="text-sm text-muted-foreground">Peça ao administrador da conta para concluir esta configuração.</p>
    </template>
  </section>
</template>
