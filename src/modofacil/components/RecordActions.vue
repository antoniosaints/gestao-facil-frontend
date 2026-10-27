<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from '@/components/ui/dropdown-menu'
import { darkPaletteClasses } from '../application/ui'
defineProps<{ label: string; disabled?: boolean }>()
</script>
<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button
        type="button"
        :aria-label="label"
        :disabled="disabled"
        class="!min-h-8 !px-2.5 !py-1 !text-xs"
      >
        Ações<ChevronDown :size="13" aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="end"
      :class="[
        darkPaletteClasses,
        'mf-record-menu min-w-48 max-w-[calc(100vw-2rem)] [&_[role=menuitem]]:!flex [&_[role=menuitem]]:!w-full [&_[role=menuitem]]:!justify-start [&_[role=menuitem]]:!text-left [&_[role=menuitem]]:min-h-10 [&_[role=menuitem]]:cursor-pointer [&_[role=menuitem]]:text-sm',
      ]"
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenu>
</template>
