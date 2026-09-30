<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { Clock3, FilePlus2, Info, Paperclip, ScrollText } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import type { FiscalDocument } from '@/repositories/notas-fiscais-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import FiscalDocumentSteps from './FiscalDocumentSteps.vue'
import FiscalStatusBadge from './FiscalStatusBadge.vue'
import { formatFiscalDate, statusClass } from './fiscalPresentation'
import { fiscalNumber, fiscalTimeline, statusSummary } from './fiscalDetailPresentation'

const props = defineProps<{ document: FiscalDocument }>()
const summary = computed(() => statusSummary(props.document))
const timeline = computed(() => fiscalTimeline(props.document))
const logsOpen = ref(false)
const logsPanel = ref<HTMLElement | null>(null)
async function showLogs() {
  logsOpen.value = !logsOpen.value
  if (logsOpen.value) {
    await nextTick()
    logsPanel.value?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="space-y-4 text-sm">
    <div class="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
      <section
        class="overflow-hidden rounded-2xl border bg-card"
        aria-label="Processamento da nota"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h3 class="font-semibold">Processamento da nota</h3>
            <p class="mt-1 text-muted-foreground">Etapa atual do fluxo de emissão</p>
          </div>
          <FiscalStatusBadge :status="document.status" :error="document.erroMensagem" />
        </div>
        <div class="p-5">
          <FiscalDocumentSteps :document="document" :framed="false" />
          <div
            class="mt-6 flex items-start gap-3 rounded-xl border p-4"
            :class="statusClass(document.status)"
            role="status"
          >
            <Info class="mt-0.5 size-5 shrink-0" />
            <div>
              <p class="font-semibold">{{ summary[0] }}</p>
              <p class="mt-1 leading-relaxed">{{ summary[1] }}</p>
            </div>
          </div>
          <p
            v-if="document.erroMensagem"
            class="mt-3 break-words rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-destructive"
          >
            <strong>Ocorrência:</strong> {{ document.erroMensagem }}
          </p>
          <div class="mt-5 flex flex-wrap gap-2"><slot name="processing" /></div>
        </div>
      </section>
      <section class="overflow-hidden rounded-2xl border bg-card" aria-label="Resumo da nota">
        <div class="border-b px-5 py-4">
          <h3 class="font-semibold">Resumo da nota</h3>
          <p class="mt-1 text-muted-foreground">Informações principais</p>
        </div>
        <div class="space-y-4 p-5">
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl border bg-muted/30 p-4">
              <p class="text-xs uppercase tracking-wide text-muted-foreground">Número</p>
              <p class="mt-1 break-words text-lg font-semibold">{{ fiscalNumber(document) }}</p>
            </div>
            <div class="rounded-xl border bg-muted/30 p-4">
              <p class="text-xs uppercase tracking-wide text-muted-foreground">Valor</p>
              <p class="mt-1 text-lg font-semibold">
                {{ formatCurrencyBR(document.totais?.valorNota ?? document.valorTotal) }}
              </p>
            </div>
          </div>
          <dl class="space-y-3">
            <div>
              <dt class="text-xs text-muted-foreground">
                {{ document.tipo === 'NFSE' ? 'Tomador' : 'Cliente' }}
              </dt>
              <dd class="mt-1 font-medium">
                {{ document.destinatario?.nome || document.cliente?.nome || 'Consumidor final' }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Venda</dt>
              <dd class="mt-1 font-medium">
                {{
                  document.vendaUid || (document.vendaId ? `#${document.vendaId}` : 'Nota avulsa')
                }}
              </dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Criada em</dt>
              <dd class="mt-1 font-medium">{{ formatFiscalDate(document.criadoEm) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Atualizada em</dt>
              <dd class="mt-1 font-medium">{{ formatFiscalDate(document.atualizadaEm) }}</dd>
            </div>
          </dl>
          <div class="rounded-xl border border-dashed p-4">
            <p class="mb-2 text-xs uppercase tracking-wide text-muted-foreground">Situação</p>
            <FiscalStatusBadge :status="document.status" />
          </div>
        </div>
      </section>
    </div>
    <div class="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
      <section class="overflow-hidden rounded-2xl border bg-card" aria-label="Itens da nota">
        <div class="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h3 class="font-semibold">
              {{ document.tipo === 'NFSE' ? 'Serviço da nota' : 'Itens da nota' }}
            </h3>
            <p class="mt-1 text-muted-foreground">
              {{
                document.tipo === 'NFSE' ? 'Descrição do serviço prestado' : 'Produtos incluídos'
              }}
            </p>
          </div>
          <span v-if="document.itens?.length" class="text-xs text-muted-foreground"
            >{{ document.itens.length }} {{ document.itens.length === 1 ? 'item' : 'itens' }}</span
          >
        </div>
        <div class="space-y-3 p-5">
          <div
            v-for="item in document.itens"
            :key="item.id"
            class="flex items-start justify-between gap-4 rounded-xl border p-4"
          >
            <div class="min-w-0">
              <p class="font-semibold">{{ item.quantidade }} × {{ item.descricao }}</p>
              <p v-if="item.produtoId" class="mt-1 text-xs text-muted-foreground">
                Código: {{ item.produtoId }}
              </p>
            </div>
            <strong class="shrink-0">{{ formatCurrencyBR(item.valorTotal) }}</strong>
          </div>
          <p
            v-if="document.discriminacao"
            class="whitespace-pre-wrap rounded-xl border p-4 leading-relaxed"
          >
            {{ document.discriminacao }}
          </p>
          <p
            v-if="!document.itens?.length && !document.discriminacao"
            class="text-muted-foreground"
          >
            Nenhum item registrado nesta nota.
          </p>
        </div>
      </section>
      <section class="overflow-hidden rounded-2xl border bg-card" aria-label="Linha do tempo">
        <div class="border-b px-5 py-4">
          <h3 class="font-semibold">Linha do tempo</h3>
          <p class="mt-1 text-muted-foreground">Eventos do processamento</p>
        </div>
        <ol class="p-5">
          <li v-for="(event, index) in timeline" :key="event.id" class="flex gap-4">
            <div class="flex flex-col items-center">
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-full border"
                :class="statusClass(event.state)"
                ><FilePlus2 v-if="event.id === 'created'" class="size-4" /><Clock3
                  v-else
                  class="size-4" /></span
              ><span
                v-if="index < timeline.length - 1"
                class="my-2 w-px flex-1 bg-border"
                aria-hidden="true"
              />
            </div>
            <div :class="index < timeline.length - 1 ? 'min-w-0 pb-5' : 'min-w-0'">
              <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p class="font-semibold">{{ event.title }}</p>
                <time class="text-xs text-muted-foreground">{{
                  formatFiscalDate(event.date)
                }}</time>
              </div>
              <p class="mt-1 break-words leading-relaxed text-muted-foreground">
                {{ event.description }}
              </p>
            </div>
          </li>
        </ol>
      </section>
    </div>
    <section class="overflow-hidden rounded-2xl border bg-card" aria-label="Arquivos e ações">
      <div class="border-b px-5 py-4">
        <h3 class="font-semibold">Arquivos e ações</h3>
        <p class="mt-1 text-muted-foreground">Disponibilidade conforme avanço do processo</p>
      </div>
      <div class="space-y-4 p-5">
        <div class="grid gap-3 md:grid-cols-3">
          <div class="md:col-span-2"><slot name="files" /></div>
          <Button
            variant="outline"
            class="h-auto justify-between rounded-xl p-4 text-left whitespace-normal"
            :aria-expanded="logsOpen"
            :aria-controls="`fiscal-logs-${document.id}`"
            @click="showLogs"
            ><span
              ><span class="block font-medium">Logs técnicos</span
              ><span class="mt-1 block text-xs font-normal text-muted-foreground"
                >Detalhes do processamento</span
              ></span
            ><ScrollText class="ml-3 shrink-0"
          /></Button>
        </div>
        <p
          v-if="!document.xmlDisponivel && !document.pdfDisponivel"
          class="flex items-center gap-2 text-xs text-muted-foreground"
        >
          <Paperclip class="size-4 shrink-0" />Os arquivos serão disponibilizados após a confirmação
          da emissão.
        </p>
        <slot name="management" />
        <div
          v-if="logsOpen"
          :id="`fiscal-logs-${document.id}`"
          ref="logsPanel"
          class="space-y-3 rounded-xl border bg-muted/20 p-4"
          aria-label="Logs técnicos"
        >
          <h4 class="font-semibold">Detalhes do processamento</h4>
          <dl class="grid gap-3 sm:grid-cols-2">
            <div>
              <dt class="text-xs text-muted-foreground">Registro</dt>
              <dd>#{{ document.id }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">Provedor</dt>
              <dd>{{ document.provedor || '—' }}</dd>
            </div>
            <div v-if="document.protocolo">
              <dt class="text-xs text-muted-foreground">Protocolo</dt>
              <dd class="break-all">{{ document.protocolo }}</dd>
            </div>
          </dl>
          <ul v-if="document.eventos?.length" class="divide-y">
            <li v-for="event in document.eventos" :key="event.id" class="py-2">
              <p class="font-medium">{{ event.tipo }} · {{ event.status }}</p>
              <p class="mt-1 text-xs text-muted-foreground">
                {{ formatFiscalDate(event.createdAt) }}
              </p>
              <p v-if="event.motivo" class="mt-1 break-words text-muted-foreground">
                {{ event.motivo }}
              </p>
            </li>
          </ul>
          <p v-else class="text-muted-foreground">Nenhum evento adicional registrado.</p>
        </div>
      </div>
    </section>
  </div>
</template>
