<template>
  <main class="min-h-screen bg-stone-100 p-4 dark:bg-stone-950 sm:p-8">
    <section class="mx-auto max-w-2xl rounded-3xl border bg-background p-6 shadow-xl sm:p-10">
      <p class="text-xs font-bold tracking-[0.2em] text-amber-700">ATELIÊ · ORÇAMENTO SEGURO</p>
      <div v-if="loading" class="py-20 text-center text-muted-foreground">
        Carregando orçamento…
      </div>
      <div v-else-if="budget">
        <h1 class="mt-3 text-3xl font-bold">{{ budget.ordem.codigoRastreio }}</h1>
        <p class="mt-1 text-muted-foreground">
          Olá, {{ budget.ordem.cliente || 'cliente' }}. Revise a proposta para suas peças.
        </p>
        <div class="mt-6 space-y-4 rounded-2xl bg-muted/60 p-5">
          <div v-for="piece in budget.ordem.pecas" :key="piece.codigoRastreio">
            <p><strong>{{ piece.codigoRastreio }}</strong> — {{ piece.descricao }}</p>
            <div v-if="piece.fotos?.length" class="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <a
                v-for="photo in piece.fotos"
                :key="photo.id"
                :href="photo.url"
                target="_blank"
                rel="noopener"
                class="overflow-hidden rounded-xl border bg-background"
              >
                <img
                  :src="photo.url"
                  :alt="photo.descricao || `Foto da peça ${piece.codigoRastreio}`"
                  class="aspect-square h-full w-full object-cover"
                />
              </a>
            </div>
          </div>
        </div>
        <div class="mt-6 rounded-2xl border p-5">
          <p class="text-sm text-muted-foreground">
            Orçamento versão {{ budget.orcamento.versao }}
          </p>
          <div
            v-for="service in budget.orcamento.servicos"
            :key="service.descricao"
            class="mt-3 flex justify-between gap-4"
          >
            <span>{{ service.quantidade }}× {{ service.descricao }}</span>
            <span>{{ money(Number(service.quantidade || 0) * Number(service.valor || 0)) }}</span>
          </div>
          <div v-if="materiaisEmpresa.length" class="mt-5 border-t pt-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Materiais fornecidos pela empresa
            </p>
            <div
              v-for="material in materiaisEmpresa"
              :key="`empresa-${material.descricao}-${material.quantidade}`"
              class="mt-3 flex justify-between gap-4"
            >
              <span>{{ measure(material) }} {{ material.descricao }}</span>
              <span>{{
                money(Number(material.quantidade || 0) * Number(material.valorUnitario || 0))
              }}</span>
            </div>
          </div>
          <div v-if="materiaisCliente.length" class="mt-5 border-t pt-4">
            <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Material fornecido pelo cliente
            </p>
            <div
              v-for="material in materiaisCliente"
              :key="`cliente-${material.descricao}-${material.quantidade}`"
              class="mt-3 flex justify-between gap-4 text-muted-foreground"
            >
              <span>{{ measure(material) }} {{ material.descricao }}</span>
              <span>Não cobrado</span>
            </div>
          </div>
          <div class="mt-5 space-y-2 border-t pt-4 text-sm">
            <div class="flex justify-between">
              <span>Subtotal</span><span>{{ money(subtotal) }}</span>
            </div>
            <div
              v-if="Number(budget.orcamento.desconto)"
              class="flex justify-between font-medium text-destructive"
            >
              <span>Desconto</span><span>− {{ money(budget.orcamento.desconto) }}</span>
            </div>
            <div class="flex justify-between pt-2 text-xl font-bold">
              <span>Total</span><span>{{ money(budget.orcamento.valorFinal) }}</span>
            </div>
          </div>
        </div>
        <div
          v-if="hasDecision"
          class="mt-5 rounded-2xl border p-4"
          :class="
            budget.orcamento.aprovadoEm
              ? 'border-emerald-500/35 bg-emerald-500/10'
              : 'border-destructive/35 bg-destructive/10'
          "
        >
          <p
            class="font-semibold"
            :class="
              budget.orcamento.aprovadoEm
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-destructive'
            "
          >
            {{ budget.orcamento.aprovadoEm ? 'Orçamento aprovado' : 'Orçamento recusado' }}
          </p>
          <p class="mt-1 text-sm text-muted-foreground">
            Decisão registrada em
            {{ formatDecisionDate(budget.orcamento.aprovadoEm || budget.orcamento.recusadoEm) }}.
          </p>
          <p v-if="budget.orcamento.aprovacaoOrigem" class="mt-1 text-xs text-muted-foreground">
            Origem:
            {{
              budget.orcamento.aprovacaoOrigem === 'LINK_PUBLICO'
                ? 'Link de aceite'
                : 'Registro interno'
            }}.
          </p>
          <p v-if="budget.orcamento.aprovacaoObservacao" class="mt-3 border-t pt-3 text-sm">
            <strong>Observação:</strong> {{ budget.orcamento.aprovacaoObservacao }}
          </p>
        </div>
        <p v-else class="mt-4 text-sm text-muted-foreground">
          Este link expira em {{ new Date(budget.orcamento.expiraEm).toLocaleString('pt-BR') }}.
        </p>
        <textarea
          v-if="!hasDecision"
          v-model="observation"
          class="mt-6 min-h-24 w-full rounded-xl border bg-background p-3"
          placeholder="Observação para o ateliê (opcional)"
        />
        <div v-if="!hasDecision" class="mt-4 grid gap-3 sm:grid-cols-2">
          <Button variant="outline" :disabled="sending" @click="decide('RECUSAR')"
            >Recusar orçamento</Button
          ><Button :disabled="sending" @click="decide('APROVAR')">Aprovar orçamento</Button>
        </div>
      </div>
      <div v-else class="py-20 text-center">
        <h1 class="text-2xl font-bold">Orçamento indisponível</h1>
        <p class="mt-2 text-muted-foreground">O link expirou, foi substituído ou não é válido.</p>
      </div>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useToast } from 'vue-toastification'
