<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { updateMetaTags } from '@/utils/theme';
import { onMounted } from 'vue';

onMounted(() => {
  updateMetaTags()
})
</script>