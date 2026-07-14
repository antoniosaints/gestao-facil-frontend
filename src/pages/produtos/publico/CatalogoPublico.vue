<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { HashGenerator } from '@/utils/generators'
import { resolveFileUrl } from '@/utils/fileUrl'
import { formatCurrencyBR } from '@/utils/formatters'
import { ProdutoRepository, type CatalogoProduto, type CatalogoPublico } from '@/repositories/produto-repository'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LoaderCircle, Package, Search, ShoppingBag, ShieldX, MessageCircle } from 'lucide-vue-next'

const route = useRoute()

const loading = ref(true)
const invalid = ref(false)
const catalogo = ref<CatalogoPublico | null>(null)

const search = ref('')
const categoriaAtiva = ref<string | null>(null)

// Lightbox / detalhe do produto
const produtoSelecionado = ref<CatalogoProduto | null>(null)
const imagemPreview = ref('')

const nomeLoja = computed(() => catalogo.value?.conta.nomeFantasia || catalogo.value?.conta.nome || 'Catálogo')
const logo = computed(() => (catalogo.value?.conta.profile ? resolveFileUrl(catalogo.value.conta.profile) : ''))

// Loja Virtual: quando o módulo está ativo, a vitrine vira loja personalizada (cores, header,
// banner). Sem o módulo, permanece o catálogo padrão (tokens do tema).
const cfg = computed(() => (catalogo.value?.loja?.ativa ? catalogo.value?.loja?.config ?? null : null))
const isLoja = computed(() => Boolean(cfg.value))
const headerEstilo = computed(() => cfg.value?.headerEstilo ?? 'padrao')
const bannerSrc = computed(() => (cfg.value?.bannerUrl ? resolveFileUrl(cfg.value.bannerUrl) : ''))
const mostrarPrecos = computed(() => (isLoja.value ? cfg.value!.mostrarPrecos : true))
const usarWhatsapp = computed(() => (isLoja.value ? cfg.value!.pedidoWhatsapp : true))
const mensagemBoasVindas = computed(() => cfg.value?.mensagemBoasVindas || '')
const rotulo = computed(() => (isLoja.value ? 'Loja online' : 'Catálogo online'))

// Variáveis de marca para estilização inline quando é loja (senão usa os tokens do tema).
const brandVars = computed(() =>
  isLoja.value ? { '--brand': cfg.value!.corPrimaria, '--brand2': cfg.value!.corSecundaria } : {},
)
const precoStyle = computed(() => (isLoja.value ? { color: 'var(--brand)' } : {}))

const produtosFiltrados = computed(() => {
  const termo = search.value.trim().toLowerCase()
  return (catalogo.value?.produtos ?? []).filter((produto) => {
    const okCategoria = !categoriaAtiva.value || produto.categoria === categoriaAtiva.value
    const okBusca =
      !termo ||
      produto.nome.toLowerCase().includes(termo) ||
      (produto.categoria || '').toLowerCase().includes(termo)
    return okCategoria && okBusca
  })
})

function precoLabel(produto: CatalogoProduto) {
  if (produto.precoMin === produto.precoMax) return formatCurrencyBR(produto.precoMin)
  return `A partir de ${formatCurrencyBR(produto.precoMin)}`
}

const whatsappUrl = computed(() => {
  const tel = catalogo.value?.conta.telefone
  if (!tel) return ''
  let digits = String(tel).replace(/\D/g, '')
  if (!digits) return ''
  if (!digits.startsWith('55') && digits.length <= 11) digits = `55${digits}`
  const nome = produtoSelecionado.value?.nome
  const texto = nome ? `Olá! Tenho interesse no produto: ${nome}` : 'Olá! Vim pelo catálogo.'
  return `https://wa.me/${digits}?text=${encodeURIComponent(texto)}`
})

function abrirProduto(produto: CatalogoProduto) {
  produtoSelecionado.value = produto
}

async function carregar() {
  loading.value = true
  invalid.value = false
  try {
    const decoded = HashGenerator.decode(String(route.params.contaId))[0]
    const contaId = Number(decoded)
    if (!contaId || Number.isNaN(contaId)) {
      invalid.value = true
      return
    }
    catalogo.value = await ProdutoRepository.getCatalogoPublico(contaId)
    document.title = `${nomeLoja.value} · ${rotulo.value}`
  } catch {
    invalid.value = true
  } finally {
    loading.value = false
  }
}

onMounted(carregar)
</script>

