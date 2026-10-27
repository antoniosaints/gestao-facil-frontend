<script setup lang="ts">
import DeleteRecord from '../components/DeleteRecord.vue'
import RecordStatusAction from '../components/RecordStatusAction.vue'
import { deletionScopeKey } from '../application/deletionScope'
import ModalAction from '../components/ModalAction.vue'
import PageFrame from '../components/PageFrame.vue'
import PageHeader from '../components/PageHeader.vue'
import { onMounted, ref, computed, watch, provide } from 'vue'
import { useRoute } from 'vue-router'
import { products, resolveFileUrl, type Row } from '../adapters/domain'
import { money, quantity, dateLabel, errorMessage } from '../application/format'
import {
  promotionalPrice,
  stockStatus,
  stockByUnit,
  detailSearch,
} from '../application/detailRecords'
import Feedback from '../components/Feedback.vue'
import ProductAdditionalInfo from '../components/ProductAdditionalInfo.vue'
import DetailMetrics from '../components/DetailMetrics.vue'
import RecordsTable from '../components/RecordsTable.vue'
import RecordActions from '../components/RecordActions.vue'
import PageControls from '../components/PageControls.vue'
import FormSelect from '../components/FormSelect.vue'
import StatusBadge from '../components/StatusBadge.vue'
import ModalDialog from '../components/ModalDialog.vue'
import { Input } from '@/components/ui/input'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Plus, Pencil, Eye, Package } from 'lucide-vue-next'
provide(deletionScopeKey, new Map())
const route = useRoute(),
  base = ref<Row | null>(null),
  variants = ref<Row[]>([]),
  selected = ref<Row | null>(null),
  loading = ref(false),
  error = ref('')
const search = ref(''),
  filter = ref('TODAS'),
  page = ref(1)
