<script setup lang="ts">
import { CircleHelp } from 'lucide-vue-next'
import { useTour } from '@/composables/useTour'

const { openMenu } = useTour()
</script>

<template>
  <button type="button" v-tooltip="'Tours guiados'"
    class="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground transition hover:bg-muted hover:text-foreground"
    @click="openMenu()">
    <CircleHelp class="h-5 w-5" />
  </button>
</template>
