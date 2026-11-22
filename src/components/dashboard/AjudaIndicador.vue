<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useId } from 'vue'
import { CircleHelp } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

defineProps<{ titulo: string; texto: string }>()

const descricaoId = useId()
const modo = ref<'hover' | 'interacao' | null>(null)
const aberto = computed(() => modo.value !== null)
let timer: ReturnType<typeof setTimeout> | undefined
let restaurarFoco = false

function cancelarTimer() {
  clearTimeout(timer)
  timer = undefined
}

function mudarAbertura(novo: boolean) {
  cancelarTimer()
  if (novo) restaurarFoco = true
  modo.value = novo ? 'interacao' : null
}

function mostrarAoPassar(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || aberto.value) return
  cancelarTimer()
  timer = setTimeout(() => {
    restaurarFoco = false
    modo.value = 'hover'
  }, 120)
}

function sairComMouse(event: PointerEvent) {
  if (event.pointerType !== 'mouse') return
  cancelarTimer()
  if (modo.value === 'hover') {
    timer = setTimeout(() => mudarAbertura(false), 180)
  }
}

function fixarAoClicar(event: MouseEvent) {
  if (modo.value !== 'hover') return
  // O popover aberto pelo ponteiro fica fixo no primeiro clique.
  event.stopImmediatePropagation()
  mudarAbertura(true)
}

onBeforeUnmount(cancelarTimer)
</script>

<template>
  <div class="shrink-0">
    <Popover :open="aberto" @update:open="mudarAbertura">
      <PopoverTrigger as-child>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          class="size-10 shrink-0 rounded-full text-muted-foreground hover:text-foreground"
          :aria-label="'Entenda ' + titulo"
          :aria-describedby="aberto ? descricaoId : undefined"
          @pointerenter="mostrarAoPassar"
          @pointerleave="sairComMouse"
          @click.capture="fixarAoClicar"
        >
          <CircleHelp class="size-4" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        :side-offset="6"
        :collision-padding="12"
        class="w-72 max-w-[calc(100vw-1.5rem)] space-y-1.5 text-sm leading-relaxed"
        @pointerenter="cancelarTimer"
        @pointerleave="sairComMouse"
        @open-auto-focus="!restaurarFoco && $event.preventDefault()"
        @close-auto-focus="!restaurarFoco && $event.preventDefault()"
      >
        <p class="font-medium">{{ titulo }}</p>
        <p :id="descricaoId" class="break-words text-muted-foreground">{{ texto }}</p>
      </PopoverContent>
    </Popover>
  </div>
</template>
