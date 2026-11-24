<script setup lang="ts">
import EntityLink from '@/components/navigation/EntityLink.vue'
import DeleteRecord from '../components/DeleteRecord.vue'
import RecordStatusAction from '../components/RecordStatusAction.vue'
import FormSelect from '../components/FormSelect.vue'
import ModalAction from '../components/ModalAction.vue'
import PageHeader from '../components/PageHeader.vue'
import { Input } from '@/components/ui/input'

import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Search, Plus, Boxes, ChevronDown, Eye, Pencil } from 'lucide-vue-next'
import { usePage } from '../application/usePage'
import { money, quantity } from '../application/format'
import RecordsTable from '../components/RecordsTable.vue'
import ProductPhoto from '../components/ProductPhoto.vue'
import StatusBadge from '../components/StatusBadge.vue'
import Feedback from '../components/Feedback.vue'
import PageControls from '../components/PageControls.vue'
const route = useRoute()
const stockFilter = ref(String(route.query.estoqueBaixo || ''))
const status = ref(String(route.query.status || ''))
const { rows, total, pages, page, search, loading, error, load, reloadAfterDelete } = usePage(
  () => '/modofacil/produtos',
  () => ({ estoqueBaixo: stockFilter.value || undefined, status: status.value || undefined }),
)
onMounted(() => load())
</script>
<template>
  <section class="min-w-0 rounded-[8px] border border-border bg-card p-4 sm:p-5">
    <PageHeader class="mb-5" title="Produtos" description="Visualize e gerencie seus produtos.">
      <template #actions>
        <ModalAction
          class="mf-button !border-blue-600 !bg-blue-600 !text-white hover:!bg-blue-700"
          form="produto-novo"
          ><Plus :size="16" />Novo produto</ModalAction
        >
      </template>
    </PageHeader>
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
        ><FormSelect
          v-model="stockFilter"
          class="!mt-0"
          :options="[
            { value: '', label: 'Todo o estoque' },
            { value: 'SIM', label: 'Estoque baixo' },
            { value: 'NAO', label: 'Acima do mínimo' },
          ]"
      /></label>
      <label class="min-w-0 flex-1 sm:max-w-40"
        ><span class="sr-only">Status</span
        ><FormSelect
          v-model="status"
          class="!mt-0"
          :options="[
            { value: '', label: 'Todos os status' },
            { value: 'ATIVO', label: 'Ativo' },
            { value: 'INATIVO', label: 'Inativo' },
          ]"
      /></label>
      <button :disabled="loading">Buscar</button>
    </form>
    <details class="mb-4 text-xs">
      <summary class="flex w-fit items-center gap-2 text-muted-foreground">
        <Boxes :size="15" />Operações de estoque e categorias<ChevronDown :size="13" />
      </summary>
      <nav
        class="mf-actions mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[6px] bg-muted/50 p-3"
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
    <RecordsTable
      class="[&_td]:!py-2 [&_td]:!leading-tight [&_th:first-child]:w-14 [&_td:first-child]:w-14 [&_td_button[data-product-photo]]:!p-0 [&_td_a[data-product-name]]:!min-h-0 [&_td_a[data-product-name]]:!py-0"
      :rows="rows"
      :loading="loading"
      :failed="!!error"
      caption="Produtos cadastrados"
      empty="Nenhum produto encontrado."
      mobile-layout="table"
      :min-width="900"
      :columns="[
        { key: 'photo', label: 'Foto' },
        { key: 'name', label: 'Produto' },
        { key: 'category', label: 'Categoria' },
        { key: 'variants', label: 'Variantes', right: true },
        { key: 'price', label: 'Preço padrão', right: true },
        { key: 'stock', label: 'Estoque total', right: true },
        { key: 'status', label: 'Situação' },
        { key: 'actions', label: 'Ações', right: true },
      ]"
    >
      <template #photo="{ row }"
        ><ProductPhoto :image="row.imagem" :name="row.nome || `Produto #${row.id}`"
      /></template>
      <template #name="{ row }"
        ><RouterLink
          :to="`/modofacil/produtos/${row.id}`"
          class="!block w-52 truncate !min-h-0 !p-0 !text-foreground hover:!text-primary"
          data-product-name
          :title="row.nome"
          ><strong>{{ row.nome }}</strong></RouterLink
        ><small>{{ row.codigo || row.Uid || `Produto #${row.id}` }}</small></template
      >
      <template #category="{ row }"><EntityLink kind="categoriaProduto" :record-id="row.categoriaId" :label="row.categoria || 'Sem categoria'" /></template>
      <template #variants="{ row }">{{ row.totalVariantes ?? '—' }}</template>
      <template #price="{ row }"
        ><strong class="whitespace-nowrap">{{
          row.totalVariantes === 0 ? '—' : money(row.preco)
        }}</strong></template
      >
      <template #stock="{ row }"
        ><span
          class="whitespace-nowrap"
          :class="
            stockFilter === 'SIM' || Number(row.estoqueTotal) <= 0
              ? 'text-orange-600 dark:text-orange-300'
              : ''
          "
          >{{ row.totalVariantes === 0 ? '—' : quantity(row.estoqueTotal) }}</span
        ><small v-if="stockFilter === 'SIM'">Estoque baixo</small></template
      >
      <template #status="{ row }"><StatusBadge :value="row.status" /></template>
      <template #actions="{ row }"
        ><div class="flex items-center justify-end gap-1.5">
          <RouterLink
            :to="`/modofacil/produtos/${row.id}`"
            class="mf-button"
            :aria-label="`Ver detalhes de ${row.nome}`"
            title="Ver detalhes"
            ><Eye :size="14"
          /></RouterLink>
          <ModalAction
            v-if="row.variantePadraoId"
            form="produto-editar"
            :params="{ produtoBaseId: row.id }"
            :disabled="loading"
            :aria-label="`Editar produto ${row.nome}`"
            title="Editar produto"
            ><Pencil :size="14"
          /></ModalAction>
          <RecordStatusAction
            kind="product"
            :record="row"
            :disabled="loading"
            icon-only
            @changed="reloadAfterDelete"
          />
          <DeleteRecord
            kind="product"
            :record="row"
            :disabled="loading"
            icon-only
            @deleted="reloadAfterDelete"
          /></div
      ></template>
    </RecordsTable>
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
