<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue'
import { useElementBounding, useWindowSize } from '@vueuse/core'
import AnimatedRouteLoader from './AnimatedRouteLoader.vue'

const props = defineProps<{ loading: boolean }>()
const viewport = useTemplateRef<HTMLDivElement>('viewport')
const { top, bottom, update } = useElementBounding(
  computed(() => (props.loading ? viewport.value : null)),
)
const { height: windowHeight } = useWindowSize()

const loadingStyle = computed(() => {
  // Preserve the page's height and center within the visible part of a long page.
  const visibleTop = Math.max(0, top.value)
  const minHeight = Math.max(0, windowHeight.value - visibleTop)
  const visibleBottom = Math.min(windowHeight.value, Math.max(bottom.value, top.value + minHeight))

  return {
    minHeight: `${minHeight}px`,
    '--route-loader-center': `${(visibleTop + visibleBottom) / 2 - top.value}px`,
  }
})

watch(
  () => props.loading,
  (loading) => {
    if (loading) update()
  },
  { flush: 'post' },
)
</script>

<template>
  <div
    ref="viewport"
    :class="loading ? 'relative isolate overflow-clip' : 'contents'"
    :style="loading ? loadingStyle : undefined"
  >
    <div :class="loading ? 'opacity-0' : 'contents'" :inert="loading || undefined">
      <slot />
    </div>
    <div
      v-if="loading"
      role="status"
      class="absolute inset-x-0 top-[var(--route-loader-center)] flex -translate-y-1/2 flex-col items-center gap-2"
    >
      <AnimatedRouteLoader class="h-24 w-24 text-primary" />
      <span class="text-sm font-medium text-foreground">Carregando página…</span>
    </div>
  </div>
</template>
