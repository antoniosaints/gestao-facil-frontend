<script setup lang="ts">
import { CircleHelp } from 'lucide-vue-next'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

withDefaults(defineProps<{
  text: string
  label?: string
}>(), {
  label: 'Ver ajuda',
})
</script>

<template>
  <TooltipProvider :delay-duration="150">
    <Tooltip>
      <TooltipTrigger as-child>
        <button
          type="button"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          :aria-label="label"
        >
          <CircleHelp class="h-4 w-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent class="max-w-72 text-pretty leading-relaxed" side="top">
        {{ text }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>