<template>
  <div class="min-h-screen bg-muted/30 text-foreground" :style="brandVars">
    <!-- Carregando -->
    <div v-if="loading" class="flex min-h-screen flex-col items-center justify-center gap-3 text-muted-foreground">
      <ShoppingBag class="h-12 w-12 animate-pulse text-primary" />
      <p class="flex items-center gap-2 text-sm"><LoaderCircle class="h-4 w-4 animate-spin" /> Carregando catálogo...</p>
    </div>

    <!-- Link inválido -->
    <div v-else-if="invalid" class="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <ShieldX class="h-14 w-14 text-destructive" />
      <h1 class="text-2xl font-bold text-destructive">Catálogo indisponível</h1>
      <p class="max-w-md text-muted-foreground">O link pode estar incorreto ou a loja não está mais disponível. Verifique com o vendedor.</p>
    </div>

    <template v-else>
      <!-- Cabeçalho da loja -->
      <header
        class="sticky top-0 z-20 border-b backdrop-blur"
        :class="isLoja ? '' : 'bg-background/95'"
        :style="isLoja ? { backgroundColor: 'var(--brand)' } : {}"
      >
        <div
          class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3"
          :class="isLoja && headerEstilo === 'centralizado' ? 'justify-center text-center' : ''"
        >
          <img
            v-if="logo"
            :src="logo"
            :alt="nomeLoja"
            class="h-11 w-11 rounded-full border object-cover"
            :class="isLoja ? 'border-white/40' : ''"
          />
          <div
            v-else
            class="flex h-11 w-11 items-center justify-center rounded-full border"
            :class="isLoja ? 'border-white/40 bg-white/20 text-white' : 'bg-primary/10 text-primary'"
          >
            <ShoppingBag class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <h1 class="truncate text-lg font-bold leading-tight" :class="isLoja ? 'text-white' : ''">{{ nomeLoja }}</h1>
            <p class="text-xs" :class="isLoja ? 'text-white/80' : 'text-muted-foreground'">{{ rotulo }}</p>
          </div>
        </div>
      </header>

      <!-- Banner hero (estilo "banner" da loja) -->
      <div
        v-if="isLoja && headerEstilo === 'banner'"
        class="relative flex h-44 items-end sm:h-56"
        :style="bannerSrc
          ? { backgroundImage: `url(${bannerSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { backgroundColor: 'var(--brand)' }"
      >
        <div class="absolute inset-0 bg-black/40"></div>
        <div class="relative mx-auto w-full max-w-6xl px-4 pb-5 text-white">
          <h2 class="text-2xl font-extrabold drop-shadow sm:text-3xl">{{ cfg?.bannerTitulo || nomeLoja }}</h2>
          <p v-if="cfg?.bannerSubtitulo" class="mt-1 text-sm text-white/90 drop-shadow">{{ cfg?.bannerSubtitulo }}</p>
        </div>
      </div>

      <main class="mx-auto max-w-6xl px-4 py-5">
        <!-- Mensagem de boas-vindas (loja) -->
        <p v-if="mensagemBoasVindas" class="mb-4 rounded-lg border bg-background px-4 py-3 text-sm text-muted-foreground">
          {{ mensagemBoasVindas }}
        </p>

        <!-- Busca -->
        <div class="relative mb-4">
          <Search class="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input v-model="search" placeholder="Buscar produto..." class="h-10 pl-9" />
        </div>

        <!-- Categorias -->
        <div v-if="catalogo?.categorias.length" class="mb-5 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full border px-3 py-1 text-sm transition"
            :class="!categoriaAtiva ? (isLoja ? 'text-white' : 'border-primary bg-primary text-primary-foreground') : 'hover:bg-muted'"
            :style="!categoriaAtiva && isLoja ? { backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' } : {}"
            @click="categoriaAtiva = null"
          >
            Todos
          </button>
          <button
            v-for="cat in catalogo?.categorias"
            :key="cat"
            type="button"
            class="rounded-full border px-3 py-1 text-sm transition"
            :class="categoriaAtiva === cat ? (isLoja ? 'text-white' : 'border-primary bg-primary text-primary-foreground') : 'hover:bg-muted'"
            :style="categoriaAtiva === cat && isLoja ? { backgroundColor: 'var(--brand)', borderColor: 'var(--brand)' } : {}"
            @click="categoriaAtiva = cat"
          >
            {{ cat }}
          </button>
        </div>

        <!-- Vazio -->
        <div v-if="!produtosFiltrados.length" class="flex flex-col items-center justify-center gap-2 py-20 text-center text-muted-foreground">
          <Package class="h-10 w-10" />
          <p>Nenhum produto encontrado.</p>
        </div>

        <!-- Grade de produtos -->
        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          <button
            v-for="produto in produtosFiltrados"
            :key="produto.id"
            type="button"
            class="group flex flex-col overflow-hidden rounded-xl border bg-background text-left shadow-sm transition hover:shadow-md"
            @click="abrirProduto(produto)"
          >
            <div class="aspect-square w-full overflow-hidden bg-muted/40">
              <img
                v-if="produto.imagem"
                :src="resolveFileUrl(produto.imagem)"
                :alt="produto.nome"
                loading="lazy"
                class="h-full w-full object-cover transition group-hover:scale-105"
              />
              <div v-else class="flex h-full w-full items-center justify-center text-muted-foreground">
                <Package class="h-10 w-10" />
              </div>
            </div>
            <div class="flex flex-1 flex-col gap-1 p-3">
              <span v-if="produto.categoria" class="text-[11px] uppercase tracking-wide text-muted-foreground">{{ produto.categoria }}</span>
              <h3 class="line-clamp-2 text-sm font-medium leading-snug">{{ produto.nome }}</h3>
              <div class="mt-auto pt-1">
                <span v-if="mostrarPrecos" class="text-base font-bold text-primary" :style="precoStyle">{{ precoLabel(produto) }}</span>
                <span v-if="produto.totalVariantes > 1" class="block text-[11px] text-muted-foreground">
                  {{ produto.totalVariantes }} opções
                </span>
              </div>
            </div>
          </button>
        </div>

        <footer class="mt-10 border-t py-6 text-center text-xs text-muted-foreground">
          {{ nomeLoja }} · {{ rotulo }}
        </footer>
      </main>

      <!-- Detalhe do produto -->
      <Dialog :open="!!produtoSelecionado" @update:open="(v) => { if (!v) produtoSelecionado = null }">
        <DialogContent v-if="produtoSelecionado" class="max-w-lg">
          <DialogHeader>
            <DialogTitle>{{ produtoSelecionado.nome }}</DialogTitle>
          </DialogHeader>
          <div class="space-y-4">
            <div
              v-if="produtoSelecionado.imagem"
              class="aspect-square w-full overflow-hidden rounded-lg border bg-muted/40"
            >
              <img
                :src="resolveFileUrl(produtoSelecionado.imagem)"
                :alt="produtoSelecionado.nome"
                class="h-full w-full cursor-zoom-in object-cover"
                @click="imagemPreview = resolveFileUrl(produtoSelecionado.imagem)"
              />
            </div>

            <p v-if="produtoSelecionado.categoria" class="text-xs uppercase tracking-wide text-muted-foreground">
              {{ produtoSelecionado.categoria }}
            </p>
            <p v-if="produtoSelecionado.descricao" class="text-sm text-muted-foreground whitespace-pre-wrap">
              {{ produtoSelecionado.descricao }}
            </p>

            <!-- Variantes / preços -->
            <div class="space-y-2">
              <div
                v-for="variante in produtoSelecionado.variantes"
                :key="variante.id"
                class="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div class="flex min-w-0 items-center gap-2">
                  <img
                    v-if="variante.imagem"
                    :src="resolveFileUrl(variante.imagem)"
                    :alt="variante.nomeVariante"
                    class="h-9 w-9 shrink-0 rounded-md border object-cover"
                  />
                  <span class="truncate text-sm">{{ variante.nomeVariante || 'Padrão' }}</span>
                </div>
                <span v-if="mostrarPrecos" class="shrink-0 text-sm font-semibold text-primary" :style="precoStyle">{{ formatCurrencyBR(Number(variante.preco) || 0) }}</span>
              </div>
            </div>

            <a
              v-if="usarWhatsapp && whatsappUrl"
              :href="whatsappUrl"
              target="_blank"
              rel="noreferrer"
              class="flex w-full items-center justify-center gap-2 rounded-md bg-emerald-600 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              <MessageCircle class="h-4 w-4" /> Pedir pelo WhatsApp
            </a>
          </div>
        </DialogContent>
      </Dialog>

      <!-- Lightbox da imagem -->
      <Teleport to="body">
        <div
          v-if="imagemPreview"
          class="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
          @click="imagemPreview = ''"
        >
          <img :src="imagemPreview" alt="Imagem do produto" class="max-h-[95vh] max-w-[95vw] rounded-lg object-contain" @click.stop />
        </div>
      </Teleport>
    </template>
  </div>
</template>
