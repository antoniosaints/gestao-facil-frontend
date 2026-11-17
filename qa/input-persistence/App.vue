<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, RouterView, useRoute } from 'vue-router'
import ClientesModal from '../../src/pages/clientes/modais/ClientesModal.vue'
import ModalProdutos from '../../src/pages/produtos/formulario/ModalProdutos.vue'
import LancamentoModal from '../../src/pages/financeiro/lancamentos/formulario/LancamentoModal.vue'
import ModalParcela from '../../src/pages/financeiro/lancamentos/modais/ModalParcela.vue'
import { useClientesStore } from '../../src/stores/clientes/useClientes'
import { useProdutoStore } from '../../src/stores/produtos/useProduto'
import { useLancamentosStore } from '../../src/stores/lancamentos/useLancamentos'
import { useStorefrontLightTheme } from '../../src/composables/useStorefrontLightTheme'
import http from '../../src/utils/axios'
useStorefrontLightTheme()
const props = defineProps<{ defaults: { accountId: number; categoryId: number } }>()
const clients = useClientesStore(),
  products = useProdutoStore(),
  entries = useLancamentosStore()
const route = useRoute()
const saved = ref<any>(null),
  error = ref('')
async function refresh() {
  try {
    saved.value = (await http.get('/qa/state', { baseURL: '/' })).data
  } catch (e) {
    error.value = String(e)
  }
}
function newEntry() {
  entries.reset()
  entries.form.contasFinanceiroId = props.defaults.accountId
  entries.form.categoriaId = props.defaults.categoryId
  entries.openSave()
}
function editInstallment(row: any) {
  entries.idMutation = row.id
  entries.formParcela = {
    ...entries.formParcela,
    vencimento: new Date(row.vencimento),
    valor: row.valor,
    ignorado: row.ignorado,
    escopo: 'ATUAL',
  }
  entries.openModalParcela = true
}
onMounted(refresh)
</script>
<template>
  <main class="mx-auto max-w-6xl space-y-5 p-5">
    <header class="space-y-2">
      <h1 class="text-2xl font-semibold">Validação de cadastros com backend</h1>
      <p class="text-sm text-muted-foreground">
        Modais reais, API e banco. Conta temporária com dados sintéticos e notificações desativadas.
      </p>
    </header>
    <nav class="flex flex-wrap gap-3 text-sm">
      <RouterLink class="underline" to="/">Modais completos</RouterLink
      ><RouterLink class="underline" to="/modofacil/pessoas/nova"
        >Nova pessoa no Modo Fácil</RouterLink
      ><button class="rounded-md border px-3 py-2" @click="refresh">Conferir banco</button>
    </nav>
    <p v-if="error" role="alert">{{ error }}</p>
    <div v-if="route.path === '/'" class="space-y-4">
      <div class="flex gap-3">
        <button
          class="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          @click="clients.openSave()"
        >
          Novo cliente</button
        ><button
          class="rounded-md bg-primary px-4 py-2 text-primary-foreground"
          @click="products.openSaveProduto()"
        >
          Novo produto</button
        ><button class="rounded-md bg-primary px-4 py-2 text-primary-foreground" @click="newEntry">
          Novo lançamento
        </button>
      </div>
      <template v-if="saved">
        <section class="rounded-lg border p-4">
          <h2 class="font-semibold">Clientes gravados</h2>
          <div
            v-for="row in saved.clients"
            :key="row.id"
            class="my-3 flex flex-wrap items-center gap-3"
          >
            <strong>{{ row.nome }}</strong
            ><code>{{ row.documento }} · {{ row.cep }} · {{ row.telefone }}</code
            ><button class="rounded border px-3 py-1" @click="clients.openUpdate(row.id)">
              Editar cliente {{ row.id }}</button
            ><RouterLink class="underline" :to="`/modofacil/pessoas/${row.id}/editar`"
              >Editar no Modo Fácil {{ row.id }}</RouterLink
            >
          </div>
        </section>
        <section class="rounded-lg border p-4">
          <h2 class="font-semibold">Produtos gravados</h2>
          <div
            v-for="row in saved.products"
            :key="row.id"
            class="my-3 flex flex-wrap items-center gap-3"
          >
            <strong>{{ row.nome }}</strong
            ><code v-for="variant in row.variantes" :key="variant.id"
              >Preço {{ variant.preco }} · Compra {{ variant.precoCompra }} · Estoque
              {{ variant.estoque }} · NCM {{ variant.ncm }}</code
            ><button class="rounded border px-3 py-1" @click="products.openUpdate(row.id)">
              Editar produto {{ row.id }}
            </button>
          </div>
        </section>
        <section class="rounded-lg border p-4">
          <h2 class="font-semibold">Financeiro gravado</h2>
          <div v-for="row in saved.entries" :key="row.id" class="my-3 space-y-2">
            <div class="flex flex-wrap items-center gap-3">
              <strong>{{ row.descricao }}</strong
              ><code
                >Total {{ row.valorTotal }} · Bruto {{ row.valorBruto }} · Desconto
                {{ row.desconto }} · {{ row.tipo }}</code
              ><button class="rounded border px-3 py-1" @click="entries.openUpdate(row.id)">
                Editar lançamento {{ row.id }}
              </button>
            </div>
            <div v-for="installment in row.parcelas" :key="installment.id" class="flex gap-3">
              <code
                >Parcela {{ installment.numero }} · {{ installment.valor }} ·
                {{ installment.vencimento }}</code
              ><button class="rounded border px-3 py-1" @click="editInstallment(installment)">
                Editar parcela {{ installment.id }}
              </button>
            </div>
          </div>
        </section>
      </template>
    </div>
    <div v-else class="modofacil"><RouterView /></div>
    <details v-if="saved">
      <summary>Dados brutos retornados do banco e requisições</summary>
      <pre class="max-h-[500px] overflow-auto rounded-lg border p-4 text-xs">{{
        JSON.stringify(saved, null, 2)
      }}</pre>
    </details>
    <ClientesModal /><ModalProdutos /><LancamentoModal /><ModalParcela />
  </main>
</template>
