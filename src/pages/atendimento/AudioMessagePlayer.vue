<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import WaveSurfer from 'wavesurfer.js'
import { LoaderCircle, Pause, Play } from 'lucide-vue-next'

// Reprodutor de áudio (notas de voz) com waveform. A config de cores/barras segue a integração
// de referência (w-api-manager) adaptada ao tema do sistema: mídia enviada (mine) usa tons
// claros sobre o balão primário; recebida usa tons de slate/primário sobre o balão claro.
const props = defineProps<{ src: string; mine?: boolean }>()

const container = ref<HTMLElement | null>(null)
let ws: WaveSurfer | null = null
const playing = ref(false)
const ready = ref(false)
const failed = ref(false)
const current = ref(0)
const duration = ref(0)

function destroy() {
  if (ws) {
    ws.destroy()
    ws = null
  }
  playing.value = false
  ready.value = false
  current.value = 0
  duration.value = 0
}

function build() {
  destroy()
  failed.value = false
  if (!container.value || !props.src) return

  ws = WaveSurfer.create({
    container: container.value,
    waveColor: props.mine ? 'rgba(255, 255, 255, 0.45)' : 'rgba(100, 116, 139, 0.45)',
    progressColor: props.mine ? 'rgba(255, 255, 255, 0.95)' : 'rgba(37, 99, 235, 0.95)',
    cursorColor: props.mine ? 'rgba(255, 255, 255, 0.9)' : 'rgba(59, 130, 246, 0.9)',
    height: 32,
    barWidth: 2,
    barGap: 1,
    barRadius: 2,
    dragToSeek: true,
    hideScrollbar: true,
    normalize: true,
  })

  ws.load(props.src)
  ws.on('ready', () => {
    ready.value = true
    duration.value = ws?.getDuration() || 0
  })
  ws.on('play', () => (playing.value = true))
  ws.on('pause', () => (playing.value = false))
  ws.on('finish', () => (playing.value = false))
  ws.on('timeupdate', (time: number) => (current.value = time))
  ws.on('error', () => (failed.value = true))
}

function toggle() {
  ws?.playPause()
}

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min}:${String(sec).padStart(2, '0')}`
}

onMounted(build)
watch(() => props.src, build)
onBeforeUnmount(destroy)
</script>

<template>
  <div class="flex min-w-[210px] max-w-[280px] items-center gap-2">
    <button
      type="button"
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition"
      :class="mine ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-primary/10 text-primary hover:bg-primary/20'"
      :disabled="!ready && !failed"
      :title="playing ? 'Pausar' : 'Reproduzir'"
      @click="toggle"
    >
      <LoaderCircle v-if="!ready && !failed" class="h-4 w-4 animate-spin" />
      <Pause v-else-if="playing" class="h-4 w-4" />
      <Play v-else class="h-4 w-4" />
    </button>
    <div class="min-w-0 flex-1">
      <div ref="container" class="w-full cursor-pointer"></div>
      <div class="mt-0.5 flex justify-between text-[10px] tabular-nums" :class="mine ? 'text-white/70' : 'text-muted-foreground'">
        <span v-if="failed">Não foi possível carregar o áudio</span>
        <template v-else>
          <span>{{ formatTime(current) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </template>
      </div>
    </div>
  </div>
</template>
