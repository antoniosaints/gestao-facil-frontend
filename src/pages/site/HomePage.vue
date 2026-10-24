<script setup lang="ts">
import './siteTypography.css'
import { computed, onMounted, ref } from 'vue'
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Menu,
  X,
  Box,
  Wallet,
  FileBarChart,
  Wrench,
  ScanLine,
  UsersRound,
  Bot,
  MessageCircle,
  Repeat,
  CreditCard,
  Headset,
  Store,
  Palette,
  SlidersHorizontal,
  LayoutDashboard,
} from 'lucide-vue-next'
import { SiteRepository } from '@/repositories/site-repository'
import { cloneSiteConfig } from './siteContent'
import { resolveFileUrl } from '@/utils/fileUrl'
import SiteNichesShowcase from './SiteNichesShowcase.vue'

const config = ref(cloneSiteConfig())
const menuOpen = ref(false)
const iconMap = {
  Box,
  Wallet,
  FileBarChart,
  Wrench,
  ScanLine,
  UsersRound,
  Bot,
  MessageCircle,
  Repeat,
  CreditCard,
  Headset,
  Store,
}
const icon = (name: string) => iconMap[name as keyof typeof iconMap] || Box
const money = (value: number) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const heroImage = computed(() =>
  config.value.hero.imageUrl?.startsWith('/imgs/')
    ? config.value.hero.imageUrl
    : resolveFileUrl(config.value.hero.imageUrl, { fallback: '/imgs/dashboard.png' }),
)
const heroParts = computed(() => {
  const { title, highlight } = config.value.hero
  const index = highlight ? title.toLowerCase().indexOf(highlight.toLowerCase()) : -1
  return index < 0
    ? { before: title, highlight: '', after: '' }
    : {
        before: title.slice(0, index),
        highlight: title.slice(index, index + highlight.length),
        after: title.slice(index + highlight.length),
      }
})
// Do not carry forward the old default claim about setup speed as social proof.
const stats = computed(() =>
  config.value.hero.stats.filter(
    (stat) => !/5\s*min|para configurar/i.test(`${stat.value} ${stat.label}`),
  ),
)
const navigation = [
  { id: 'features', label: 'Plataforma' },
  { id: 'nichos', label: 'Seu negócio' },
  { id: 'apps', label: 'Apps' },
  { id: 'precos', label: 'Plano' },
  { id: 'faq', label: 'Dúvidas' },
]
const journey = [
  {
    icon: SlidersHorizontal,
    number: '01',
    title: 'Conte como você trabalha',
    description:
      'Produtos, serviços, agendamentos, restaurante ou uma combinação. O cadastro parte da sua operação.',
  },
  {
    icon: LayoutDashboard,
    number: '02',
    title: 'Revise seu painel',
    description:
      'Confira os menus e módulos sugeridos. Apps pagos ficam separados e só são contratados depois, se você escolher.',
  },
  {
    icon: Palette,
    number: '03',
    title: 'Dê a sua identidade',
    description:
      'Escolha cores e fonte, veja os modos claro e escuro e comece com um ambiente que faz sentido para você.',
  },
]
onMounted(async () => {
  try {
    config.value = cloneSiteConfig(await SiteRepository.getPublicConfig())
  } catch {
    /* Keep the editable schema's local defaults when the public API is unavailable. */
  }
})
</script>

