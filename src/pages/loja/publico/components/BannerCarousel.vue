<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = withDefaults(defineProps<{
  images: string[]
  overlay?: number
  position?: string
  height?: string
  interval?: number
}>(), { overlay: 25, position: 'center', height: 'medio', interval: 5000 })

const index = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const heights: Record<string, string> = {
  pequeno: 'min-h-[240px] lg:min-h-[300px]',
  medio: 'min-h-[300px] lg:min-h-[420px]',
  grande: 'min-h-[380px] lg:min-h-[560px]',
}
const heightClass = computed(() => heights[props.height] || heights.medio)

function go(target: number) {
  const total = props.images.length
  if (total <= 1) return
  index.value = ((target % total) + total) % total
  restart()
}
function next() { go(index.value + 1) }
function prev() { go(index.value - 1) }

function stop() { if (timer) { clearInterval(timer); timer = null } }
function restart() {
  stop()
  if (props.images.length > 1) timer = setInterval(() => go(index.value + 1), props.interval)
}

onMounted(restart)
onUnmounted(stop)
watch(() => props.images, () => { index.value = 0; restart() })
</script>

<template>
  <section class="hero-carousel relative flex flex-col overflow-hidden" :class="heightClass">
    <!-- Imagens (crossfade) -->
    <div
      v-for="(img, i) in images"
      :key="img + i"
      class="absolute inset-0 bg-cover transition-opacity duration-700 ease-out"
      :class="i === index ? 'opacity-100' : 'opacity-0'"
      :style="{ backgroundImage: `url(${img})`, backgroundPosition: position }"
    />

    <!-- Camadas de escurecimento para legibilidade -->
    <div class="absolute inset-0 bg-black" :style="{ opacity: overlay / 100 }" />
    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

    <!-- Conteúdo (ancorado embaixo-esquerda) -->
    <div class="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-end px-5 py-10 lg:px-8">
      <slot />
    </div>

    <!-- Controles (apenas com mais de uma imagem) -->
    <template v-if="images.length > 1">
      <button type="button" class="carousel-nav left-3" aria-label="Anterior" @click="prev"><ChevronLeft class="h-5 w-5" /></button>
      <button type="button" class="carousel-nav right-3" aria-label="Próximo" @click="next"><ChevronRight class="h-5 w-5" /></button>
      <div class="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        <button
          v-for="(img, i) in images"
          :key="'dot' + i"
          type="button"
          class="h-2 rounded-full bg-white transition-all"
          :class="i === index ? 'w-6' : 'w-2 opacity-50 hover:opacity-80'"
          :aria-label="`Ir para o banner ${i + 1}`"
          @click="go(i)"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.hero-carousel { background-color: var(--shop-primary); background-position: var(--hero-position, center); }
.carousel-nav {
  position: absolute;
  top: 50%;
  z-index: 20;
  display: grid;
  place-items: center;
  height: 2.5rem;
  width: 2.5rem;
  transform: translateY(-50%);
  border-radius: 999px;
  background: rgb(255 255 255 / .85);
  color: #0f172a;
  box-shadow: 0 4px 14px rgb(0 0 0 / .2);
  transition: background .15s, transform .15s;
}
.carousel-nav:hover { background: #fff; }
.carousel-nav:active { transform: translateY(-50%) scale(.94); }
</style>
