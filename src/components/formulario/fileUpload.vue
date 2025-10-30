<template>
  <div
    class="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center cursor-pointer transition hover:border-blue-500"
    @click="triggerInput"
    @dragover.prevent="dragOver = true"
    @dragleave.prevent="dragOver = false"
    @drop.prevent="handleDrop"
    :class="{ 'bg-blue-50 border-blue-400': dragOver }"
  >
    <input
      ref="fileInput"
      type="file"
      class="hidden"
      @change="handleFileChange"
      :accept="accept"
    />

    <div v-if="!preview">
      <p class="text-gray-600">Clique ou arraste o arquivo aqui</p>
      <p v-if="accept" class="text-sm text-gray-400 mt-1">
        (Tipos permitidos: {{ accept }})
      </p>
    </div>

    <div v-else class="flex flex-col items-center">
      <img
        v-if="isImage"
        :src="preview"
        class="max-h-48 rounded-md shadow-md object-contain mb-3"
      />
      <p class="text-gray-700 font-medium truncate w-48">{{ fileName }}</p>
      <button
        class="mt-3 text-sm text-red-500 hover:underline"
        @click.stop="removeFile"
      >
        Remover
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const emit = defineEmits(['update:file'])
const props = defineProps({
  accept: { type: String, default: '' }
})

const fileInput = ref<HTMLInputElement | null>(null)
const dragOver = ref(false)
const file = ref<File | null>(null)
const preview = ref<string | null>(null)

const isImage = computed(() => file.value && file.value.type.startsWith('image/'))
const fileName = computed(() => file.value?.name || '')

function triggerInput() {
  fileInput.value?.click()
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files?.length) {
    setFile(target.files[0])
  }
}

function handleDrop(e: DragEvent) {
  dragOver.value = false
  const droppedFile = e.dataTransfer?.files[0]
  if (droppedFile) setFile(droppedFile)
}

function setFile(f: File) {
  file.value = f
  emit('update:file', f)

  if (f.type.startsWith('image/')) {
    const reader = new FileReader()
    reader.onload = e => (preview.value = e.target?.result as string)
    reader.readAsDataURL(f)
  } else {
    preview.value = null
  }
}

function removeFile() {
  file.value = null
  preview.value = null
  emit('update:file', null)
}
</script>

<style scoped>
div[draggable="true"] {
  user-select: none;
}
</style>
