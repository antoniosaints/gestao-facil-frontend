<script setup lang="ts">
import { inject } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { modalFormKey, modalWorkspaceKey } from '../application/modalWorkspace'
defineProps<{ to: RouteLocationRaw }>()
const entry = inject(modalFormKey, undefined)
const workspace = inject(modalWorkspaceKey, undefined)
</script>
<template>
  <button v-if="entry && workspace" type="button" @click="workspace.close()"><slot /></button>
  <RouterLink v-else :to="to"><slot /></RouterLink>
</template>
