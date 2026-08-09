<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Component } from 'vue'
import { ArrowLeft, ChevronRight, LayoutGrid, PackageOpen } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { filterSidebarMenuByVisibility, sidebarMenuOptions } from '@/layouts/options'
import { useUiStore } from '@/stores/ui/uiStore'
import type { SidebarMenuType } from '@/types/sidebar'

type NavigationEntry = SidebarMenuType & { children?: Array<Omit<SidebarMenuType, 'children'>> }

const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

const colorClasses: Record<NonNullable<SidebarMenuType['color']>, string> = {
  blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-300',
  red: 'bg-red-500/10 text-red-600 dark:text-red-300',
  yellow: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  green: 'bg-green-500/10 text-green-600 dark:text-green-300',
  gray: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-300',
  pink: 'bg-pink-500/10 text-pink-600 dark:text-pink-300',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-300',
  emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-300',
  slate: 'bg-slate-500/10 text-slate-600 dark:text-slate-300',
  violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-300',
}

const menus = computed<NavigationEntry[]>(() =>
  filterSidebarMenuByVisibility(
    sidebarMenuOptions(
      uiStore.permissoes,
      uiStore.appModules,
      uiStore.restaurantAccess.capabilities,
    ),
    uiStore.visibleMenuKeys,
    uiStore.usuarioLogged.permissao === 'root',
    uiStore.hiddenSubmenuKeys,
  ).filter(
    (item) =>
      !item.divisor &&
      item.show !== false &&
      Boolean(item.key) &&
      (Boolean(item.link) || (item.children?.length ?? 0) > 0),
  ),
)

const moduleKey = computed(() => String(route.params.moduleKey || ''))
const moduloSelecionado = computed(() =>
  moduleKey.value ? menus.value.find((item) => item.key === moduleKey.value) : undefined,
)
const cards = computed(() => {
  if (!moduloSelecionado.value) return menus.value
  return (moduloSelecionado.value.children || []).filter((item) => item.show !== false)
})
const title = computed(() => moduloSelecionado.value?.nome || 'Módulos do sistema')
const description = computed(() =>
  moduloSelecionado.value
    ? `Escolha uma opção de ${moduloSelecionado.value.nome.toLocaleLowerCase('pt-BR')}.`
    : 'Escolha um módulo para continuar.',
)

function cardColor(entry: Pick<SidebarMenuType, 'color'>) {
  return colorClasses[entry.color || 'blue']
}

function entryIcon(entry?: Pick<SidebarMenuType, 'icone'>): Component {
  return (entry?.icone as Component) || LayoutGrid
}

function openEntry(entry: NavigationEntry | Omit<NavigationEntry, 'children'>) {
  if ('children' in entry && entry.children?.length && entry.key) {
    void router.push({ name: 'navegacao-cards-modulo', params: { moduleKey: entry.key } })
    return
  }
  if (entry.key === 'dashboard') {
    void router.push('/dashboard')
    return
  }
  if (entry.link) void router.push(entry.link)
}

function voltarParaModulos() {
  void router.push('/')
}

watch(
  [moduleKey, menus],
  () => {
    if (moduleKey.value && !moduloSelecionado.value) void router.replace('/')
  },
  { immediate: true },
)
</script>

<template>
  <section class="mx-auto w-full max-w-[85rem] space-y-6 py-2 sm:py-4">
    <header class="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex min-w-0 items-start gap-3">
          <div
            class="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"
          >
            <component :is="entryIcon(moduloSelecionado)" class="h-6 w-6" />
          </div>
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Acesso simplificado
            </p>
            <h1 class="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{{ title }}</h1>
            <p class="mt-1 text-sm text-muted-foreground">{{ description }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Badge variant="secondary"
            >{{ cards.length }} {{ cards.length === 1 ? 'opção' : 'opções' }}</Badge
          >
          <Button
            v-if="moduloSelecionado"
            type="button"
            variant="outline"
            size="sm"
            @click="voltarParaModulos"
          >
            <ArrowLeft class="mr-1.5 h-4 w-4" />Módulos
          </Button>
        </div>
      </div>
    </header>

    <div v-if="cards.length" class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <button
        v-for="entry in cards"
        :key="entry.key || entry.nome"
        type="button"
        class="group min-h-44 rounded-2xl border bg-card p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        @click="openEntry(entry)"
      >
        <div class="flex items-start justify-between gap-4">
          <span class="grid h-11 w-11 place-items-center rounded-xl" :class="cardColor(entry)">
            <component :is="entryIcon(entry)" class="h-5 w-5" />
          </span>
          <ChevronRight
            class="h-5 w-5 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
          />
        </div>
        <h2 class="mt-6 text-lg font-semibold tracking-tight">{{ entry.nome }}</h2>
        <p class="mt-2 text-sm leading-5 text-muted-foreground">
          {{
            moduloSelecionado
              ? `Abrir ${entry.nome.toLocaleLowerCase('pt-BR')}.`
              : `Acessar ${entry.nome.toLocaleLowerCase('pt-BR')}.`
          }}
        </p>
      </button>
    </div>

    <Card v-else class="border-dashed">
      <CardHeader class="items-center text-center">
        <div class="grid h-12 w-12 place-items-center rounded-xl bg-muted text-muted-foreground">
          <PackageOpen class="h-6 w-6" />
        </div>
        <CardTitle>Nenhuma opção disponível</CardTitle>
        <CardDescription>Seu perfil não possui itens acessíveis neste módulo.</CardDescription>
      </CardHeader>
      <CardContent class="flex justify-center pb-6">
        <Button type="button" variant="outline" @click="voltarParaModulos">Ver módulos</Button>
      </CardContent>
    </Card>
  </section>
</template>
