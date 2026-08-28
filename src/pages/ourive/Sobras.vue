<template>
  <section class="space-y-6 [&_.text-muted-foreground]:text-foreground/70">
    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold">
          <Scale class="h-6 w-6 text-primary" />Sobras e quebras
        </h2>
        <p class="mt-1 text-sm text-muted-foreground">
          Pese o material recuperável e escolha a variante certa antes de disponibilizá-lo no estoque.
        </p>
      </div>
      <Button variant="outline" :disabled="loading" @click="load">
        <RefreshCw class="mr-2 h-4 w-4" :class="loading && 'animate-spin'" />Atualizar
      </Button>
    </div>

    <div class="grid gap-3 sm:grid-cols-3">
      <Card>
        <CardContent class="p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pendentes</p>
          <p class="mt-1 text-2xl font-bold">{{ leftovers.length }}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Fluxo</p>
          <p class="mt-1 text-sm font-semibold">Pese e classifique cada material.</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent class="p-4">
          <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Como funciona</p>
          <p class="mt-1 text-sm font-semibold">A entrada é feita sem custo após a pesagem.</p>
        </CardContent>
      </Card>
    </div>

    <div v-if="loading" class="py-12 text-center text-sm text-muted-foreground">
      Carregando sobras e quebras…
    </div>
    <div v-else-if="!leftovers.length" class="rounded-xl border border-dashed p-10 text-center">
      <Scale class="mx-auto h-8 w-8 text-muted-foreground" />
      <p class="mt-3 font-semibold">Nenhuma sobra pendente</p>
      <p class="mt-1 text-sm text-muted-foreground">
        Quando um material for fechado com sobra ou quebra recuperável, ele aparecerá aqui.
      </p>
    </div>
    <div v-else class="grid gap-4 xl:grid-cols-2">
      <Card v-for="leftover in leftovers" :key="leftover.id" class="overflow-hidden">
        <CardContent class="space-y-4 p-5">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-300">
                {{ leftover.tipo === 'QUEBRA' ? 'Quebra recuperável' : 'Sobra reaproveitável' }}
              </p>
              <h3 class="mt-1 truncate text-lg font-bold">
                {{
                  leftover.produtoOrigem?.nome ||
                  (leftover.materialFornecidoPeloCliente
                    ? 'Material fornecido pelo cliente'
                    : 'Material de origem não disponível')
                }}
              </h3>
              <p class="mt-1 text-sm text-muted-foreground">
                Informado no fechamento: {{ measure(leftover.medidaInformada, leftover.unidade) }}
              </p>
              <div v-if="leftover.pecas?.some((piece: any) => piece.pesoInformado != null)" class="mt-2 text-sm text-muted-foreground">
                <p class="font-medium text-foreground">Peso estimado das peças</p>
                <template v-for="(piece, index) in leftover.pecas" :key="`${leftover.id}-${index}`">
                  <p v-if="piece.pesoInformado != null" class="truncate">
                    {{ piece.descricao }}: {{ measure(piece.pesoInformado, 'PESO') }}
                  </p>
                </template>
              </div>
            </div>
            <Badge variant="outline" class="border-amber-500/50 text-amber-700 dark:text-amber-300">
              Pendente
            </Badge>
          </div>

          <div class="rounded-lg bg-muted/45 p-3 text-sm">
            <p class="font-medium">{{ leftover.ordem?.codigoRastreio || 'Ordem não disponível' }}</p>
            <p class="mt-1 text-muted-foreground">
              {{ leftover.ordem?.descricao || 'Material aguardando classificação de destino.' }}
            </p>
          </div>

          <div class="grid gap-3">
            <label class="grid gap-1 text-xs font-medium text-muted-foreground">
              {{ realMeasureLabel(leftover.unidade) }}
              <Input
                v-model.number="formFor(leftover).medidaReal"
                type="number"
                min="1"
                step="1"
                :placeholder="leftover.unidade === 'PESO' ? 'Ex.: 8' : 'Ex.: 1'"
              />
              <span class="font-normal">
                O estoque atual trabalha com {{ unitLabel(leftover.unidade) }} inteiras.
              </span>
            </label>
            <label class="grid gap-1 text-xs font-medium text-muted-foreground">
              <span class="flex items-center justify-between gap-2">
                Produto ou variante de destino
                <Button
                  v-if="leftover.produtoOrigemId"
                  type="button"
                  size="sm"
                  variant="link"
                  class="h-auto px-0 text-xs"
                  @click="useOrigin(leftover)"
                >
                  Usar material de origem
                </Button>
              </span>
              <Select2Ajax
                v-model="formFor(leftover).produtoDestinoId"
                url="/produtos/select2"
                placeholder="Selecione onde esta sobra entrará"
              />
              <span class="font-normal">
                {{
                  leftover.produtoOrigemId
                    ? 'A origem já vem selecionada; pesquise e escolha outra variante quando necessário.'
                    : 'Selecione a variante de destino para registrar este material no estoque.'
                }}
              </span>
            </label>
            <label class="grid gap-1 text-xs font-medium text-muted-foreground">
              Observação (opcional)
              <Input
                v-model="formFor(leftover).observacao"
                placeholder="Ex.: ouro 18k reaproveitável"
              />
            </label>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              class="-ml-2 text-muted-foreground"
              @click="openOrder(leftover)"
            >
              Abrir ordem <ExternalLink class="ml-2 h-4 w-4" />
            </Button>
            <Button :disabled="consolidatingId === leftover.id" @click="consolidate(leftover)">
              <PackagePlus class="mr-2 h-4 w-4" />
              {{ consolidatingId === leftover.id ? 'Consolidando…' : 'Consolidar no estoque' }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </section>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { ExternalLink, PackagePlus, RefreshCw, Scale } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { OuriveRepository } from '@/repositories/ourive-repository'

const router = useRouter()
const toast = useToast()
const leftovers = ref<any[]>([])
const loading = ref(false)
const consolidatingId = ref<number | null>(null)
const forms = reactive<
  Record<number, { medidaReal: number; produtoDestinoId: number | null; observacao: string }>
>({})
const unitLabel = (unit: string) => (unit === 'PESO' ? 'g' : 'un.')
const realMeasureLabel = (unit: string) =>
  unit === 'PESO' ? 'Peso real pesado (g)' : 'Quantidade real recuperável (un.)'
const measure = (value: unknown, unit: string) =>
  `${Number(value || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: unit === 'PESO' ? 3 : 0,
  })} ${unitLabel(unit)}`

function formFor(leftover: any) {
  if (!forms[leftover.id]) {
    forms[leftover.id] = {
      medidaReal: Number(leftover.medidaInformada || 0),
      produtoDestinoId: leftover.produtoDestinoId ? Number(leftover.produtoDestinoId) : null,
      observacao: leftover.observacao || '',
    }
  }
  return forms[leftover.id]
}
function useOrigin(leftover: any) {
  formFor(leftover).produtoDestinoId = Number(leftover.produtoOrigemId) || null
}

async function load() {
  loading.value = true
  try {
    leftovers.value = await OuriveRepository.sobras()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível carregar as sobras.')
  } finally {
    loading.value = false
  }
}

function openOrder(leftover: any) {
  router.push({ name: 'ourive-ordem', params: { id: leftover.ordemOuriveId } })
}

async function consolidate(leftover: any) {
  const form = formFor(leftover)
  if (!Number.isFinite(form.medidaReal) || form.medidaReal <= 0)
    return toast.info(
      leftover.unidade === 'PESO'
        ? 'Informe o peso real pesado.'
        : 'Informe a quantidade real recuperável.',
    )
  if (!Number.isInteger(form.medidaReal))
    return toast.info(`O estoque atual aceita somente ${unitLabel(leftover.unidade)} inteiras.`)
  if (!form.produtoDestinoId) return toast.info('Selecione o produto ou variante de destino.')
  consolidatingId.value = leftover.id
  try {
    await OuriveRepository.consolidarSobra(leftover.id, {
      produtoDestinoId: Number(form.produtoDestinoId),
      medidaReal: form.medidaReal,
      observacao: form.observacao || undefined,
    })
    toast.success('Sobra consolidada no estoque sem custo para a empresa.')
    await load()
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível consolidar a sobra.')
  } finally {
    consolidatingId.value = null
  }
}

onMounted(load)
</script>
