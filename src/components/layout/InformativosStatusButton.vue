<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Bell, CheckCircle2, ChevronDown, CircleAlert, Info, TriangleAlert, X } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useInformativosStore } from '@/stores/informativos/useInformativos'
import { useSocketEvent } from '@/composables/useSocketEvent'
import type { InformativoSistema } from '@/repositories/informativo-repository'

const props = withDefaults(defineProps<{ sidebar?: boolean }>(), { sidebar: false })
const store = useInformativosStore()
const open = ref(false)
const mostrarDispensados = ref(false)
let refreshTimer: ReturnType<typeof setInterval> | null = null

const itens = computed(() => mostrarDispensados.value ? store.items : store.visiveis)
const piorSeveridade = computed(() => {
  if (store.visiveis.some((item) => item.severidade === 'INDISPONIBILIDADE')) return 'INDISPONIBILIDADE'
  if (store.visiveis.some((item) => item.severidade === 'ATENCAO')) return 'ATENCAO'
  return 'INFO'
})

const indicadorClass = computed(() => ({
  INFO: 'bg-blue-500',
  ATENCAO: 'bg-amber-500',
  INDISPONIBILIDADE: 'bg-rose-500',
}[piorSeveridade.value]))

function severityClass(item: InformativoSistema) {
  if (item.status === 'RESOLVIDO') return 'border-emerald-500/30 bg-emerald-500/5'
  if (item.severidade === 'INDISPONIBILIDADE') return 'border-rose-500/30 bg-rose-500/5'
  if (item.severidade === 'ATENCAO') return 'border-amber-500/30 bg-amber-500/5'
  return 'border-blue-500/30 bg-blue-500/5'
}

function itemIcon(item: InformativoSistema) {
  if (item.status === 'RESOLVIDO') return CheckCircle2
  if (item.severidade === 'INDISPONIBILIDADE') return CircleAlert
  if (item.severidade === 'ATENCAO') return TriangleAlert
  return Info
}

function formatDate(value?: string | null) {
  if (!value) return ''
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

async function onOpenChange(value: boolean) {
  open.value = value
  if (value) await store.marcarTodosComoLidos()
}

onMounted(() => {
  if (!props.sidebar) {
    store.carregar()
    refreshTimer = setInterval(() => store.carregar(true), 5 * 60 * 1000)
  }
})
onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
})
if (!props.sidebar) {
  useSocketEvent('informativos:updated', () => store.carregar(true))
}
</script>

<template>
  <Popover :open="open" @update:open="onOpenChange">
    <PopoverTrigger as-child>
      <Button v-if="!props.sidebar" variant="ghost" size="icon" aria-label="Status dos serviços"
        class="relative h-9 w-10 rounded-xl border bg-card hover:bg-card/80">
        <Bell class="h-4 w-4" />
        <span v-if="store.naoLidos" class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-background"
          :class="indicadorClass"></span>
      </Button>
      <button v-else type="button"
        class="flex w-full items-center justify-between rounded-xl border border-white/15 bg-black/10 px-3 py-2 text-left text-sm text-gray-200 transition hover:bg-black/20">
        <span class="flex items-center gap-2"><Bell class="h-4 w-4" /> Status dos serviços</span>
        <span v-if="store.naoLidos" class="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {{ store.naoLidos }}
        </span>
      </button>
    </PopoverTrigger>
    <PopoverContent align="end" class="w-[min(24rem,calc(100vw-2rem))] p-0">
      <div class="border-b px-4 py-2">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="font-semibold">Status dos serviços</h3>
            <p class="text-xs text-muted-foreground">Informações operacionais.</p>
          </div>
          <span v-if="!store.visiveis.length" class="rounded-full bg-emerald-500/10 px-2 py-1 text-xs text-emerald-600">Operacional</span>
        </div>
      </div>
      <div class="max-h-[26rem] space-y-2 overflow-y-auto p-3">
        <div v-if="store.loading && !store.loaded" class="py-8 text-center text-sm text-muted-foreground">Carregando...</div>
        <div v-else-if="!itens.length" class="py-8 text-center text-sm text-muted-foreground">
          Nenhum informativo ativo no momento.
        </div>
        <article v-for="item in itens" :key="item.id" class="rounded-md border p-3" :class="severityClass(item)">
          <div class="flex items-start gap-2.5">
            <component :is="itemIcon(item)" class="mt-0.5 h-4 w-4 shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <div>
                  <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">{{ item.integracao }}</p>
                  <h4 class="text-sm font-semibold leading-snug">{{ item.titulo }}</h4>
                </div>
                <button v-if="!item.dispensado" type="button" aria-label="Dispensar informativo"
                  class="rounded p-1 text-muted-foreground hover:bg-background/70 hover:text-foreground" @click="store.dispensar(item)">
                  <X class="h-3.5 w-3.5" />
                </button>
              </div>
              <p class="mt-1 whitespace-pre-line text-xs leading-relaxed text-muted-foreground">{{ item.mensagem }}</p>
              <div class="mt-2 flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                <span>{{ item.situacao === 'RESOLVIDO' ? 'Resolvido' : item.situacao === 'MONITORANDO' ? 'Monitorando' : 'Investigando' }}</span>
                <span>Atualizado {{ formatDate(item.updatedAt) }}</span>
              </div>
            </div>
          </div>
        </article>
      </div>
      <button v-if="store.dispensados.length" type="button"
        class="flex w-full items-center justify-center gap-1 border-t px-3 py-2 text-xs text-muted-foreground hover:bg-muted/40"
        @click="mostrarDispensados = !mostrarDispensados">
        {{ mostrarDispensados ? 'Ocultar dispensados' : `Mostrar dispensados (${store.dispensados.length})` }}
        <ChevronDown class="h-3.5 w-3.5" :class="mostrarDispensados ? 'rotate-180' : ''" />
      </button>
    </PopoverContent>
  </Popover>
</template>
