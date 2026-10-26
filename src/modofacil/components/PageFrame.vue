<script setup lang="ts">
defineProps<{ compact?: boolean }>()
</script>
<template>
  <div class="mf-page min-w-0 space-y-5" :class="compact ? 'mx-auto max-w-4xl' : ''">
    <slot />
  </div>
</template>
