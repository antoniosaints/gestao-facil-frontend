<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  ArrowUpRight,
  Gem,
  Headset,
  ShoppingBag,
  Store,
  Trophy,
  UtensilsCrossed,
} from 'lucide-vue-next'
import { SITE_NICHES } from './siteNiches'

const activeSlug = ref(SITE_NICHES[0].slug)
const activeNiche = computed(
  () => SITE_NICHES.find((niche) => niche.slug === activeSlug.value) || SITE_NICHES[0],
)

const icons = { UtensilsCrossed, Gem, Store, Headset, ShoppingBag, Trophy }

function activate(slug: string) {
  activeSlug.value = slug
}
</script>

<template>
  <section
    id="nichos"
    class="site-niches py-24 sm:py-32"
    :style="{
      '--niche': activeNiche.accent,
      '--niche-soft': activeNiche.accentSoft,
      '--niche-text': activeNiche.accentText,
    }"
  >
    <div class="mx-auto max-w-7xl px-5 lg:px-8">
      <div class="mb-10 max-w-2xl">
        <p class="niche-accent-text mb-3 text-xs font-bold uppercase tracking-[0.22em]">
          Soluções por nicho
        </p>
        <h2 class="text-3xl font-semibold tracking-[-0.045em] sm:text-5xl">
          Um sistema que muda de linguagem para falar a do seu negócio.
        </h2>
        <p class="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
          Escolha sua operação. A experiência se adapta, mas a base continua a mesma: gestão
          simples, conectada e pronta para crescer.
        </p>
      </div>

      <div class="grid gap-5 lg:grid-cols-[minmax(15rem,.45fr)_minmax(0,1fr)]">
        <div class="niche-selector flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          <button
            v-for="niche in SITE_NICHES"
            :key="niche.slug"
            type="button"
            class="group flex min-w-max items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition duration-300 lg:min-w-0"
            :class="
              activeSlug === niche.slug
                ? 'border-[var(--niche)] bg-[var(--niche)] text-white shadow-sm'
                : 'border-transparent bg-transparent hover:border-border hover:bg-card'
            "
            :aria-pressed="activeSlug === niche.slug"
            @mouseenter="activate(niche.slug)"
            @focus="activate(niche.slug)"
            @click="activate(niche.slug)"
          >
            <span
              class="grid h-9 w-9 place-items-center rounded-xl bg-card shadow-sm ring-1 ring-black/5 dark:ring-white/10"
              :style="{ color: niche.accent }"
            >
              <component :is="icons[niche.icon]" class="h-4 w-4" />
            </span>
            <span class="min-w-0"
              ><span class="block text-sm font-semibold">{{ niche.label }}</span
              ><span class="mt-0.5 hidden text-xs text-muted-foreground lg:block">{{
                niche.kicker
              }}</span></span
            >
          </button>
        </div>

        <Transition name="niche-swap" mode="out-in">
          <article
            :key="activeNiche.slug"
            class="relative overflow-hidden rounded-[2rem] border bg-card p-6 shadow-[0_25px_60px_-40px_rgba(0,0,0,.5)] sm:p-9"
          >
            <div
              class="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[var(--niche)] opacity-[0.12] blur-3xl"
            />
            <div class="relative grid gap-9 xl:grid-cols-[1fr_.8fr] xl:items-end">
              <div>
                <div class="mb-8 flex items-center gap-3">
                  <span
                    class="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--niche-soft)] text-[var(--niche-text)]"
                    ><component :is="icons[activeNiche.icon]" class="h-5 w-5" /></span
                  ><span
                    class="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground"
                    >{{ activeNiche.kicker }}</span
                  >
                </div>
                <h3
                  class="max-w-xl text-3xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-5xl"
                >
                  {{ activeNiche.title }}
                </h3>
                <p class="mt-5 max-w-xl text-base leading-7 text-muted-foreground">
                  {{ activeNiche.description }}
                </p>
                <RouterLink
                  :to="`/site/solucoes/${activeNiche.slug}`"
                  class="niche-accent-text mt-8 inline-flex items-center gap-2 text-sm font-bold transition hover:gap-3"
                  >Conhecer a solução <ArrowUpRight class="h-4 w-4"
                /></RouterLink>
              </div>

              <div class="rounded-3xl bg-zinc-950 p-5 text-zinc-100 shadow-xl">
                <div class="mb-8 flex items-center justify-between">
                  <span class="text-[10px] font-bold uppercase tracking-[0.22em] text-zinc-400"
                    >Gestão Fácil</span
                  ><span
                    class="h-2 w-2 rounded-full bg-[var(--niche)] shadow-[0_0_18px_var(--niche)]"
                  />
                </div>
                <div class="space-y-3">
                  <div
                    v-for="feature in activeNiche.features"
                    :key="feature.title"
                    class="flex gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-3.5"
                  >
                    <span
                      class="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 text-[var(--niche)]"
                      ><component :is="icons[feature.icon]" class="h-3.5 w-3.5"
                    /></span>
                    <div>
                      <p class="text-sm font-semibold">{{ feature.title }}</p>
                      <p class="mt-1 text-xs leading-5 text-zinc-400">{{ feature.description }}</p>
                    </div>
                  </div>
                </div>
                <div class="mt-6 grid grid-cols-3 gap-2 border-t border-white/10 pt-5">
                  <div v-for="metric in activeNiche.metrics" :key="metric.label">
                    <p class="text-sm font-bold text-white">{{ metric.value }}</p>
                    <p class="mt-1 text-[10px] leading-3 text-zinc-500">{{ metric.label }}</p>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </Transition>
      </div>
    </div>
  </section>
</template>

<style scoped>
.site-niches {
  background: linear-gradient(
    180deg,
    transparent 0%,
    color-mix(in srgb, var(--niche-soft) 50%, transparent) 50%,
    transparent 100%
  );
  transition: background 500ms ease;
}
.niche-accent-text {
  color: var(--niche-text);
}
:global(.dark) .niche-accent-text {
  color: color-mix(in srgb, var(--niche) 68%, white);
}
.niche-swap-enter-active,
.niche-swap-leave-active {
  transition:
    opacity 220ms ease,
    transform 220ms ease;
}
.niche-swap-enter-from {
  opacity: 0;
  transform: translateY(10px) scale(0.99);
}
.niche-swap-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.99);
}
@media (prefers-reduced-motion: reduce) {
  .niche-swap-enter-active,
  .niche-swap-leave-active {
    transition: none;
  }
}
</style>
