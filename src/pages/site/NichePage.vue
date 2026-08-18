<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Gem,
  Headset,
  ShoppingBag,
  Store,
  Trophy,
  UtensilsCrossed,
} from 'lucide-vue-next'
import { getSiteNiche } from './siteNiches'

const route = useRoute()
const niche = computed(() => getSiteNiche(route.params.nicho))
const icons = { UtensilsCrossed, Gem, Store, Headset, ShoppingBag, Trophy }
const nicheStyle = computed(() => ({
  '--niche': niche.value.accent,
  '--niche-soft': niche.value.accentSoft,
  '--niche-text': niche.value.accentText,
}))
</script>

<template>
  <main class="niche-page min-h-screen bg-[#111110] text-zinc-100" :style="nicheStyle">
    <div class="relative isolate overflow-hidden">
      <div
        class="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_68%_12%,var(--niche)_0%,transparent_37%)] opacity-20"
      />
      <div
        class="pointer-events-none absolute right-[-15rem] top-28 -z-10 h-[38rem] w-[38rem] rounded-full bg-[var(--niche)] opacity-[0.08] blur-3xl"
      />

      <header class="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <RouterLink to="/site" class="flex items-center gap-2.5 text-sm font-semibold text-white">
          <img src="/imgs/logo.png" alt="Gestão Fácil" class="h-8 w-8 rounded-lg object-contain" />
          Gestão Fácil
        </RouterLink>
        <div class="flex items-center gap-3">
          <RouterLink
            to="/site#nichos"
            class="hidden text-sm font-medium text-zinc-400 transition hover:text-white sm:inline-flex"
            >Todos os nichos</RouterLink
          >
          <RouterLink
            to="/site/cadastro"
            class="rounded-full bg-white px-4 py-2 text-sm font-bold text-zinc-900 transition hover:-translate-y-0.5 hover:bg-zinc-100"
            >Começar grátis</RouterLink
          >
        </div>
      </header>

      <section
        class="mx-auto grid max-w-7xl gap-14 px-5 pb-24 pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(25rem,.82fr)] lg:px-8 lg:pb-32 lg:pt-24"
      >
        <div class="max-w-3xl">
          <RouterLink
            to="/site#nichos"
            class="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-zinc-400 transition hover:text-white"
            ><ArrowLeft class="h-4 w-4" /> Voltar para soluções</RouterLink
          >
          <div class="mb-7 flex items-center gap-3">
            <span
              class="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--niche)] text-white shadow-[0_12px_35px_-15px_var(--niche)]"
              ><component :is="icons[niche.icon]" class="h-5 w-5"
            /></span>
            <span class="text-xs font-bold uppercase tracking-[0.22em] text-[var(--niche-on-dark)]"
              >Solução para {{ niche.label }}</span
            >
          </div>
          <h1
            class="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-6xl lg:text-7xl"
          >
            {{ niche.title }}
          </h1>
          <p class="mt-7 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
            {{ niche.description }}
          </p>
          <div class="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <RouterLink
              to="/site/cadastro"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--niche)] px-6 py-3.5 text-sm font-bold text-white shadow-[0_18px_35px_-18px_var(--niche)] transition hover:-translate-y-0.5 hover:brightness-110"
              >Testar Gestão Fácil <ArrowRight class="h-4 w-4"
            /></RouterLink>
            <RouterLink
              to="/site#nichos"
              class="inline-flex items-center justify-center rounded-full border border-white/15 px-6 py-3.5 text-sm font-semibold text-zinc-300 transition hover:border-white/35 hover:bg-white/5"
              >Ver outros nichos</RouterLink
            >
          </div>
        </div>

        <aside
          class="niche-console relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur sm:p-7"
        >
          <div
            class="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[var(--niche)] opacity-20 blur-3xl"
          />
          <div class="relative">
            <div class="flex items-center justify-between border-b border-white/10 pb-5">
              <span class="text-[10px] font-bold uppercase tracking-[0.23em] text-zinc-500"
                >Gestão em uma visão</span
              ><span
                class="h-2.5 w-2.5 rounded-full bg-[var(--niche)] shadow-[0_0_20px_var(--niche)]"
              />
            </div>
            <div class="mt-6 space-y-3">
              <article
                v-for="feature in niche.features"
                :key="feature.title"
                class="rounded-2xl border border-white/10 bg-zinc-950/65 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--niche)]/60"
              >
                <div class="flex gap-3">
                  <span
                    class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--niche-soft)] text-[var(--niche-text)]"
                    ><component :is="icons[feature.icon]" class="h-4 w-4"
                  /></span>
                  <div>
                    <h2 class="text-sm font-bold text-white">{{ feature.title }}</h2>
                    <p class="mt-1.5 text-sm leading-5 text-zinc-400">{{ feature.description }}</p>
                  </div>
                </div>
              </article>
            </div>
            <div class="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
              <div v-for="metric in niche.metrics" :key="metric.label">
                <p class="text-lg font-bold tracking-tight text-white">{{ metric.value }}</p>
                <p class="mt-1 text-[10px] leading-3 text-zinc-500">{{ metric.label }}</p>
              </div>
            </div>
          </div>
        </aside>
      </section>
    </div>

    <section class="border-y border-white/10 bg-white/[0.025]">
      <div class="mx-auto grid max-w-7xl gap-6 px-5 py-16 sm:grid-cols-3 lg:px-8 lg:py-20">
        <div>
          <p class="text-xs font-bold uppercase tracking-[0.2em] text-[var(--niche-on-dark)]">
            Feito para operar
          </p>
          <h2 class="mt-4 text-3xl font-semibold tracking-[-0.045em] text-white">
            Menos troca de tela. Mais controle da operação.
          </h2>
        </div>
        <div class="sm:col-span-2 grid gap-3 sm:grid-cols-2">
          <div
            v-for="feature in niche.features"
            :key="`${feature.title}-benefit`"
            class="flex gap-3 rounded-2xl border border-white/10 bg-zinc-950/60 p-4"
          >
            <Check class="mt-0.5 h-4 w-4 shrink-0 text-[var(--niche)]" />
            <div>
              <p class="text-sm font-bold text-white">{{ feature.title }}</p>
              <p class="mt-1 text-sm leading-5 text-zinc-400">{{ feature.description }}</p>
            </div>
          </div>
          <div class="rounded-2xl border border-[var(--niche)]/45 bg-[var(--niche)]/10 p-4">
            <p class="text-sm font-bold text-white">Seu fluxo, conectado</p>
            <p class="mt-1 text-sm leading-5 text-zinc-300">
              Uma base única para pessoas, vendas, caixa e a rotina específica do seu negócio.
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
      <div
        class="rounded-[2rem] border border-white/10 bg-zinc-900 px-6 py-12 text-center sm:px-12"
      >
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-[var(--niche-on-dark)]">
          Gestão Fácil para {{ niche.label }}
        </p>
        <h2
          class="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-[-0.045em] text-white sm:text-5xl"
        >
          A sua operação já tem ritmo. Agora ela pode ter sistema.
        </h2>
        <RouterLink
          to="/site/cadastro"
          class="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-zinc-900 transition hover:-translate-y-0.5"
          >Começar agora <ArrowRight class="h-4 w-4"
        /></RouterLink>
      </div>
    </section>
  </main>
</template>

<style scoped>
.niche-page {
  --niche-on-dark: color-mix(in srgb, var(--niche) 68%, white);
  transition: background-color 300ms ease;
}
@media (prefers-reduced-motion: reduce) {
  .niche-page *,
  .niche-page {
    transition: none !important;
  }
}
</style>
