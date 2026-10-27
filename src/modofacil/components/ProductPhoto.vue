<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Package, ImageOff } from 'lucide-vue-next'
import { resolveFileUrl } from '../adapters/domain'
import ModalDialog from './ModalDialog.vue'
const props = defineProps<{ image?: string | null; name: string }>()
const opened = ref(false),
  thumbnailFailed = ref(false),
  previewFailed = ref(false)
const source = computed(() => (props.image ? resolveFileUrl(props.image) : ''))
watch(source, () => {
  opened.value = false
  thumbnailFailed.value = false
  previewFailed.value = false
})
</script>
<template>
  <button
    v-if="source && !thumbnailFailed"
    type="button"
    data-product-photo
    class="!h-9 !w-9 !min-h-9 !shrink-0 !overflow-hidden !rounded-md !border-border !bg-muted/30 !p-0"
    :aria-label="`Ver foto de ${name}`"
    :title="`Ampliar foto de ${name}`"
    @click="opened = true"
  >
    <img
      :src="source"
      :alt="name"
      class="h-full w-full object-contain p-0.5"
      loading="lazy"
      @error="thumbnailFailed = true"
    />
  </button>
  <span
    v-else
    role="img"
    :aria-label="`${thumbnailFailed ? 'Foto indisponível' : 'Sem foto'} de ${name}`"
    class="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted/30 text-muted-foreground"
    ><ImageOff v-if="thumbnailFailed" :size="17" aria-hidden="true" /><Package
      v-else
      :size="18"
      :stroke-width="1.5"
      aria-hidden="true"
  /></span>
  <ModalDialog
    v-if="opened"
    title="Foto do produto"
    :description="name"
    size="lg"
    @close="opened = false"
  >
    <div
      class="flex min-h-48 items-center justify-center rounded-lg border border-border bg-muted/20 p-3 sm:p-5"
    >
      <img
        v-if="!previewFailed"
        :src="source"
        :alt="`Foto de ${name}`"
        class="max-h-[60dvh] w-full object-contain"
        @error="previewFailed = true"
      />
      <p v-else role="status" class="!mb-0 flex items-center gap-2 text-muted-foreground">
        <ImageOff :size="20" />Não foi possível carregar esta imagem.
      </p>
    </div>
    <template #footer
      ><button type="button" @click="opened = false">Fechar visualização</button></template
    >
  </ModalDialog>
</template>
