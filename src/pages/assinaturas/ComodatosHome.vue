<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useToast } from 'vue-toastification'
import { Package, RefreshCcw, Search } from 'lucide-vue-next'

import ModalView from '@/components/formulario/ModalView.vue'
import MobileBottomBar from '@/components/mobile/MobileBottomBar.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AssinaturaRepository, type AssinaturaComodatoListItem } from '@/repositories/assinatura-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatDateToPtBR } from '@/utils/formatters'
import { getStatusComodatoMeta, statusComodatoOptions } from './shared'

const toast = useToast()
const uiStore = useUiStore()

const loading = ref(false)
const showSearchModal = ref(false)
const search = ref('')
const status = ref<'TODOS' | 'EM_USO' | 'DEVOLVIDO' | 'PERDIDO' | 'AVARIADO'>('TODOS')
const comodatos = ref<AssinaturaComodatoListItem[]>([])

async function loadComodatos(showFeedback = false) {
  try {
    loading.value = true
    const response = await AssinaturaRepository.listarComodatos({
      search: search.value || undefined,
      status: status.value,
    })
    comodatos.value = response.data

    if (showFeedback) {
      toast.success('Comodatos atualizados.')
    }
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar os comodatos.')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadComodatos()
})
</script>

<template>
  <div class="space-y-4 pb-20 md:pb-0">
    <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Package class="h-6 w-6 text-primary" :stroke-width="2.5" />
          Comodatos
        </h2>
        <p class="text-sm text-muted-foreground">
          Controle equipamentos cedidos nas assinaturas recorrentes e acompanhe devoluções.
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button variant="outline" class="gap-2" @click="showSearchModal = true">
          <Search class="h-4 w-4" /> Buscar
        </Button>
        <Button variant="outline" class="gap-2" @click="loadComodatos(true)">
          <RefreshCcw class="h-4 w-4" :class="loading ? 'animate-spin' : ''" /> Atualizar
        </Button>
      </div>
    </div>

    <Card class="border-border/70 bg-card shadow-sm">
      <CardContent class="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{{ comodatos.length }} registro(s)</Badge>
          <Badge v-if="status !== 'TODOS'" variant="outline">Status: {{ status }}</Badge>
          <Badge v-if="search" variant="outline">Busca: {{ search }}</Badge>
        </div>
        <div class="flex flex-wrap gap-2">
          <Select v-model="status">
            <SelectTrigger class="w-[180px] bg-card">
              <SelectValue placeholder="Filtrar status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="item in statusComodatoOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" @click="loadComodatos(true)">Aplicar</Button>
        </div>
      </CardContent>
    </Card>

    <div v-if="loading" class="rounded-2xl border border-border/70 bg-card p-8 text-center text-sm text-muted-foreground">
      Carregando comodatos...
    </div>

    <div v-else-if="!comodatos.length" class="rounded-2xl border border-dashed border-border/70 bg-card p-8 text-center">
      <p class="font-medium text-foreground">Nenhum comodato encontrado</p>
      <p class="mt-1 text-sm text-muted-foreground">Marque itens de produto como comodato nas assinaturas para acompanhar este fluxo.</p>
    </div>

    <div v-else class="grid gap-4 xl:grid-cols-2">
      <Card v-for="item in comodatos" :key="item.id" class="border-border/70 bg-card shadow-sm">
        <CardHeader class="space-y-3">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle class="text-lg">{{ item.produto?.nome || 'Produto sem vínculo' }}</CardTitle>
              <p class="text-sm text-muted-foreground">{{ item.assinatura.nomeContrato }} • {{ item.assinatura.cliente }}</p>
            </div>
            <Badge :class="getStatusComodatoMeta(item.status).className">
              {{ getStatusComodatoMeta(item.status).label }}
            </Badge>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-3 md:grid-cols-3">
            <div class="rounded-xl border border-border/60 bg-muted/10 p-3">
              <p class="text-xs uppercase tracking-wide text-muted-foreground">Quantidade</p>
              <p class="mt-1 text-base font-semibold text-foreground">{{ item.quantidade }}</p>
            </div>
            <div class="rounded-xl border border-border/60 bg-muted/10 p-3">
              <p class="text-xs uppercase tracking-wide text-muted-foreground">Entrega</p>
              <p class="mt-1 text-sm font-medium text-foreground">{{ formatDateToPtBR(item.dataEntrega) }}</p>
            </div>
            <div class="rounded-xl border border-border/60 bg-muted/10 p-3">
              <p class="text-xs uppercase tracking-wide text-muted-foreground">Devolução</p>
              <p class="mt-1 text-sm font-medium text-foreground">{{ item.dataDevolucao ? formatDateToPtBR(item.dataDevolucao) : '-' }}</p>
            </div>
          </div>

          <div class="text-sm text-muted-foreground">
            Identificação: <span class="font-medium text-foreground">{{ item.identificacao || 'Não informada' }}</span>
          </div>

          <RouterLink :to="`/assinaturas/assinaturas/${item.assinatura.id}`">
            <Button variant="outline" class="w-full">Abrir assinatura</Button>
          </RouterLink>
        </CardContent>
      </Card>
    </div>

    <ModalView v-model:open="showSearchModal" title="Buscar comodatos" description="Filtre por cliente, contrato ou UID da assinatura.">
      <div class="space-y-4 px-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground">Busca</label>
          <Input v-model="search" placeholder="Cliente, contrato ou UID" @keyup.enter="loadComodatos(true); showSearchModal = false" />
        </div>
        <div class="flex gap-2">
          <Button variant="outline" class="flex-1" @click="search = ''; status = 'TODOS'">Limpar</Button>
          <Button class="flex-1" @click="loadComodatos(true); showSearchModal = false">Aplicar</Button>
        </div>
      </div>
    </ModalView>

    <MobileBottomBar v-if="uiStore.isMobile">
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="showSearchModal = true">
        <Search class="h-5 w-5" />
        <span class="text-xs">Busca</span>
      </button>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="status = 'TODOS'; search = ''; loadComodatos(true)">
        <Package class="h-5 w-5" />
        <span class="text-xs">Limpar</span>
      </button>
      <RouterLink to="/assinaturas/assinaturas" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300">
        <Package class="h-5 w-5" />
        <span class="text-xs">Assinaturas</span>
      </RouterLink>
      <button type="button" class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300" @click="loadComodatos(true)">
        <RefreshCcw class="h-5 w-5" />
        <span class="text-xs">Atualizar</span>
      </button>
    </MobileBottomBar>
  </div>
</template>
