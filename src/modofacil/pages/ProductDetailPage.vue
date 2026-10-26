<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'
import PageFrame from '../components/PageFrame.vue'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { products, resolveFileUrl, type Row } from '../adapters/domain'
import { money, quantity, errorMessage } from '../application/format'
import Feedback from '../components/Feedback.vue'
import ProductAdditionalInfo from '../components/ProductAdditionalInfo.vue'
const route = useRoute(),
  base = ref<Row | null>(null),
  variants = ref<Row[]>([]),
  loading = ref(false),
  error = ref('')
async function load() {
  loading.value = true
  error.value = ''
  try {
    ;[base.value, variants.value] = await Promise.all([
      products.get(Number(route.params.produtoBaseId)),
      products.variants(Number(route.params.produtoBaseId)),
    ])
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
    <RouterLink to="/modofacil/produtos">← Produtos</RouterLink
    ><Feedback :loading="loading" :error="error" @retry="load" /><template v-if="base"
      ><div class="mf-head mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1>{{ base.nome }}</h1>
          <p>
            {{ base.descricao || 'Sem descrição' }} ·
            {{ base.Categoria?.nome || base.categoria || 'Sem categoria' }}
          </p>
        </div>
      </div>
      <div class="mf-actions my-4 flex flex-wrap items-end gap-3">
        <ModalAction
          class="mf-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/90 no-underline transition-colors hover:bg-muted/50 mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          form="variante-nova"
          :params="{ produtoBaseId: base.id }"
          >Criar variante</ModalAction
        ><ModalAction form="produto-avancado" :params="{ produtoBaseId: base.id }"
          >Editar informações fiscais comuns</ModalAction
        >
      </div>
      <h2 class="!mb-0">Variantes do produto</h2>
      <ul class="mf-list m-0 grid min-w-0 list-none gap-4 p-0 xl:grid-cols-2">
        <li
          v-for="variant in variants"
          :key="variant.id"
          class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5"
        >
          <div class="mf-head mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2>{{ variant.nomeVariante || 'Padrão' }}</h2>
              <p>
                {{ money(variant.preco) }}
                <span v-if="variant.precoPromocional">
                  · Promoção {{ money(variant.precoPromocional) }}</span
                >
              </p>
            </div>
            <img
              v-if="variant.imagem"
              class="mf-photo h-20 w-20 rounded-[6px] object-contain"
              :src="resolveFileUrl(variant.imagem)"
              alt="Foto do produto"
            />
          </div>
          <dl>
            <dt>Estoque</dt>
            <dd>
              {{ quantity(variant.estoque) }} {{ variant.unidade }} ·
              {{ variant.controlaEstoque ? 'Controlado' : 'Não controlado' }}
            </dd>
            <dt>Mínimo</dt>
            <dd>{{ quantity(variant.minimo) }}</dd>
            <dt>Custo</dt>
            <dd>{{ money(variant.precoCompra) }}</dd>
            <dt>Código / SKU</dt>
            <dd>{{ variant.codigo || '—' }}</dd>
            <dt>Identificação</dt>
            <dd>Base #{{ base.id }} · Variante #{{ variant.id }}</dd>
          </dl>
          <div class="mf-actions my-4 flex flex-wrap items-end gap-3">
            <ModalAction
              class="mf-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/90 no-underline transition-colors hover:bg-muted/50"
              form="variante"
              :params="{ produtoBaseId: base.id, varianteId: variant.id }"
              >Editar dados básicos</ModalAction
            ><ModalAction
              form="estoque"
              :params="{ operacao: 'reposicao' }"
              :query="{ produtoId: variant.id }"
              >Repor</ModalAction
            ><ModalAction
              form="estoque"
              :params="{ operacao: 'descarte' }"
              :query="{ produtoId: variant.id }"
              >Descartar</ModalAction
            ><RouterLink
              :to="{ path: '/modofacil/estoque/movimentacoes', query: { produtoId: variant.id } }"
              >Histórico</RouterLink
            >
          </div>
          <ProductAdditionalInfo :base="base" :variant="variant" /><ModalAction
            form="variante-avancado"
            :params="{ produtoBaseId: base.id, varianteId: variant.id }"
            >Editar informações adicionais desta variante</ModalAction
          >
        </li>
      </ul></template
    >
  </PageFrame>
</template>