<template>
  <div class="public-site">
    <a
      href="#main-content"
      class="sr-only z-[60] rounded bg-white p-3 text-black focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >Pular para o conteúdo</a
    >
    <header class="site-header">
      <div class="site-container flex h-20 items-center justify-between gap-4">
        <RouterLink
          to="/site"
          class="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight"
          ><img src="/imgs/logo.png" alt="" class="h-9 w-9 rounded-lg" /><span
            >Gestão Fácil<span class="ml-1 text-xs font-normal text-[#56706b]">ERP</span></span
          ></RouterLink
        >
        <nav aria-label="Navegação principal" class="hidden items-center gap-6 text-sm lg:flex">
          <a
            v-for="link in navigation"
            :key="link.id"
            :href="`#${link.id}`"
            class="site-nav-link"
            >{{ link.label }}</a
          >
        </nav>
        <div class="flex items-center gap-3">
          <RouterLink to="/login" class="text-sm font-semibold underline-offset-4 hover:underline"
            >Entrar</RouterLink
          ><RouterLink to="/site/cadastro" class="site-button site-button-small site-header-cta"
            >Criar minha conta<ArrowUpRight class="h-4 w-4" aria-hidden="true" /></RouterLink
          ><button
            type="button"
            class="grid h-11 w-11 place-items-center rounded-lg border border-[#cbd7d1] lg:hidden"
            aria-label="Menu do site"
            aria-controls="site-mobile-menu"
            :aria-expanded="menuOpen"
            @click="menuOpen = !menuOpen"
          >
            <X v-if="menuOpen" class="h-5 w-5" /><Menu v-else class="h-5 w-5" />
          </button>
        </div>
      </div>
      <nav
        v-if="menuOpen"
        id="site-mobile-menu"
        aria-label="Navegação mobile"
        class="site-container grid gap-1 border-t border-[#dce3dd] pb-5 lg:hidden"
      >
        <a
          v-for="link in navigation"
          :key="link.id"
          :href="`#${link.id}`"
          class="rounded-lg px-3 py-3 text-sm hover:bg-white"
          @click="menuOpen = false"
          >{{ link.label }}</a
        ><RouterLink to="/site/cadastro" class="site-button mt-2" @click="menuOpen = false"
          >Criar minha conta<ArrowRight class="h-4 w-4"
        /></RouterLink>
      </nav>
    </header>
    <main id="main-content">
      <section
        class="site-container grid gap-12 pb-16 pt-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-10 lg:pb-24 lg:pt-20"
      >
        <div>
          <p class="site-eyebrow">
            <span class="h-2 w-2 rounded-full bg-[#34755f]" />{{ config.hero.badge }}
          </p>
          <h1
            class="mt-6 max-w-2xl text-[clamp(2.5rem,4.5vw,4.7rem)] font-medium leading-[1.08] tracking-[-.055em]"
          >
            {{ heroParts.before
            }}<em class="not-italic text-[#39725d]">{{ heroParts.highlight }}</em
            >{{ heroParts.after }}
          </h1>
          <p class="mt-6 max-w-xl text-base leading-7 text-[#53655c] sm:text-lg">
            {{ config.hero.subtitle }}
          </p>
          <div class="mt-8 flex flex-wrap gap-3">
            <RouterLink to="/site/cadastro" class="site-button"
              >Configurar meu negócio<ArrowRight class="h-4 w-4" aria-hidden="true" /></RouterLink
            ><a href="#features" class="site-button site-button-outline">Conhecer a plataforma</a>
          </div>
          <p class="mt-4 text-xs leading-5 text-[#62726a]">
            Cadastro guiado · sugestões revisáveis · cores e fontes para o seu painel
          </p>
          <dl
            v-if="stats.length"
            class="mt-10 grid grid-cols-2 gap-5 border-t border-[#d5ded4] pt-6 sm:grid-cols-3"
          >
            <div v-for="stat in stats" :key="stat.label">
              <dt class="text-xs text-[#62726a]">{{ stat.label }}</dt>
              <dd class="mt-1 font-semibold">{{ stat.value }}</dd>
            </div>
          </dl>
        </div>
        <div class="hero-board">
          <div class="mb-7 flex items-center justify-between border-b border-white/15 pb-4">
            <span class="text-xs uppercase tracking-[.2em] text-white/60">Gestão com direção</span
            ><span class="rounded-full bg-[#d6efaf] px-3 py-1 text-[10px] font-bold text-[#143b30]"
              >DO SEU JEITO</span
            >
          </div>
          <div class="grid grid-cols-[36px_1fr] gap-4">
            <div class="flex flex-col items-center gap-5 pt-2 text-white/50" aria-hidden="true">
              <LayoutDashboard class="h-5 w-5 text-[#d6efaf]" /><Box class="h-5 w-5" /><Wallet
                class="h-5 w-5"
              /><UsersRound class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p class="mb-1 text-xs text-[#b8c8ba]">Um ambiente para sua rotina</p>
              <h2 class="mb-5 text-xl font-medium text-white sm:text-2xl">
                Menos dispersão.<br />Mais visão do negócio.
              </h2>
              <div class="overflow-hidden rounded-lg border border-white/20 bg-white shadow-xl">
                <img
                  :src="heroImage"
                  :alt="config.hero.imageAlt || 'Interface do Gestão Fácil'"
                  class="h-auto w-full"
                  fetchpriority="high"
                  width="1200"
                  height="760"
                />
              </div>
              <p class="mt-3 text-[10px] text-white/55">
                Visão da plataforma. A disponibilidade depende dos módulos da conta.
              </p>
            </div>
          </div>
          <div
            class="mt-7 grid grid-cols-3 gap-2 border-t border-white/15 pt-5 text-xs text-white/70"
          >
            <span>Vendas & clientes</span><span>Operação & estoque</span
            ><span>Financeiro & gestão</span>
          </div>
        </div>
      </section>

      <section id="features" class="border-y border-[#d5ded4] bg-white/60 py-16 lg:py-24">
        <div class="site-container">
          <div class="mb-10 grid gap-5 md:grid-cols-2 md:items-end">
            <div>
              <p class="site-eyebrow">A plataforma</p>
              <h2 class="site-title mt-3">O dia a dia conectado.<br />A gestão mais clara.</h2>
            </div>
            <p class="max-w-lg text-base leading-7 text-[#62726a]">
              Reúna as informações da operação em um ambiente. Escolha os recursos adequados ao seu
              negócio e mantenha o foco no que precisa acompanhar.
            </p>
          </div>
          <div
            class="grid gap-px overflow-hidden rounded-2xl border border-[#d5ded4] bg-[#d5ded4] sm:grid-cols-2 lg:grid-cols-4"
          >
            <article
              v-for="feature in config.features"
              :key="feature.title"
              class="bg-[#fcfdf9] p-6"
            >
              <component
                :is="icon(feature.icon)"
                class="mb-7 h-6 w-6 text-[#39725d]"
                aria-hidden="true"
              />
              <h3 class="text-base font-semibold">{{ feature.title }}</h3>
              <p class="mt-3 text-sm leading-6 text-[#62726a]">{{ feature.description }}</p>
            </article>
          </div>
          <ul class="mt-8 grid gap-3 text-sm sm:grid-cols-2">
            <li v-for="benefit in config.benefits" :key="benefit" class="flex gap-2">
              <Check class="h-4 w-4 shrink-0 text-[#39725d]" aria-hidden="true" />{{ benefit }}
            </li>
          </ul>
        </div>
      </section>

      <section class="site-container py-16 lg:py-24">
        <div class="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p class="site-eyebrow">Um início orientado</p>
            <h2 class="site-title mt-3">Não comece do zero.<br />Comece pelo seu negócio.</h2>
          </div>
          <RouterLink
            to="/site/cadastro"
            class="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#265541] underline underline-offset-4"
            >Montar meu painel<ArrowUpRight class="h-4 w-4"
          /></RouterLink>
        </div>
        <div class="grid gap-6 md:grid-cols-3">
          <article
            v-for="item in journey"
            :key="item.number"
            class="rounded-2xl border border-[#d5ded4] p-6"
          >
            <div class="mb-8 flex items-center justify-between">
              <span class="text-xs font-medium text-[#819385]">{{ item.number }}</span
              ><component :is="item.icon" class="h-6 w-6 text-[#39725d]" aria-hidden="true" />
            </div>
            <h3 class="text-lg font-semibold">{{ item.title }}</h3>
            <p class="mt-3 text-sm leading-6 text-[#62726a]">{{ item.description }}</p>
          </article>
        </div>
        <ul class="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs text-[#62726a]">
          <li v-for="benefit in config.adaptBenefits" :key="benefit">{{ benefit }}</li>
        </ul>
      </section>

      <SiteNichesShowcase />

      <section id="apps" class="site-container py-16 lg:py-24">
        <div class="mb-10 grid gap-6 md:grid-cols-2">
          <div>
            <p class="site-eyebrow">Expanda quando fizer sentido</p>
            <h2 class="site-title mt-3">Uma base para começar.<br />Apps para ir além.</h2>
          </div>
          <p class="max-w-lg text-base leading-7 text-[#62726a]">
            Apps adicionais têm disponibilidade e condições próprias. O cadastro recomenda os que
            combinam com sua operação; apps pagos só são contratados depois, na App Store.
          </p>
        </div>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="app in config.apps"
            :key="app.title"
            class="flex flex-col rounded-2xl border border-[#d5ded4] bg-white p-6"
          >
            <component
              :is="icon(app.icon)"
              class="mb-6 h-7 w-7 text-[#39725d]"
              aria-hidden="true"
            />
            <p class="text-[10px] font-semibold uppercase tracking-widest text-[#819385]">
              {{ app.category }}
            </p>
            <h3 class="mt-1 text-lg font-semibold">{{ app.title }}</h3>
            <p class="mb-6 mt-3 flex-1 text-sm leading-6 text-[#62726a]">{{ app.description }}</p>
            <p class="border-t border-[#e0e7dd] pt-4 text-sm font-semibold">
              {{ app.price > 0 ? `${money(app.price)}/mês` : 'Sem mensalidade adicional' }}
            </p>
          </article>
        </div>
        <p class="mt-4 text-xs leading-5 text-[#62726a]">
          Preços informativos do site. Confira o catálogo atualizado no cadastro e as condições na
          App Store. Integrações precisam de configuração.
        </p>
      </section>

      <section id="precos" class="bg-[#122b29] py-16 text-white lg:py-24">
        <div class="site-container grid gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <p class="site-eyebrow !text-[#b8e7bc]">O próximo passo</p>
            <h2 class="site-title mt-4">
              Organize hoje.<br /><span class="text-[#b8e7bc]">Evolua no seu ritmo.</span>
            </h2>
            <p class="mt-6 max-w-lg leading-7 text-white/65">
              Conheça o sistema no teste inicial de {{ config.hero.trialDays }} dias. Personalize
              seu ambiente e avalie o que atende à sua rotina.
            </p>
            <RouterLink to="/site/cadastro" class="site-button mt-8 !bg-[#d6efaf] !text-[#122b29]"
              >Começar meu cadastro<ArrowRight class="h-4 w-4"
            /></RouterLink>
          </div>
          <div class="rounded-2xl border border-white/20 bg-white/5 p-6 sm:p-8">
            <p class="text-sm text-white/60">Plano base · referência mensal do site</p>
            <p class="mt-3 text-4xl font-semibold tracking-tight">
              {{ money(config.hero.monthlyPrice)
              }}<span class="text-base font-normal text-white/60"> / mês</span>
            </p>
            <p class="mb-6 mt-3 text-xs leading-5 text-white/60">
              Apps adicionais são apresentados separadamente.
            </p>
            <ul class="grid gap-3 border-t border-white/15 pt-6 text-sm sm:grid-cols-2">
              <li v-for="item in config.included" :key="item" class="flex gap-2">
                <Check class="h-4 w-4 shrink-0 text-[#b8e7bc]" />{{ item }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section
        id="faq"
        class="site-container grid gap-10 py-16 lg:grid-cols-[.65fr_1fr] lg:gap-20 lg:py-24"
      >
        <div>
          <p class="site-eyebrow">Antes de começar</p>
          <h2 class="site-title mt-3">Espaço para<br />suas dúvidas.</h2>
          <p class="mt-5 max-w-sm text-sm leading-6 text-[#62726a]">
            Entenda o cadastro, o plano e os apps adicionais antes de escolher.
          </p>
        </div>
        <div>
          <details v-for="faq in config.faqs" :key="faq.q" class="border-b border-[#d5ded4] py-5">
            <summary
              class="cursor-pointer pr-4 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#39725d]"
            >
              {{ faq.q }}
            </summary>
            <p class="mt-4 text-sm leading-7 text-[#62726a]">{{ faq.a }}</p>
          </details>
        </div>
      </section>
    </main>
    <footer class="border-t border-[#d5ded4] py-8">
      <div class="site-container flex flex-wrap items-center justify-between gap-6">
        <div>
          <p class="font-semibold">Gestão Fácil</p>
          <p class="mt-2 text-xs text-[#62726a]">
            © {{ new Date().getFullYear() }} · Gestão para o seu negócio.
          </p>
        </div>
        <nav aria-label="Links do rodapé" class="flex flex-wrap gap-5 text-sm">
          <RouterLink to="/login" class="hover:underline">Entrar</RouterLink
          ><RouterLink to="/site/cadastro" class="hover:underline">Criar conta</RouterLink
          ><RouterLink to="/site/termos-politica" class="hover:underline"
            >Termos e privacidade</RouterLink
          >
        </nav>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.public-site {
  overflow-x: clip;
  background: #f4f6ed;
  color: #1c332a;
  --app-font: 'Site Inter';
  font-family: 'Site Inter', sans-serif;
}
.public-site h1,
.public-site h2,
.public-site h3 {
  --app-font: 'Site Sora';
  font-family: 'Site Sora', sans-serif;
}
.site-container {
  width: 100%;
  max-width: 1240px;
  margin-inline: auto;
  padding-inline: 24px;
}
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  border-bottom: 1px solid #d5ded4;
  background: #f4f6edf5;
  backdrop-filter: blur(16px);
}
.site-nav-link {
  padding-block: 12px;
  color: #53655c;
}
.site-nav-link:hover {
  color: #143b30;
  text-decoration: underline;
  text-underline-offset: 6px;
}
.site-button {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border: 1px solid transparent;
  border-radius: 10px;
  padding: 12px 20px;
  background: #265541;
  color: white;
  font-size: 14px;
  font-weight: 600;
  transition:
    background 150ms,
    transform 150ms;
}
.site-button:hover {
  background: #153f2e;
}
.site-button:active {
  transform: translateY(1px);
}
.site-button:focus-visible {
  outline: 3px solid #6a987e;
  outline-offset: 4px;
}
.site-button-outline {
  border-color: #c5d1c2;
  background: transparent;
  color: #265541;
}
.site-button-outline:hover {
  background: white;
}
.site-button-small {
  min-height: 42px;
  padding: 8px 14px;
  font-size: 12px;
}
.site-eyebrow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.6;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #39725d;
}
.site-title {
  font-size: clamp(1.8rem, 3vw, 2.7rem);
  font-weight: 500;
  letter-spacing: -0.045em;
  line-height: 1.2;
}
.hero-board {
  min-width: 0;
  padding: 28px;
  border-radius: 24px;
  background: #183a31;
  box-shadow: 0 30px 50px -30px #153a3340;
}
section[id] {
  scroll-margin-top: 100px;
}
@media (min-width: 768px) {
  .site-container {
    padding-inline: 32px;
  }
  .hero-board {
    transform: rotate(-1deg);
  }
}
@media (max-width: 359px) {
  .site-container {
    padding-inline: 16px;
  }
  .hero-board {
    padding: 18px;
  }
}
@media (max-width: 639px) {
  .site-header-cta {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .site-button {
    transition: none;
  }
}
</style>
