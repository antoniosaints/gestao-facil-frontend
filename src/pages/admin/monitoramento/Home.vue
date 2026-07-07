<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import {
  Activity,
  Cpu,
  Database,
  HardDrive,
  ListChecks,
  RefreshCcw,
  ServerCog,
  Timer,
} from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ContaRepository, type AdminMonitoramentoResponse } from '@/repositories/conta-repository'

const toast = useToast()
const loading = ref(false)
const dados = ref<AdminMonitoramentoResponse | null>(null)
let timer: ReturnType<typeof setInterval> | null = null

function formatUptime(seconds?: number) {
  if (!seconds) return '-'
  const dias = Math.floor(seconds / 86400)
  const horas = Math.floor((seconds % 86400) / 3600)
  const minutos = Math.floor((seconds % 3600) / 60)
  if (dias > 0) return `${dias}d ${horas}h ${minutos}m`
  if (horas > 0) return `${horas}h ${minutos}m`
  return `${minutos}m`
}

const memoriaUso = computed(() => dados.value?.servidor.memoriaUsoPercent || 0)
const memoriaBarClass = computed(() => {
  if (memoriaUso.value >= 90) return 'bg-rose-500'
  if (memoriaUso.value >= 75) return 'bg-amber-500'
  return 'bg-emerald-500'
})

const cards = computed(() => {
  const servidor = dados.value?.servidor
  return [
    {
      titulo: 'Uptime do servidor',
      valor: formatUptime(servidor?.uptimeSegundos),
      detalhe: `Processo: ${formatUptime(servidor?.processoUptimeSegundos)}`,
      icon: Timer,
      colorClass: 'text-blue-600 bg-blue-500/10',
    },
    {
      titulo: 'CPU',
      valor: `${servidor?.cpus || 0} núcleo(s)`,
      detalhe: `Load: ${servidor?.loadAvg?.join(' / ') || '-'}`,
      icon: Cpu,
      colorClass: 'text-violet-600 bg-violet-500/10',
    },
    {
      titulo: 'Memória',
      valor: `${memoriaUso.value}%`,
      detalhe: `${((servidor?.memoriaTotalMb || 0) - (servidor?.memoriaLivreMb || 0))} MB de ${servidor?.memoriaTotalMb || 0} MB`,
      icon: HardDrive,
      colorClass: 'text-amber-600 bg-amber-500/10',
    },
    {
      titulo: 'Processo (Node)',
      valor: `${servidor?.processoRssMb || 0} MB RSS`,
      detalhe: `Heap: ${servidor?.processoHeapMb || 0} MB • ${servidor?.nodeVersion || '-'}`,
      icon: Activity,
      colorClass: 'text-emerald-600 bg-emerald-500/10',
    },
  ]
})

async function carregar(showErrors = true) {
  try {
    loading.value = true
    dados.value = await ContaRepository.getMonitoramentoAdmin()
  } catch (error: any) {
    console.log(error)
    if (showErrors) {
      toast.error(error.response?.data?.message || 'Erro ao carregar o monitoramento')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  carregar()
  timer = setInterval(() => carregar(false), 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ServerCog class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
          Monitoramento
        </h2>
        <p class="text-sm text-muted-foreground">
          Saúde do servidor, banco de dados, Redis e filas de processamento. Atualiza a cada 30s.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="dados" class="text-xs text-muted-foreground">
          Atualizado {{ new Date(dados.geradoEm).toLocaleTimeString('pt-BR') }}
        </span>
        <Button variant="outline" class="gap-2 bg-card" :disabled="loading" @click="carregar()">
          <RefreshCcw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" />
          Atualizar
        </Button>
      </div>
    </div>

    <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card v-for="item in cards" :key="item.titulo" class="rounded-xl shadow">
        <CardHeader class="py-2">
          <CardTitle class="flex items-center gap-2 text-sm">
            <span class="rounded-md p-2" :class="item.colorClass">
              <component :is="item.icon" class="h-4 w-4" />
            </span>
            {{ item.titulo }}
          </CardTitle>
        </CardHeader>
        <CardContent class="pb-3">
          <p class="text-lg font-semibold">{{ item.valor }}</p>
          <p class="truncate text-xs text-muted-foreground" :title="item.detalhe">{{ item.detalhe }}</p>
        </CardContent>
      </Card>
    </section>

    <section class="rounded-md border bg-card p-4">
      <h3 class="mb-2 text-sm font-semibold">Uso de memória do servidor</h3>
      <div class="h-3 w-full overflow-hidden rounded-full bg-muted">
        <div class="h-full transition-all" :class="memoriaBarClass" :style="{ width: `${memoriaUso}%` }"></div>
      </div>
      <p class="mt-2 text-xs text-muted-foreground">
        {{ dados?.servidor.plataforma || '-' }} • host {{ dados?.servidor.hostname || '-' }}
      </p>
    </section>

    <section class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card class="rounded-xl shadow">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm font-medium">
            <Database class="h-4 w-4" />
            Banco de dados
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Status</span>
            <Badge :variant="dados?.banco.ok ? 'default' : 'destructive'" :class="dados?.banco.ok ? 'bg-emerald-600 text-white' : ''">
              {{ dados?.banco.ok ? 'Online' : 'Falha' }}
            </Badge>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Latência</span>
            <strong class="text-sm">{{ dados?.banco.latencyMs ?? '-' }} ms</strong>
          </div>
          <p v-if="dados?.banco.error" class="text-xs text-rose-500">{{ dados.banco.error }}</p>
        </CardContent>
      </Card>

      <Card class="rounded-xl shadow">
        <CardHeader class="pb-2">
          <CardTitle class="flex items-center gap-2 text-sm font-medium">
            <Activity class="h-4 w-4" />
            Redis
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Status</span>
            <Badge :variant="dados?.redis.ok ? 'default' : 'destructive'" :class="dados?.redis.ok ? 'bg-emerald-600 text-white' : ''">
              {{ dados?.redis.ok ? `Online (${dados?.redis.status})` : 'Falha' }}
            </Badge>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Latência</span>
            <strong class="text-sm">{{ dados?.redis.latencyMs ?? '-' }} ms</strong>
          </div>
          <p v-if="dados?.redis.error" class="text-xs text-rose-500">{{ dados.redis.error }}</p>
        </CardContent>
      </Card>
    </section>

    <section class="rounded-md border bg-card p-4">
      <h3 class="mb-3 flex items-center gap-2 text-sm font-semibold">
        <ListChecks class="h-4 w-4" />
        Filas de processamento
      </h3>
      <div class="overflow-auto">
        <table class="w-full min-w-[640px] text-sm">
          <thead class="border-b text-left text-xs text-muted-foreground">
            <tr>
              <th class="py-2">Fila</th>
              <th class="py-2 text-right">Aguardando</th>
              <th class="py-2 text-right">Processando</th>
              <th class="py-2 text-right">Agendados</th>
              <th class="py-2 text-right">Falhas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="fila in dados?.filas || []" :key="fila.name" class="border-b last:border-b-0">
              <td class="py-2 font-medium">
                {{ fila.name }}
                <Badge v-if="fila.ok === false" variant="destructive" class="ml-2">indisponível</Badge>
              </td>
              <td class="py-2 text-right">{{ fila.waiting ?? '-' }}</td>
              <td class="py-2 text-right">{{ fila.active ?? '-' }}</td>
              <td class="py-2 text-right">{{ fila.delayed ?? '-' }}</td>
              <td class="py-2 text-right" :class="Number(fila.failed) > 0 ? 'font-semibold text-rose-500' : ''">
                {{ fila.failed ?? '-' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
