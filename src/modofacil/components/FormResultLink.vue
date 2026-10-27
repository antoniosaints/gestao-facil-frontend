<script setup lang="ts">
import { inject } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { modalFormKey, modalWorkspaceKey } from '../application/modalWorkspace'
const props = defineProps<{ to: RouteLocationRaw }>()
const router = useRouter()
const entry = inject(modalFormKey, undefined)
const workspace = inject(modalWorkspaceKey, undefined)
async function navigate() {
  if (!workspace) return
  // A result already visible behind the form only needs the overlay closed.
  if (router.resolve(props.to).path === router.currentRoute.value.path) await workspace.close()
  else await router.push(props.to)
}
</script>
<template>
  <button
    v-if="entry && workspace"
    type="button"
    class="mf-button"
    :disabled="workspace.busy.value"
    @click="navigate"
  >
    <slot />
  </button>
  <RouterLink v-else :to="to" class="mf-button"><slot /></RouterLink>
</template>
