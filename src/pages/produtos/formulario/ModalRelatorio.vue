<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { format } from 'date-fns'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ProdutoRepository } from '@/repositories/produto-repository'
import { useProdutoStore } from '@/stores/produtos/useProduto'
import { FilePlus, FileSearch, Layers3, Package, TrendingUp } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

const store = useProdutoStore()
const toast = useToast()
const loading = ref(false)
const filtroPeriodo = ref<[Date, Date] | null>(null)

const reportTypeMeta = computed(() => {
  switch (store.reportForm.reportType) {
    case 'catalogo':
      return {
        title: 'Catálogo e estoque',
        description: 'Exporta o catálogo geral com produto base, variante, preço e estoque. O período filtra a data de cadastro.',
        icon: FileSearch,
      }
    case 'movimentacoes':
      return {
        title: 'Movimentações da variante',
        description: 'Exporta entradas e saídas de estoque da variante selecionada, com totais e saldo líquido.',
        icon: Layers3,
      }
    case 'lucro':
      return {
        title: 'Lucro por produto',
        description: 'Exporta receita, custo estimado, lucro estimado e margem do produto base ou da variante selecionada.',
        icon: TrendingUp,
      }
    default:
      return {
        title: 'Vendas do produto',
        description: 'Exporta as vendas do produto base ou da variante selecionada. Sem período, o relatório considera todo o histórico.',
        icon: Package,
      }
  }
})

const isCatalogReport = computed(() => store.reportForm.reportType === 'catalogo')
const isMovementReport = computed(() => store.reportForm.reportType === 'movimentacoes')
const requiresTarget = computed(() => !isCatalogReport.value)
const targetScopeLabel = computed(() =>
  store.reportForm.scope === 'produto-base' ? 'Produto base' : 'Variante',
)
const targetSelectKey = computed(() => `${store.reportForm.reportType}-${store.reportForm.scope}`)
const targetSelectParams = computed(() =>
  store.reportForm.scope === 'produto-base'
    ? [{ key: 'baseOnly', value: true }]
    : [],
)
const targetSelectPlaceholder = computed(() =>
  store.reportForm.scope === 'produto-base'
    ? 'Selecione o produto base'
    : 'Selecione a variante',
)

const periodoFormatado = computed(() => {
  if (!filtroPeriodo.value) {
    return {
      inicio: undefined,
      fim: undefined,
    }
  }

  const [inicio, fim] = filtroPeriodo.value

  return {
    inicio: format(inicio, "yyyy-MM-dd'T'00:00:00"),
    fim: format(fim, "yyyy-MM-dd'T'23:59:59"),
  }
})

watch(
  () => store.openModalRelatorio,
  (open) => {
    if (!open) {
      filtroPeriodo.value = null
    }
  },
)

function handleTypeChange(value: any) {
  if (value == null) return
  const nextValue = String(value) as 'catalogo' | 'movimentacoes' | 'vendas' | 'lucro'
  store.reportForm.reportType = nextValue

  if (nextValue === 'catalogo') {
    store.reportForm.scope = 'produto-base'
    store.reportForm.targetId = null
    store.reportForm.targetLabel = ''
    return
  }

  if (nextValue === 'movimentacoes') {
    store.reportForm.scope = 'variante'
  }

  store.reportForm.targetId = null
  store.reportForm.targetLabel = ''
}

function handleScopeChange(value: any) {
  if (value == null) return
  store.reportForm.scope = String(value) as 'produto-base' | 'variante'
  store.reportForm.targetId = null
  store.reportForm.targetLabel = ''
}

async function generateRelatorio() {
  try {
    if (requiresTarget.value && !store.reportForm.targetId) {
      toast.error(`Selecione ${store.reportForm.scope === 'produto-base' ? 'um produto base' : 'uma variante'}`)
      return
    }

    loading.value = true

    await ProdutoRepository.gerarRelatorio({
      reportType: store.reportForm.reportType,
      scope: store.reportForm.scope,
      targetId: store.reportForm.targetId || undefined,
      inicio: periodoFormatado.value.inicio,
      fim: periodoFormatado.value.fim,
      orderBy: store.reportForm.orderBy,
    })

    store.openModalRelatorio = false
    toast.success('Relatório gerado com sucesso')
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || error?.message || 'Erro ao gerar o relatório')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="store.openModalRelatorio"
    title="Central de relatórios de produtos"
    description="Escolha o tipo de relatório, o escopo do item e o período quando quiser filtrar o histórico."
    size="xl"
  >
    <div class="grid gap-4 px-4 pb-1">
      <div class="rounded-xl border border-border bg-muted/30 p-4">
        <div class="flex items-start gap-3">
          <component :is="reportTypeMeta.icon" class="mt-0.5 h-5 w-5 text-primary" />
          <div class="space-y-1">
            <div class="font-medium text-foreground">{{ reportTypeMeta.title }}</div>
            <p class="text-sm text-muted-foreground">
              {{ reportTypeMeta.description }}
            </p>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div class="md:col-span-6">
          <Label>Tipo de relatório</Label>
          <Select :model-value="store.reportForm.reportType" @update:model-value="handleTypeChange">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="catalogo">Catálogo e estoque</SelectItem>
                <SelectItem value="vendas">Vendas do produto</SelectItem>
                <SelectItem value="lucro">Lucro por produto</SelectItem>
                <SelectItem value="movimentacoes">Movimentações da variante</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div v-if="requiresTarget" class="md:col-span-6">
          <Label>Escopo do relatório</Label>
          <Select :model-value="store.reportForm.scope" :disabled="isMovementReport" @update:model-value="handleScopeChange">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Selecione o escopo" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="produto-base">Produto base</SelectItem>
                <SelectItem value="variante">Variante</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div v-if="requiresTarget" class="md:col-span-12">
          <Label>{{ targetScopeLabel }}</Label>
          <Select2Ajax
            :key="targetSelectKey"
            v-model:model-value="store.reportForm.targetId"
            class="w-full"
            url="/produtos/select2"
            :params="targetSelectParams"
            :allow-clear="true"
            :placeholder="targetSelectPlaceholder"
          />
          <p v-if="store.reportForm.targetLabel" class="mt-1 text-xs text-muted-foreground">
            Contexto atual sugerido: {{ store.reportForm.targetLabel }}
          </p>
        </div>

        <div class="md:col-span-12">
          <Label>Período</Label>
          <Calendarpicker v-model="filtroPeriodo" :range="true" :required="false" :teleport="true" />
          <p class="mt-1 text-xs text-muted-foreground">
            {{ isCatalogReport
              ? 'Sem período, o relatório usa todo o catálogo cadastrado.'
              : 'Sem período, o relatório usa todo o histórico faturado do item selecionado.' }}
          </p>
        </div>

        <div v-if="isMovementReport" class="md:col-span-12">
          <Label>Ordenar movimentações</Label>
          <Select v-model="store.reportForm.orderBy">
            <SelectTrigger class="w-full">
              <SelectValue placeholder="Selecione a ordem" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="desc">Mais novo → mais antigo</SelectItem>
                <SelectItem value="asc">Mais antigo → mais novo</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" :disabled="loading" @click="store.openModalRelatorio = false">
          Fechar
        </Button>
        <Button @click="generateRelatorio" class="text-white" type="button" :disabled="loading">
          <FilePlus class="h-4 w-4" />
          {{ loading ? 'Gerando...' : 'Gerar relatório' }}
        </Button>
      </div>
    </div>
  </ModalView>
</template>