import http from '@/utils/axios'
import { Button } from '@/components/ui/button'
const route = useRoute()
const toast = useToast()
const loading = ref(true)
const budget = ref<any>()
const observation = ref('')
const sending = ref(false)
const money = (value: unknown) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0))
const measure = (material: any) =>
  `${Number(material.quantidade || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: material.unidade === 'PESO' ? 3 : 0,
  })} ${material.unidade === 'PESO' ? 'g' : 'un.'}`
const subtotal = computed(() => {
  const servicos = (budget.value?.orcamento?.servicos || []).reduce(
    (total: number, service: any) =>
      total + Number(service.quantidade || 0) * Number(service.valor || 0),
    0,
  )
  const materiais = Number(
    budget.value?.orcamento?.totalMateriaisEmpresa ??
      (budget.value?.orcamento?.materiais || []).reduce(
        (total: number, material: any) =>
          material.fornecidoPeloCliente
            ? total
            : total + Number(material.quantidade || 0) * Number(material.valorUnitario || 0),
        0,
      ),
  )
  return servicos + materiais
})
const materiaisEmpresa = computed(() =>
  (budget.value?.orcamento?.materiaisEmpresa || budget.value?.orcamento?.materiais || []).filter(
    (material: any) => !material.fornecidoPeloCliente,
  ),
)
const materiaisCliente = computed(() =>
  (budget.value?.orcamento?.materiaisCliente || budget.value?.orcamento?.materiais || []).filter(
    (material: any) => material.fornecidoPeloCliente,
  ),
)
const hasDecision = computed(() =>
  Boolean(budget.value?.orcamento?.aprovadoEm || budget.value?.orcamento?.recusadoEm),
)
const formatDecisionDate = (value?: string | Date) =>
  value ? new Date(value).toLocaleString('pt-BR') : 'não informada'
async function load() {
  try {
    const { data } = await http.get(`/v1/ourive/publico/orcamentos/${route.params.token}`)
    budget.value = data.data
  } catch {
    budget.value = null
  } finally {
    loading.value = false
  }
}
async function decide(decisao: 'APROVAR' | 'RECUSAR') {
  sending.value = true
  try {
    await http.post(`/v1/ourive/publico/orcamentos/${route.params.token}/decisao`, {
      decisao,
      observacao: observation.value || undefined,
    })
    await load()
    toast.success('Sua decisão foi registrada.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível registrar a decisão.')
  } finally {
    sending.value = false
  }
}
onMounted(load)
</script>
