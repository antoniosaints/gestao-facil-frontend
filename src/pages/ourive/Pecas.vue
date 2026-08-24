<template>
  <section class="space-y-6">
    <div class="mb-4 flex flex-col justify-between gap-2 md:flex-row">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Gem class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />Peças
        </h2>
        <p class="text-sm text-muted-foreground">
          Consulte a galeria e o rastreio das peças em custódia.
        </p>
      </div>
      <Button variant="outline" :disabled="loading" @click="load"
        ><RefreshCw class="mr-2 h-4 w-4" :class="{ 'animate-spin': loading }" />Atualizar</Button
      >
    </div>
    <div class="relative max-w-xl">
      <Search
        class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
      /><Input
        v-model="search"
        class="pl-9"
        placeholder="Buscar por peça, código, cliente ou metal"
      />
    </div>
    <p v-if="!loading" class="text-sm text-muted-foreground">
      {{ filteredPieces.length }}
      {{ filteredPieces.length === 1 ? 'peça encontrada' : 'peças encontradas' }}
    </p>
    <div v-if="loading" class="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <div v-for="index in 6" :key="index" class="overflow-hidden rounded-xl border bg-card">
        <div class="aspect-square animate-pulse bg-muted" />
        <div class="space-y-2 p-3">
          <div class="h-4 w-2/3 animate-pulse rounded bg-muted" />
          <div class="h-3 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
    <div v-else-if="filteredPieces.length" class="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
      <RouterLink
        v-for="piece in filteredPieces"
        :key="piece.id"
        :to="{ name: 'ourive-ordem', params: { id: piece.orderId } }"
        class="group overflow-hidden rounded-xl border bg-card transition hover:border-primary/60 hover:shadow-sm"
        ><div
          class="relative flex aspect-square items-center justify-center overflow-hidden bg-muted"
        >
          <img
            v-if="piece.foto"
            :src="piece.foto"
            :alt="piece.descricao"
            class="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          /><ImageOff v-else class="h-10 w-10 text-muted-foreground" /><span
            class="absolute bottom-2 left-2 rounded-md bg-background/90 px-2 py-1 text-xs font-medium shadow-sm"
            >{{ piece.codigoRastreio }}</span
          >
        </div>
        <div class="p-3">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="truncate font-semibold">{{ piece.descricao }}</p>
              <p class="mt-0.5 truncate text-xs text-muted-foreground">{{ piece.cliente }}</p>
            </div>
            <ArrowUpRight
              class="h-4 w-4 shrink-0 text-muted-foreground transition group-hover:text-primary"
            />
          </div>
          <p class="mt-2 truncate text-xs text-muted-foreground">
            {{ piece.metal || 'Metal não informado' }}
          </p>
        </div></RouterLink
      >
    </div>
    <Empty v-else
      ><EmptyHeader
        ><EmptyMedia variant="icon"><Gem /></EmptyMedia
        ><EmptyTitle>{{
          pieces.length ? 'Nenhuma peça encontrada' : 'Nenhuma peça cadastrada'
        }}</EmptyTitle
        ><EmptyDescription>{{
          pieces.length
            ? 'Tente buscar por outro termo.'
            : 'As peças recebidas nas ordens aparecerão aqui.'
        }}</EmptyDescription></EmptyHeader
      ><Button v-if="search" variant="outline" @click="search = ''">Limpar busca</Button></Empty
    >
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ArrowUpRight, Gem, ImageOff, RefreshCw, Search } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Input } from '@/components/ui/input'
import { OuriveRepository } from '@/repositories/ourive-repository'
const toast = useToast()
const loading = ref(true)
const search = ref('')
const pieces = ref<any[]>([])
const filteredPieces = computed(() => {
  const term = search.value.trim().toLowerCase()
  return !term
    ? pieces.value
    : pieces.value.filter((piece) =>
        `${piece.descricao} ${piece.codigoRastreio} ${piece.cliente} ${piece.metal || ''}`
          .toLowerCase()
          .includes(term),
      )
})
async function load() {
  loading.value = true
  try {
    const orders = (await OuriveRepository.ordens()).items
    const details = await Promise.all(orders.map((item: any) => OuriveRepository.ordem(item.id)))
    pieces.value = details.flatMap((order: any) =>
      order.pecas.map((piece: any) => ({
        ...piece,
        orderId: order.id,
        cliente: order.ordemServico?.Cliente?.nome || 'Cliente não informado',
        foto: piece.fotos?.[0]?.url,
      })),
    )
  } catch {
    toast.error('Não foi possível carregar as peças.')
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