const filtered = computed(() =>
  variants.value.filter(
    (row) =>
      detailSearch(
        `${row.nomeVariante || 'Padrão'} ${row.codigo || ''} ${row.Uid || ''} ${row.id}`,
      ).includes(detailSearch(search.value)) &&
      (filter.value === 'TODAS' ||
        (filter.value === 'BAIXO' ? stockStatus(row) === 'BAIXO' : row.status === filter.value)),
  ),
)
const pages = computed(() => Math.max(1, Math.ceil(filtered.value.length / 10)))
const visible = computed(() => filtered.value.slice((page.value - 1) * 10, page.value * 10))
watch([search, filter], () => (page.value = 1))
watch(pages, (value) => (page.value = Math.min(page.value, value)))
const stock = computed(() => stockByUnit(variants.value))
const prices = computed(() =>
  variants.value.map((row) => promotionalPrice(row) ?? Number(row.preco)).filter(Number.isFinite),
)
const priceRange = computed(() =>
  !prices.value.length
    ? 'Não informado'
    : Math.min(...prices.value) === Math.max(...prices.value)
      ? money(prices.value[0])
      : `${money(Math.min(...prices.value))} – ${money(Math.max(...prices.value))}`,
)
const metrics = computed(() => [
  { label: 'Preço de venda', value: priceRange.value, hint: 'Preços atuais das variantes' },
  {
    label: 'Variantes',
    value: String(variants.value.length),
    hint: `${variants.value.filter((row) => row.status === 'ATIVO').length} ativa(s)`,
  },
  {
    label: 'Estoque controlado',
    value:
      stock.value.length === 1
        ? `${quantity(stock.value[0]!.value)} ${stock.value[0]!.unit}`
        : stock.value.length
          ? 'Por unidade'
          : 'Sem controle',
    hint:
      stock.value.length > 1
        ? stock.value.map((item) => `${quantity(item.value)} ${item.unit}`).join(' · ')
        : 'Somente variantes com controle de estoque',
  },
  {
    label: 'Estoque baixo',
    value: String(variants.value.filter((row) => stockStatus(row) === 'BAIXO').length),
    hint: 'Variante(s) no mínimo ou abaixo',
    tone: variants.value.some((row) => stockStatus(row) === 'BAIXO') ? 'text-destructive' : '',
  },
])
async function load() {
  loading.value = true
  error.value = ''
  try {
    const [record, rows] = await Promise.all([
      products.get(Number(route.params.produtoBaseId)),
      products.variants(Number(route.params.produtoBaseId)),
    ])
    if (!record?.id) throw new Error('Produto não encontrado.')
    if (!Array.isArray(rows)) throw new Error('Não foi possível consultar as variantes do produto.')
    base.value = record
    variants.value = rows
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>
<template>
  <PageFrame>
    <Feedback :loading="loading" :error="error" @retry="load" />
    <template v-if="base">
      <PageHeader
        :title="base.nome"
        :description="base.Uid || `Produto #${base.id}`"
        back="/modofacil/produtos"
        back-label="Produtos"
      >
        <template #actions>
          <ModalAction form="produto-avancado" :params="{ produtoBaseId: base.id }"
            ><Pencil :size="15" />Editar dados fiscais</ModalAction
          >
          <ModalAction
            class="!border-primary !bg-primary !text-primary-foreground"
            form="variante-nova"
            :params="{ produtoBaseId: base.id }"
            ><Plus :size="15" />Criar variante</ModalAction
          >
          <RecordStatusAction kind="product" :record="base" :disabled="loading" @changed="load" />
          <DeleteRecord
            kind="product"
            :record="base"
            :disabled="loading"
            redirect="/modofacil/produtos"
        /></template>
      </PageHeader>
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge :value="base.status" /><span class="text-xs text-muted-foreground">{{
          base.Categoria?.nome || base.categoria || 'Sem categoria'
        }}</span>
      </div>
      <DetailMetrics label="Resumo do produto" :metrics="metrics" />
      <section
        class="rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="product-info-title"
      >
        <h2 id="product-info-title">Informações do produto</h2>
        <dl class="mf-info-grid">
          <div>
            <dt>Categoria</dt>
            <dd>{{ base.Categoria?.nome || base.categoria || 'Não informada' }}</dd>
          </div>
          <div>
            <dt>Identificação</dt>
            <dd>{{ base.Uid || `Produto #${base.id}` }}</dd>
          </div>
          <div v-if="base.createdAt">
            <dt>Criado em</dt>
            <dd>{{ dateLabel(base.createdAt) }}</dd>
          </div>
          <div v-if="base.updatedAt">
            <dt>Última atualização</dt>
            <dd>{{ dateLabel(base.updatedAt) }}</dd>
          </div>
        </dl>
        <div class="mt-4 border-t border-border pt-4">
          <h3 class="mb-1 text-xs font-medium text-muted-foreground">Descrição</h3>
          <p class="!mb-0 whitespace-pre-wrap">
            {{ base.descricao || 'Sem descrição cadastrada.' }}
          </p>
        </div>
      </section>
      <section
        class="min-w-0 space-y-3 rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-labelledby="product-variants-title"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="product-variants-title" class="!mb-0">Variantes do produto</h2>
            <small>{{ filtered.length }} de {{ variants.length }} variante(s)</small>
          </div>
          <div class="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(200px,1fr)_180px]">
            <label
              ><span class="sr-only">Buscar variantes</span
              ><Input
                v-model="search"
                type="search"
                placeholder="Buscar variante, código ou SKU"
                aria-label="Buscar variantes" /></label
            ><label
              ><span class="sr-only">Filtrar variantes</span
              ><FormSelect
                v-model="filter"
                aria-label="Filtrar variantes"
                :options="[
                  { value: 'TODAS', label: 'Todas as variantes' },
                  { value: 'ATIVO', label: 'Ativas' },
                  { value: 'INATIVO', label: 'Inativas' },
                  { value: 'BAIXO', label: 'Estoque baixo' },
                ]"
            /></label>
          </div>
        </div>
        <RecordsTable
          :rows="visible"
          caption="Variantes do produto"
          empty="Nenhuma variante encontrada."
          :columns="[
            { key: 'name', label: 'Variante' },
            { key: 'price', label: 'Preço', right: true },
            { key: 'stock', label: 'Estoque', right: true },
            { key: 'cost', label: 'Custo', right: true },
            { key: 'actions', label: 'Ações', right: true },
          ]"
        >
          <template #name="{ row }"
            ><div class="flex items-center gap-3">
              <img
                v-if="row.imagem"
                class="h-10 w-10 shrink-0 rounded-md border border-border object-contain"
                :src="resolveFileUrl(row.imagem)"
                :alt="`Foto de ${row.nomeVariante || base.nome}`"
              /><Package
                v-else
                :size="20"
                class="shrink-0 text-muted-foreground"
                aria-hidden="true"
              />
              <div class="min-w-0">
                <strong>{{ row.nomeVariante || 'Padrão' }}</strong
                ><small>{{ row.codigo || row.Uid || `Variante #${row.id}` }}</small>
                <div class="mt-1 flex flex-wrap gap-1">
                  <StatusBadge :value="row.status" /><StatusBadge
                    v-if="row.ehPadrao"
                    value="PADRAO"
                    label="Padrão"
                  />
                </div>
              </div></div
          ></template>
          <template #price="{ row }"
            ><strong>{{ money(promotionalPrice(row) ?? row.preco) }}</strong
            ><small v-if="promotionalPrice(row) != null" class="line-through">{{
              money(row.preco)
            }}</small
            ><small v-if="promotionalPrice(row) != null">Em promoção</small></template
          >
          <template #stock="{ row }"
            ><strong>{{ quantity(row.estoque) }} {{ row.unidade }}</strong
            ><small>Mínimo: {{ quantity(row.minimo) }} {{ row.unidade }}</small
            ><small :class="stockStatus(row) === 'BAIXO' ? '!text-destructive' : ''">{{
              stockStatus(row) === 'BAIXO'
                ? 'Estoque baixo'
                : row.controlaEstoque
                  ? 'Controlado'
                  : 'Sem controle'
            }}</small></template
          >
          <template #cost="{ row }">{{ money(row.precoCompra) }}</template>
          <template #actions="{ row }"
            ><div class="flex flex-wrap justify-end gap-2">
              <button
                :aria-label="`Ver dados da variante ${row.nomeVariante || row.id}`"
                @click="selected = row"
              >
                <Eye :size="14" />Ver dados</button
              ><RecordActions :label="`Ações da variante ${row.nomeVariante || row.id}`"
                ><DropdownMenuItem as-child
                  ><ModalAction
                    form="variante"
                    :params="{ produtoBaseId: base.id, varianteId: row.id }"
                    >Editar dados básicos</ModalAction
                  ></DropdownMenuItem
                ><DropdownMenuItem as-child
                  ><ModalAction
                    form="estoque"
                    :params="{ operacao: 'reposicao' }"
                    :query="{ produtoId: row.id }"
                    >Repor estoque</ModalAction
                  ></DropdownMenuItem
                ><DropdownMenuItem as-child
                  ><ModalAction
                    form="estoque"
                    :params="{ operacao: 'descarte' }"
                    :query="{ produtoId: row.id }"
                    >Descartar estoque</ModalAction
                  ></DropdownMenuItem
                ><DropdownMenuItem as-child
                  ><RouterLink
                    :to="{ path: '/modofacil/estoque/movimentacoes', query: { produtoId: row.id } }"
                    >Histórico de estoque</RouterLink
                  ></DropdownMenuItem
                ><DropdownMenuItem as-child
                  ><ModalAction
                    form="variante-avancado"
                    :params="{ produtoBaseId: base.id, varianteId: row.id }"
                    >Editar informações adicionais</ModalAction
                  ></DropdownMenuItem
                ></RecordActions
              >
            </div></template
          >
        </RecordsTable>
        <PageControls
          :loading="loading"
          v-if="filtered.length > 10"
          :page="page"
          :pages="pages"
          :total="filtered.length"
          @change="page = $event"
        />
      </section>
      <section
        class="rounded-lg border border-border bg-card p-4 sm:p-5"
        aria-label="Dados fiscais do produto"
      >
        <ProductAdditionalInfo :base="base" :variant="{}" scope="base" />
      </section>
      <ModalDialog
        v-if="selected"
        :title="selected.nomeVariante || 'Variante padrão'"
        :description="`${base.nome} · Variante #${selected.id}`"
        size="lg"
        @close="selected = null"
      >
        <div class="mb-4 flex flex-wrap items-center gap-3">
          <img
            v-if="selected.imagem"
            class="h-20 w-20 rounded-md border border-border object-contain"
            :src="resolveFileUrl(selected.imagem)"
            :alt="`Foto de ${selected.nomeVariante || base.nome}`"
          /><StatusBadge :value="selected.status" /><strong class="text-xl">{{
            money(promotionalPrice(selected) ?? selected.preco)
          }}</strong>
        </div>
        <dl class="mf-info-grid mb-4">
          <div>
            <dt>Código / SKU</dt>
            <dd>{{ selected.codigo || 'Não informado' }}</dd>
          </div>
          <div>
            <dt>Estoque</dt>
            <dd>{{ quantity(selected.estoque) }} {{ selected.unidade }}</dd>
          </div>
          <div>
            <dt>Estoque mínimo</dt>
            <dd>{{ quantity(selected.minimo) }} {{ selected.unidade }}</dd>
          </div>
          <div>
            <dt>Custo de compra</dt>
            <dd>{{ money(selected.precoCompra) }}</dd>
          </div>
          <div>
            <dt>Preço regular</dt>
            <dd>{{ money(selected.preco) }}</dd>
          </div>
          <div>
            <dt>Preço promocional</dt>
            <dd>
              {{
                selected.precoPromocional != null
                  ? money(selected.precoPromocional)
                  : 'Não informado'
              }}
            </dd>
          </div>
        </dl>
        <p v-if="selected.descricao" class="whitespace-pre-wrap">{{ selected.descricao }}</p>
        <ProductAdditionalInfo :base="base" :variant="selected" scope="variant" expanded />
        <template #footer><button @click="selected = null">Fechar</button></template>
      </ModalDialog>
    </template>
  </PageFrame>
</template>
