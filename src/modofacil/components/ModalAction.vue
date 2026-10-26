<script setup lang="ts">
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import { modalWorkspaceKey } from '../application/modalWorkspace'
import type { FormTarget } from '../application/formDialogs'
const props = defineProps<FormTarget>()
const workspace = inject(modalWorkspaceKey, undefined)
const route = useRoute()
</script>
<template>
  <button type="button" @click="workspace?.open(props, route.fullPath)"><slot /></button>
</template>
