<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Gift, Copy, Check, Users, Wallet } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ContaRepository, type MinhaIndicacaoResponse } from '@/repositories/conta-repository'
import { formatCurrencyBR } from '@/utils/formatters'

const toast = useToast()
const loading = ref(false)
const copied = ref(false)
const info = ref<MinhaIndicacaoResponse | null>(null)

const linkIndicacao = computed(() => {
  if (!info.value?.codigo) return ''
  return `${window.location.origin}/site/cadastro?ref=${info.value.codigo}`
})

const recompensaLabel = computed(() => {
  const p = info.value?.programa
  if (!p) return ''
  return p.tipoRecompensa === 'PERCENTUAL'
    ? `${p.valorRecompensa}% do valor pago pelo indicado`
    : `${formatCurrencyBR(p.valorRecompensa)} por indicado`
})

async function load() {
  try {
    loading.value = true
    info.value = await ContaRepository.getMinhaIndicacao()
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar seus dados de indicação')
  } finally {
    loading.value = false
  }
}

async function copiar(texto: string) {
  try {
    await navigator.clipboard.writeText(texto)
    copied.value = true
    toast.success('Link copiado!')
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    toast.error('Não foi possível copiar')
  }
}

onMounted(load)
</script>

<template>
  <Card class="border-border/70 shadow-sm">
    <CardHeader class="pb-4">
      <CardTitle class="flex items-center gap-2 text-lg">
        <Gift class="h-5 w-5 text-primary" /> Indique e ganhe
      </CardTitle>
      <CardDescription>
        Compartilhe seu código. Quando alguém se cadastrar e pagar o 1º mês, você ganha crédito que abate da sua mensalidade.
      </CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <div v-if="loading" class="text-sm text-muted-foreground">Carregando...</div>

      <template v-else-if="info">
        <div v-if="!info.programa.ativo" class="rounded-lg border border-dashed p-3 text-sm text-muted-foreground">
          O programa de indicação está desativado no momento.
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="rounded-xl border border-border/70 bg-background/70 p-4">
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <Wallet class="h-4 w-4" /> Seu crédito acumulado
            </div>
            <div class="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
              {{ formatCurrencyBR(info.creditoIndicacao) }}
            </div>
            <p class="mt-1 text-xs text-muted-foreground">Abate automaticamente da próxima mensalidade.</p>
          </div>
          <div class="rounded-xl border border-border/70 bg-background/70 p-4">
            <div class="flex items-center gap-2 text-xs text-muted-foreground">
              <Users class="h-4 w-4" /> Indicados
            </div>
            <div class="mt-1 text-2xl font-semibold text-foreground">{{ info.indicados.length }}</div>
            <p v-if="info.programa.ativo" class="mt-1 text-xs text-muted-foreground">Recompensa: {{ recompensaLabel }}</p>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-sm font-medium text-foreground">Seu código de indicação</div>
          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-lg border border-border/70 bg-muted/40 px-3 py-1.5 font-mono text-lg tracking-widest">
              {{ info.codigo }}
            </span>
            <Button variant="outline" size="sm" class="gap-2" @click="copiar(linkIndicacao)">
              <Check v-if="copied" class="h-4 w-4 text-emerald-500" />
              <Copy v-else class="h-4 w-4" />
              {{ copied ? 'Copiado' : 'Copiar link' }}
            </Button>
          </div>
          <p class="break-all text-xs text-muted-foreground">{{ linkIndicacao }}</p>
          <p v-if="!info.contaAtiva" class="text-xs text-amber-600 dark:text-amber-400">
            Sua conta precisa estar ativa para que suas indicações gerem recompensa.
          </p>
        </div>

        <div v-if="info.indicados.length" class="space-y-2">
          <div class="text-sm font-medium text-foreground">Suas indicações</div>
          <div class="divide-y divide-border/60 rounded-lg border border-border/70">
            <div v-for="ind in info.indicados" :key="ind.id" class="flex items-center justify-between gap-3 px-3 py-2">
              <span class="truncate text-sm">{{ ind.nome }}</span>
              <Badge :class="ind.recompensado
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'">
                {{ ind.recompensado ? 'Recompensado' : 'Aguardando 1º pagamento' }}
              </Badge>
            </div>
          </div>
        </div>
      </template>
    </CardContent>
  </Card>
</template>
