<script setup lang="ts">
// Campo de imagem da variante: mostra a imagem atual (ou uma pré-visualização da nova) e permite
// trocar/remover. Não envia nada sozinho — apenas informa a intenção ao pai via `change`, que
// persiste (upload/remover) após salvar a variante (quando o id já existe).
import { computed, onBeforeUnmount, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { ImagePlus, Trash2, Package } from 'lucide-vue-next'
import { resolveFileUrl } from '@/utils/fileUrl'
import ImageCropperModal from '@/pages/produtos/formulario/ImageCropperModal.vue'

const props = defineProps<{ existing?: string | null; disabled?: boolean }>()
const emit = defineEmits<{ (e: 'change', value: { file: File | null; remove: boolean }): void }>()

const toast = useToast()
const fileInput = ref<HTMLInputElement | null>(null)
const previewUrl = ref('')
const removed = ref(false)
const stagedFile = ref<File | null>(null)

// Ferramenta de corte 1x1: toda imagem selecionada passa pelo recorte quadrado antes de virar
// a imagem escolhida (que só é enviada de fato ao salvar a variante).
const cropperOpen = ref(false)
const cropperFile = ref<File | null>(null)

const displayUrl = computed(() => {
  if (previewUrl.value) return previewUrl.value
  if (removed.value) return ''
  return props.existing ? resolveFileUrl(props.existing) : ''
})

function pick() {
  fileInput.value?.click()
}

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.type.startsWith('image/')) {
    toast.warning('Selecione um arquivo de imagem.')
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    toast.warning('A imagem excede o limite de 5MB.')
    return
  }
  // Abre a ferramenta de corte; só depois do recorte a imagem é aplicada.
  cropperFile.value = file
  cropperOpen.value = true
}

function onCropped(file: File) {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  stagedFile.value = file
  previewUrl.value = URL.createObjectURL(file)
  removed.value = false
  emit('change', { file: stagedFile.value, remove: false })
}

function remove() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  previewUrl.value = ''
  stagedFile.value = null
  // Só marca para remover no backend se já havia uma imagem salva.
  removed.value = Boolean(props.existing)
  emit('change', { file: null, remove: removed.value })
}

onBeforeUnmount(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <div class="flex items-center gap-4">
    <div
      class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/30"
    >
      <img v-if="displayUrl" :src="displayUrl" alt="Imagem da variante" class="h-full w-full object-cover" />
      <Package v-else class="h-8 w-8 text-muted-foreground" />
    </div>
    <div class="flex flex-col gap-2">
      <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="onFileChange" />
      <button
        type="button"
        :disabled="disabled"
        class="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-60"
        @click="pick"
      >
        <ImagePlus class="h-4 w-4 text-violet-500" />
        {{ displayUrl ? 'Trocar imagem' : 'Adicionar imagem' }}
      </button>
      <button
        v-if="displayUrl"
        type="button"
        :disabled="disabled"
        class="inline-flex items-center gap-1.5 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900/50 dark:hover:bg-red-950/30"
        @click="remove"
      >
        <Trash2 class="h-4 w-4" />
        Remover
      </button>
      <p class="text-xs text-muted-foreground">JPG, PNG, GIF ou WebP · até 5MB. Recorte quadrado (1x1).</p>
    </div>

    <ImageCropperModal v-model:open="cropperOpen" :file="cropperFile" @cropped="onCropped" />
  </div>
</template>
