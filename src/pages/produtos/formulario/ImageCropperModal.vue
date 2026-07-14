<script setup lang="ts">
// Ferramenta de corte 1x1 (quadrado) para imagens de produto. O usuário arrasta e aproxima a
// imagem dentro de um visor quadrado; ao confirmar, a região visível é desenhada num canvas
// quadrado e exportada como JPEG. Sem dependências externas.
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { LoaderCircle, ZoomIn, ZoomOut } from 'lucide-vue-next'

const props = defineProps<{ open: boolean; file: File | null }>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'cropped', value: File): void
}>()

const VIEWPORT = 320 // tamanho do visor (px) na tela
const OUTPUT = 1024 // tamanho da imagem final exportada (px)

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value),
})

const sourceUrl = ref('')
const imageEl = ref<HTMLImageElement | null>(null)
const loaded = ref(false)
const processing = ref(false)

const imgW = ref(0)
const imgH = ref(0)
const scale = ref(1)
const minScale = ref(1)
const offsetX = ref(0)
const offsetY = ref(0)

const maxScale = computed(() => minScale.value * 4)

let dragging = false
let lastX = 0
let lastY = 0

const imgStyle = computed(() => ({
  width: `${imgW.value * scale.value}px`,
  height: `${imgH.value * scale.value}px`,
  transform: `translate(${offsetX.value}px, ${offsetY.value}px)`,
}))

function clampOffsets() {
  const minX = VIEWPORT - imgW.value * scale.value
  const minY = VIEWPORT - imgH.value * scale.value
  offsetX.value = Math.min(0, Math.max(minX, offsetX.value))
  offsetY.value = Math.min(0, Math.max(minY, offsetY.value))
}

function resetFromFile(file: File) {
  loaded.value = false
  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value)
  sourceUrl.value = URL.createObjectURL(file)

  const img = new Image()
  img.onload = () => {
    imageEl.value = img
    imgW.value = img.naturalWidth
    imgH.value = img.naturalHeight
    // Escala mínima = "cover" (a imagem sempre preenche o visor quadrado).
    minScale.value = Math.max(VIEWPORT / imgW.value, VIEWPORT / imgH.value)
    scale.value = minScale.value
    offsetX.value = (VIEWPORT - imgW.value * scale.value) / 2
    offsetY.value = (VIEWPORT - imgH.value * scale.value) / 2
    loaded.value = true
  }
  img.src = sourceUrl.value
}

watch(
  () => props.file,
  (file) => {
    if (file && props.open) resetFromFile(file)
  },
)
watch(
  () => props.open,
  (open) => {
    if (open && props.file) resetFromFile(props.file)
  },
)

function onPointerDown(event: PointerEvent) {
  if (!loaded.value) return
  dragging = true
  lastX = event.clientX
  lastY = event.clientY
  ;(event.target as HTMLElement).setPointerCapture?.(event.pointerId)
}
function onPointerMove(event: PointerEvent) {
  if (!dragging) return
  offsetX.value += event.clientX - lastX
  offsetY.value += event.clientY - lastY
  lastX = event.clientX
  lastY = event.clientY
  clampOffsets()
}
function onPointerUp() {
  dragging = false
}

// Zoom mantendo o ponto central do visor fixo.
function applyZoom(newScale: number) {
  const clamped = Math.min(maxScale.value, Math.max(minScale.value, newScale))
  const centerSourceX = (VIEWPORT / 2 - offsetX.value) / scale.value
  const centerSourceY = (VIEWPORT / 2 - offsetY.value) / scale.value
  scale.value = clamped
  offsetX.value = VIEWPORT / 2 - centerSourceX * clamped
  offsetY.value = VIEWPORT / 2 - centerSourceY * clamped
  clampOffsets()
}
function onZoomInput(event: Event) {
  applyZoom(Number((event.target as HTMLInputElement).value))
}
function onWheel(event: WheelEvent) {
  if (!loaded.value) return
  applyZoom(scale.value * (event.deltaY < 0 ? 1.08 : 0.92))
}

function confirm() {
  if (!loaded.value || !imageEl.value) return
  processing.value = true
  try {
    // Região do original (em pixels naturais) correspondente ao visor quadrado.
    const sSize = VIEWPORT / scale.value
    const sx = -offsetX.value / scale.value
    const sy = -offsetY.value / scale.value

    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT
    canvas.height = OUTPUT
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      processing.value = false
      return
    }
    ctx.drawImage(imageEl.value, sx, sy, sSize, sSize, 0, 0, OUTPUT, OUTPUT)

    canvas.toBlob(
      (blob) => {
        processing.value = false
        if (!blob) return
        const baseName = (props.file?.name || 'imagem').replace(/\.[^.]+$/, '')
        const cropped = new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
        emit('cropped', cropped)
        isOpen.value = false
      },
      'image/jpeg',
      0.9,
    )
  } catch {
    processing.value = false
  }
}

onBeforeUnmount(() => {
  if (sourceUrl.value) URL.revokeObjectURL(sourceUrl.value)
})
</script>

<template>
  <ModalView
    v-model:open="isOpen"
    title="Recortar imagem"
    description="Posicione e aproxime a imagem para recortar em formato quadrado (1x1)."
    size="md"
  >
    <div class="flex flex-col items-center gap-4 px-4 pb-2">
      <div
        class="relative overflow-hidden rounded-lg border bg-muted/40 select-none"
        :style="{ width: `${VIEWPORT}px`, height: `${VIEWPORT}px`, touchAction: 'none', cursor: loaded ? 'grab' : 'default' }"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointerleave="onPointerUp"
        @wheel.prevent="onWheel"
      >
        <img
          v-if="sourceUrl"
          :src="sourceUrl"
          alt="Recorte"
          class="pointer-events-none absolute left-0 top-0 max-w-none"
          :style="imgStyle"
          draggable="false"
        />
        <div v-if="!loaded" class="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          <LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Carregando...
        </div>
        <!-- Moldura guia -->
        <div class="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/40"></div>
      </div>

      <div class="flex w-full max-w-xs items-center gap-2">
        <ZoomOut class="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="range"
          class="w-full accent-primary"
          :min="minScale"
          :max="maxScale"
          :step="(maxScale - minScale) / 100 || 0.01"
          :value="scale"
          :disabled="!loaded"
          @input="onZoomInput"
        />
        <ZoomIn class="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>

      <div class="flex w-full justify-end gap-2 border-t border-border/70 pt-4">
        <Button type="button" variant="secondary" :disabled="processing" @click="isOpen = false">Cancelar</Button>
        <Button type="button" class="text-white" :disabled="!loaded || processing" @click="confirm">
          <LoaderCircle v-if="processing" class="mr-2 h-4 w-4 animate-spin" />
          Recortar e usar
        </Button>
      </div>
    </div>
  </ModalView>
</template>
