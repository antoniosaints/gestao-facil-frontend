<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { RouterLink } from 'vue-router'
import { CircleAlert, LoaderCircle, Printer, WifiOff } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useRestaurantPrintAgent } from '@/stores/restaurante/useRestaurantPrintAgent'

const agent = useRestaurantPrintAgent()
const { configured, connectors, lastActivityAt, lastError, processing, qzConnected, serviceEnabled } = storeToRefs(agent)
const activeConnectors = computed(() => connectors.value.filter((item) => item.enabled))

const status = computed(() => {
  if (!configured.value) return { label: 'Configuração incompleta', icon: CircleAlert, dot: 'bg-amber-500' }
  if (lastError.value) return { label: 'Impressão requer atenção', icon: CircleAlert, dot: 'bg-rose-500' }
  if (!qzConnected.value) return { label: 'QZ Tray desconectado', icon: WifiOff, dot: 'bg-amber-500' }
  if (processing.value) return { label: 'Processando impressões', icon: LoaderCircle, dot: 'bg-blue-500' }
  return { label: `${activeConnectors.value.length} impressora(s) ativa(s)`, icon: Printer, dot: 'bg-emerald-500' }
})

const lastActivity = computed(() => lastActivityAt.value
  ? new Date(lastActivityAt.value).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  : 'Aguardando primeira consulta')
</script>

<template>
  <Popover v-if="serviceEnabled">
    <PopoverTrigger as-child>
      <Button variant="ghost" size="icon" aria-label="Status da impressão automática" v-tooltip="status.label" class="relative h-9 w-10 rounded-xl border bg-card hover:bg-card/80">
        <component :is="status.icon" class="h-4 w-4" :class="{ 'animate-spin': processing }" />
        <span class="absolute right-1.5 top-1.5 h-2 w-2 rounded-full ring-2 ring-background" :class="status.dot" />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" class="w-[min(22rem,calc(100vw-2rem))] p-0">
      <div class="border-b px-4 py-3"><div class="flex items-start gap-3"><div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><component :is="status.icon" class="h-4 w-4" :class="{ 'animate-spin': processing }" /></div><div><h3 class="font-semibold">{{ status.label }}</h3><p class="mt-0.5 text-xs text-muted-foreground">Continua funcionando ao navegar pelo GestaoFácil.</p></div></div></div>
      <div class="space-y-3 p-4 text-sm">
        <div><p class="text-xs text-muted-foreground">Impressoras deste computador</p><div class="mt-1 space-y-1"><p v-for="item in activeConnectors.slice(0, 3)" :key="item.localId" class="truncate font-medium">{{ item.stationName || 'Conector' }} · {{ item.printer }}</p><p v-if="activeConnectors.length > 3" class="text-xs text-muted-foreground">+ {{ activeConnectors.length - 3 }} outra(s)</p></div></div>
        <div><p class="text-xs text-muted-foreground">Última atividade</p><p class="tabular-nums">{{ lastActivity }}</p></div>
        <p v-if="lastError" class="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{{ lastError }}</p>
        <p class="text-pretty text-xs text-muted-foreground">Mantenha este navegador autenticado e o QZ Tray aberto. Não é necessário permanecer na tela de impressão.</p>
      </div>
      <div class="border-t p-2"><Button as-child variant="ghost" size="sm" class="w-full"><RouterLink to="/restaurante/impressao">Abrir configurações de impressão</RouterLink></Button></div>
    </PopoverContent>
  </Popover>
</template>
