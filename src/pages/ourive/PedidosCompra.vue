<template>
  <section class="space-y-6 [&_.text-muted-foreground]:text-foreground/70">
    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold">
          <ShoppingCart class="h-6 w-6 text-primary" />Pedidos de compra
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Materiais que precisam ser comprados para liberar as ordens em produção.
        </p>
      </div>
      <Button variant="outline" :disabled="loading" @click="load">
        <RefreshCw class="mr-2 h-4 w-4" :class="loading && 'animate-spin'" />Atualizar
      </Button>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardContent class="p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pendentes</p>
          <p class="mt-1 text-2xl font-bold">{{ needs.length }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Ordens afetadas
          </p>
          <p class="mt-1 text-2xl font-bold">{{ affectedOrders }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ação</p>
          <p class="mt-1 text-sm font-semibold">Registre a compra para liberar a produção.</p>
        </CardContent>
      </Card>
    </div>

    <div v-if="loading" class="py-12 text-center text-sm text-muted-foreground">
      Carregando pedidos de compra…
    </div>
    <div v-else-if="!needs.length" class="rounded-xl border border-dashed p-10 text-center">
      <ShoppingCart class="mx-auto h-8 w-8 text-muted-foreground" />
      <p class="mt-3 font-semibold">Nenhuma compra pendente</p>
      <p class="mt-1 text-sm text-muted-foreground">
        Todas as ordens possuem material suficiente ou as compras já foram registradas.
      </p>
    </div>
    <div v-else class="grid gap-4 xl:grid-cols-2">
      <Card v-for="need in needs" :key="need.id" class="overflow-hidden">
        <CardContent class="space-y-4 p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p
                class="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300"
              >
                Compra necessária
              </p>
              <h3 class="mt-1 truncate text-lg font-bold">
                {{ need.produto?.nome || `Material #${need.produtoId}` }}
              </h3>
              <p class="mt-1 text-sm text-muted-foreground">
                {{ measure(need.quantidadeNecessaria, need.unidade) }} necessários
              </p>
            </div>
            <Badge variant="outline" class="border-amber-500/50 text-amber-700 dark:text-amber-300">
              Pendente
            </Badge>
          </div>

          <div class="rounded-lg bg-muted/45 p-3 text-sm">
            <p class="font-medium">{{ need.ordem?.codigoRastreio || 'Ordem não disponível' }}</p>
            <p class="mt-1 text-muted-foreground">
              {{ need.ordem?.cliente?.nome || 'Cliente não informado' }}
              <span v-if="need.ordem?.descricao"> · {{ need.ordem.descricao }}</span>
            </p>
          </div>

          <div class="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <label class="grid gap-1 text-xs font-medium text-muted-foreground">
              Quantidade comprada
              <Input
                v-model.number="purchaseFor(need).quantidadeComprada"
                type="number"
                min="0.001"
                step="1"
                :placeholder="`Quantidade (${unitLabel(need.unidade)})`"
              />
            </label>
            <label class="grid gap-1 text-xs font-medium text-muted-foreground">
              Custo por {{ unitLabel(need.unidade) }}
              <Input
                v-model="purchaseFor(need).custoUnitarioReal"
                v-maska="moneyMaskOptions"
                type="text"
                inputmode="decimal"
                placeholder="0,00"
              />
            </label>
            <div class="flex items-end">
              <Button
                class="w-full"
                :disabled="registeringId === need.id"
                @click="fulfillPurchase(need)"
              >
                {{ registeringId === need.id ? 'Registrando…' : 'Registrar compra' }}
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            class="-ml-2 text-muted-foreground"
            @click="router.push({ name: 'ourive-ordem', params: { id: need.ordemOuriveId } })"
          >
            Abrir ordem <ExternalLink class="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ExternalLink, RefreshCw, ShoppingCart } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { OuriveRepository } from '@/repositories/ourive-repository'
import { moneyMaskOptions } from '@/lib/imaska'
import { formatToNumberValue } from '@/utils/formatters'
import { vMaska } from 'maska/vue'

const router = useRouter()
const toast = useToast()
const needs = ref<any[]>([])
const loading = ref(false)
const registeringId = ref<number | null>(null)
const purchaseInputs = reactive<
  Record<number, { quantidadeComprada: number; custoUnitarioReal: number | string }>
>({})
const affectedOrders = computed(() => new Set(needs.value.map((need) => need.ordemOuriveId)).size)
const unitLabel = (unit: string) => (unit === 'PESO' ? 'g' : 'un.')
const measure = (value: unknown, unit: string) =>
  `${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: unit === 'PESO' ? 3 : 0,
  })} ${unitLabel(unit)}`
function purchaseFor(need: any) {
  if (!purchaseInputs[need.id]) {
    purchaseInputs[need.id] = {
      quantidadeComprada: Number(need.quantidadeNecessaria || 0),
      custoUnitarioReal: 0,
    }
  }
  return purchaseInputs[need.id]
}
async function load() {
  loading.value = true
  try {
    needs.value = await OuriveRepository.necessidadesCompra()
  } catch (error: any) {
    toast.error(
      error?.response?.data?.error?.message || 'Não foi possível carregar os pedidos de compra.',
    )
  } finally {
    loading.value = false
  }
}
async function fulfillPurchase(need: any) {
  const purchase = purchaseFor(need)
  if (!Number(purchase.quantidadeComprada)) return toast.info('Informe a quantidade comprada.')
  registeringId.value = need.id
  try {
    await OuriveRepository.atenderNecessidadeCompra(need.id, {
      quantidadeComprada: Number(purchase.quantidadeComprada),
      custoUnitarioReal: formatToNumberValue(purchase.custoUnitarioReal),
    })
    toast.success('Compra registrada e estoque atualizado.')
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível registrar a compra.')
  } finally {
    registeringId.value = null
  }
}
onMounted(load)
</script>
