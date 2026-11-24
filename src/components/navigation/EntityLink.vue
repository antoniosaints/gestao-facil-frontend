<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { ArrowUpRight } from 'lucide-vue-next'
import { hasPermission } from '@/hooks/authorize'
import { useUiStore } from '@/stores/ui/uiStore'
import { linkedRecordNames, linkedRecordRoute, type LinkedRecordKind } from './linkedRecord'

const props = defineProps<{
  kind: LinkedRecordKind
  recordId?: number | string | null
  variantId?: number | string | null
  label?: string | number | null
  fallback?: string
  iconOnly?: boolean
  newTab?: boolean
}>()
const route = useRoute()
const router = useRouter()
const ui = useUiStore()
const label = computed(() => props.label || props.fallback || '—')
const title = computed(() => `Abrir ${linkedRecordNames[props.kind]}: ${label.value}`)
const to = computed(() => {
  if (!router || typeof router.resolve !== 'function') return null
  const target = linkedRecordRoute(
    props.kind,
    props.recordId,
    props.variantId,
    route?.path?.startsWith('/modofacil/') ?? false,
  )
  if (!target) return null
  if (
    typeof target === 'object' &&
    'name' in target &&
    target.name &&
    !router.hasRoute(target.name)
  )
    return null
  const resolved = router.resolve(target)
  if (!resolved.matched.length || resolved.fullPath === route?.fullPath) return null
  const level = Number(resolved.meta.permissao || 0)
  if (level && (!ui.usuarioLogged || !hasPermission(ui.usuarioLogged, level))) return null
  const apps = Array.isArray(resolved.meta.modulo) ? resolved.meta.modulo : [resolved.meta.modulo]
  if (apps.some((app) => app && !ui.hasActiveModule(String(app)))) return null
  return target
})
</script>

<template>
  <RouterLink
    v-if="to"
    :to="to"
    :title="title"
    :aria-label="iconOnly ? title : undefined"
    :target="newTab ? '_blank' : undefined"
    :rel="newTab ? 'noopener' : undefined"
    class="inline-flex min-w-0 max-w-full items-center gap-0.5 align-baseline rounded-sm text-primary decoration-primary/50 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    @click.stop
  >
    <span v-if="!iconOnly" class="min-w-0 truncate"
      ><slot>{{ label }}</slot></span
    >
    <ArrowUpRight
      aria-hidden="true"
      class="shrink-0"
      :class="iconOnly ? 'size-4' : 'size-[0.85em]'"
      :stroke-width="2"
    />
  </RouterLink>
  <span v-else-if="!iconOnly"
    ><slot>{{ label }}</slot></span
  >
</template>
