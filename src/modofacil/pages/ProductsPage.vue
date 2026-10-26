<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'

import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Plus, Package, Boxes, ChevronDown, ArrowUpRight } from 'lucide-vue-next'
import { usePage } from '../application/usePage'
import { money, quantity } from '../application/format'
import { resolveFileUrl } from '../adapters/domain'
import ListLoading from '../components/ListLoading.vue'
import Feedback from '../components/Feedback.vue'
import PageControls from '../components/PageControls.vue'
const route = useRoute()
const stockFilter = ref(String(route.query.estoqueBaixo || ''))
const status = ref(String(route.query.status || ''))
const failedImages = ref(new Set<number>())
const { rows, total, pages, page, search, loading, error, load } = usePage(
  () => '/modofacil/produtos',
  () => ({ estoqueBaixo: stockFilter.value || undefined, status: status.value || undefined }),
)
function imageFailed(id: number) {
  failedImages.value.add(id)
}
onMounted(() => load())
</script>
<template>
  <section class="min-w-0 rounded-[8px] border border-border bg-card p-4 sm:p-5">
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1>Produtos</h1>
        <p class="!mb-0 text-muted-foreground">Visualize e gerencie seus produtos.</p>
      </div>
      <ModalAction
        class="mf-button !border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
        form="produto-novo"
        ><Plus :size="16" />Novo produto</ModalAction
      >
    </div>
    <form class="mb-4 flex flex-wrap items-end gap-3" @submit.prevent="load(true)">
      <label class="relative min-w-0 basis-full sm:flex-1 sm:basis-0"
        ><span class="sr-only">Buscar produto</span
        ><Search
          :size="16"
          class="pointer-events-none absolute left-3 top-3 text-muted-foreground"
          aria-hidden="true" /><Input
          v-model="search"
          type="search"
          placeholder="Buscar por nome, código ou categoria..."
          class="!mt-0 !pl-9"
      /></label>
      <label class="min-w-0 flex-1 sm:max-w-44"
        ><span class="sr-only">Estoque</span
        ><select v-model="stockFilter" class="!mt-0">
          <option value="">Todo o estoque</option>
          <option value="SIM">Estoque baixo</option>
          <option value="NAO">Acima do mínimo</option>
        </select></label
      >
      <label class="min-w-0 flex-1 sm:max-w-40"
        ><span class="sr-only">Status</span
        ><select v-model="status" class="!mt-0">
          <option value="">Todos os status</option>
          <option value="ATIVO">Ativo</option>
          <option value="INATIVO">Inativo</option>
        </select></label
      >
      <button :disabled="loading">Buscar</button>
    </form>
    <details class="mb-4 text-xs">
      <summary class="flex w-fit items-center gap-2 text-muted-foreground">
        <Boxes :size="15" />Operações de estoque e categorias<ChevronDown :size="13" />
      </summary>
      <nav
        class="mt-3 flex flex-wrap gap-x-5 gap-y-3 rounded-[6px] bg-muted/50 p-3"
        aria-label="Operações de produtos"
      >
        <ModalAction form="estoque-lote">Repor vários produtos</ModalAction
        ><ModalAction form="estoque" :params="{ operacao: 'reposicao' }">Repor estoque</ModalAction
        ><ModalAction form="estoque" :params="{ operacao: 'descarte' }"
          >Registrar descarte</ModalAction
        ><RouterLink to="/modofacil/estoque/movimentacoes">Movimentações</RouterLink
        ><RouterLink to="/modofacil/produtos/categorias">Categorias</RouterLink>
      </nav>
    </details>
    <Feedback :error="error" @retry="load()" />
    <ListLoading v-if="loading && !rows.length" cards label="Carregando produtos…" />
    <div class="relative" :aria-busy="loading">
      <div
        v-if="loading && rows.length"
        role="status"
        aria-label="Atualizando produtos…"
        class="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-blue-500 motion-safe:animate-pulse"
      >
        <span class="sr-only">Atualizando produtos…</span>
      </div>
      <ul
        v-if="rows.length"
        class="grid grid-cols-1 gap-4 min-[360px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <li
          v-for="row in rows"
          :key="row.id"
          class="group relative min-w-0 rounded-[7px] border border-border bg-card transition-shadow hover:border-blue-500/30 hover:shadow-md"
        >
          <RouterLink
            :to="`/modofacil/produtos/${row.id}`"
            class="flex h-full flex-col p-3 !text-foreground"
          >
            <div class="mb-3 flex h-32 items-center justify-center rounded-[5px] bg-muted/70 p-3">
              <img
                v-if="row.imagem && !failedImages.has(row.id)"
                :src="resolveFileUrl(row.imagem)"
                :alt="row.nome"
                class="h-full w-full object-contain"
                loading="lazy"
                @error="imageFailed(row.id)"
              /><Package
                v-else
                :size="48"
                :stroke-width="1.2"
                class="text-slate-300"
                aria-hidden="true"
              />
            </div>
            <h2
              class="!mb-1 !text-sm !font-semibold leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-300"
            >
              {{ row.nome }}
            </h2>
            <span class="text-[11px] text-muted-foreground"
              >Cód: {{ row.codigo || row.Uid || String(row.id).padStart(3, '0') }}</span
            >
            <span class="mb-2 truncate text-[11px] text-muted-foreground"
              >{{ row.categoria || 'Sem categoria' }} · {{ row.totalVariantes }} variante(s)</span
            >
            <strong class="mt-auto text-base">{{ money(row.preco) }}</strong>
            <span
              class="mt-1 inline-flex w-fit rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium"
              :class="
                stockFilter === 'SIM' || Number(row.estoqueTotal) <= 0
                  ? 'bg-orange-500/15 text-orange-600 dark:text-orange-300'
                  : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              "
              >{{ quantity(row.estoqueTotal) }} em estoque{{
                stockFilter === 'SIM' ? ' · Estoque baixo' : ''
              }}</span
            >
            <ArrowUpRight
              :size="14"
              class="absolute right-3 top-3 text-muted-foreground group-hover:text-blue-600 dark:group-hover:text-blue-300"
              aria-hidden="true"
            />
          </RouterLink>
        </li>
      </ul>
    </div>
    <div
      v-if="!loading && !error && !rows.length"
      class="flex flex-col items-center gap-2 rounded-[6px] border border-dashed border-border py-14 text-center text-muted-foreground"
    >
      <Package :size="36" :stroke-width="1.2" />
      <p class="!mb-0 text-muted-foreground">Nenhum produto encontrado.</p>
      <span class="text-xs">Cadastre seu primeiro produto ou ajuste a busca.</span>
    </div>
    <PageControls
      :page="page"
      :pages="pages"
      :total="total"
      :loading="loading"
      @change="
        ($event) => {
          page = $event
          load()
        }
      "
    />
  </section>
</template>
