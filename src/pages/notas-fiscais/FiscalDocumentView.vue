<script setup lang="ts">
import { computed } from 'vue'
import { Building2, CircleDollarSign, Copy, Landmark, Package, User } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import type { FiscalDocument, FiscalParty } from '@/repositories/notas-fiscais-repository'
import { formatCurrencyBR } from '@/utils/formatters'
import { partyDocument } from './fiscalDetailPresentation'
import { formatFiscalDate, typeLabels } from './fiscalPresentation'
const props = defineProps<{ document: FiscalDocument }>()
const toast = useToast()
const parties = computed<
  Array<{ title: string; icon: typeof Building2; party: Partial<FiscalParty> | undefined }>
>(() => [
  {
    title: props.document.tipo === 'NFSE' ? 'Prestador' : 'Emitente',
    icon: Building2,
    party: props.document.emitente,
  },
  {
    title: props.document.tipo === 'NFSE' ? 'Tomador' : 'Destinatário',
    icon: User,
    party: props.document.destinatario || {
      nome: props.document.cliente?.nome,
      documento: props.document.cliente?.documento,
    },
  },
])
const currency = (value?: number | null) => (value == null ? '—' : formatCurrencyBR(value))
async function copyKey() {
  if (!props.document.chaveAcesso) return
  try {
    await navigator.clipboard.writeText(props.document.chaveAcesso)
    toast.success('Chave de acesso copiada.')
  } catch {
    toast.error('Não foi possível copiar a chave de acesso.')
  }
}
</script>

<template>
  <div class="space-y-6 text-sm">
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-lg border bg-card p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Valor total</p>
        <p class="mt-2 text-xl font-semibold">
          {{ currency(document.totais?.valorNota ?? document.valorTotal) }}
        </p>
      </div>
      <div class="rounded-lg border bg-card p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Modelo</p>
        <p class="mt-2 font-semibold">{{ typeLabels[document.tipo] }} {{ document.modelo }}</p>
      </div>
      <div class="rounded-lg border bg-card p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Série</p>
        <p class="mt-2 font-semibold">{{ document.serie ?? '—' }}</p>
      </div>
      <div class="rounded-lg border bg-card p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">Natureza</p>
        <p class="mt-2 font-semibold">{{ document.naturezaOperacao || '—' }}</p>
      </div>
    </div>
    <div class="grid gap-6 lg:grid-cols-2">
      <section
        v-for="entry in parties"
        :key="entry.title"
        class="overflow-hidden rounded-lg border bg-card"
        :aria-label="entry.title"
      >
        <h3 class="flex items-center gap-2 border-b px-4 py-3 font-semibold">
          <component :is="entry.icon" class="size-4 text-muted-foreground" />{{ entry.title }}
        </h3>
        <dl class="space-y-4 p-4">
          <div>
            <dt class="text-xs text-muted-foreground">Nome / Razão social</dt>
            <dd class="mt-1 font-medium">
              {{ entry.party?.nome || (entry.title === 'Destinatário' ? 'Consumidor final' : '—') }}
            </dd>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <dt class="text-xs text-muted-foreground">CPF / CNPJ</dt>
              <dd class="mt-1 break-words">{{ partyDocument(entry.party?.documento) }}</dd>
            </div>
            <div>
              <dt class="text-xs text-muted-foreground">
                {{ document.tipo === 'NFSE' ? 'Inscrição municipal' : 'Inscrição estadual' }}
              </dt>
              <dd class="mt-1">
                {{
                  (document.tipo === 'NFSE'
                    ? entry.party?.inscricaoMunicipal
                    : entry.party?.inscricaoEstadual) || '—'
                }}
              </dd>
            </div>
          </div>
          <div v-if="entry.party?.telefone">
            <dt class="text-xs text-muted-foreground">Telefone</dt>
            <dd class="mt-1">{{ entry.party.telefone }}</dd>
          </div>
          <div>
            <dt class="text-xs text-muted-foreground">Endereço</dt>
            <dd class="mt-1 leading-relaxed">{{ entry.party?.endereco || '—' }}</dd>
          </div>
        </dl>
      </section>
    </div>
    <section
      class="overflow-hidden rounded-lg border bg-card"
      :aria-label="document.tipo === 'NFSE' ? 'Serviços' : 'Produtos'"
    >
      <div class="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h3 class="flex items-center gap-2 font-semibold">
          <Package class="size-4 text-muted-foreground" />{{
            document.tipo === 'NFSE' ? 'Serviços' : 'Produtos'
          }}
        </h3>
        <span v-if="document.itens?.length" class="text-xs text-muted-foreground"
          >{{ document.itens.length }} {{ document.itens.length === 1 ? 'item' : 'itens' }}</span
        >
      </div>
      <div v-if="document.itens?.length" class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-muted/30 text-xs uppercase text-muted-foreground">
            <tr>
              <th class="px-4 py-3 font-medium">Produto</th>
              <th class="px-4 py-3 font-medium">NCM</th>
              <th class="px-4 py-3 text-center font-medium">Qtd.</th>
              <th class="px-4 py-3 text-right font-medium">Unitário</th>
              <th class="px-4 py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="item in document.itens" :key="item.id" class="hover:bg-muted/20">
              <td class="min-w-44 px-4 py-4">
                <p class="font-medium">{{ item.descricao }}</p>
                <p v-if="item.produtoId" class="mt-0.5 text-xs text-muted-foreground">
                  Código: {{ item.produtoId }}
                </p>
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-muted-foreground">
                {{ item.ncm || '—' }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-center text-muted-foreground">
                {{ item.quantidade }} {{ item.unidade }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-right text-muted-foreground">
                {{ currency(item.valorUnitario) }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-right font-medium">
                {{ currency(item.valorTotal) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else-if="document.discriminacao" class="space-y-3 p-4">
        <p class="whitespace-pre-wrap leading-relaxed">{{ document.discriminacao }}</p>
        <p v-if="document.codigoServico" class="text-xs text-muted-foreground">
          Código do serviço: {{ document.codigoServico }}
        </p>
      </div>
      <p v-else class="p-4 text-muted-foreground">Nenhum item registrado nesta nota.</p>
    </section>
    <div class="grid gap-6 lg:grid-cols-2">
      <section class="overflow-hidden rounded-lg border bg-card" aria-label="Tributos">
        <h3 class="flex items-center gap-2 border-b px-4 py-3 font-semibold">
          <Landmark class="size-4 text-muted-foreground" />Tributos
        </h3>
        <dl v-if="document.tributos?.length" class="space-y-3 p-4">
          <div v-for="tax in document.tributos" :key="tax.label" class="flex justify-between gap-3">
            <dt class="text-muted-foreground">{{ tax.label }}</dt>
            <dd class="font-medium">{{ currency(tax.valor) }}</dd>
          </div>
        </dl>
        <p
          v-if="!document.tributos?.some((tax) => tax.valor != null)"
          class="px-4 pb-4 text-xs text-muted-foreground"
          :class="{ 'pt-4': !document.tributos?.length }"
        >
          Os valores serão exibidos quando disponibilizados no XML da nota.
        </p>
      </section>
      <section class="overflow-hidden rounded-lg border bg-card" aria-label="Totais">
        <h3 class="flex items-center gap-2 border-b px-4 py-3 font-semibold">
          <CircleDollarSign class="size-4 text-muted-foreground" />Totais
        </h3>
        <dl class="space-y-3 p-4">
          <div class="flex justify-between gap-3">
            <dt class="text-muted-foreground">
              {{ document.tipo === 'NFSE' ? 'Serviços' : 'Produtos' }}
            </dt>
            <dd class="font-medium">{{ currency(document.totais?.produtos) }}</dd>
          </div>
          <div v-if="document.tipo !== 'NFSE'" class="flex justify-between gap-3">
            <dt class="text-muted-foreground">Frete</dt>
            <dd class="font-medium">{{ currency(document.totais?.frete) }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-muted-foreground">Desconto</dt>
            <dd class="font-medium">{{ currency(document.totais?.desconto) }}</dd>
          </div>
          <div class="flex items-center justify-between gap-3 border-t pt-3">
            <dt class="font-medium">Total da nota</dt>
            <dd class="text-xl font-semibold">
              {{ currency(document.totais?.valorNota ?? document.valorTotal) }}
            </dd>
          </div>
        </dl>
      </section>
    </div>
    <section
      v-if="document.chaveAcesso"
      class="flex flex-col justify-between gap-3 rounded-lg border bg-muted/30 p-4 sm:flex-row sm:items-center"
      aria-label="Chave de acesso"
    >
      <div class="min-w-0">
        <h3 class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Chave de acesso
        </h3>
        <p class="mt-1 break-all font-mono">{{ document.chaveAcesso }}</p>
      </div>
      <Button variant="outline" size="sm" class="shrink-0" @click="copyKey"
        ><Copy />Copiar chave</Button
      >
    </section>
    <dl
      v-if="document.protocolo || document.codigoVerificacao || document.canceladaEm"
      class="grid gap-3 rounded-lg border p-4 sm:grid-cols-2"
    >
      <div v-if="document.protocolo">
        <dt class="text-xs text-muted-foreground">Protocolo</dt>
        <dd class="mt-1 break-all font-medium">{{ document.protocolo }}</dd>
      </div>
      <div v-if="document.codigoVerificacao">
        <dt class="text-xs text-muted-foreground">Código de verificação</dt>
        <dd class="mt-1 font-medium">{{ document.codigoVerificacao }}</dd>
      </div>
      <div v-if="document.canceladaEm">
        <dt class="text-xs text-muted-foreground">Cancelada em</dt>
        <dd class="mt-1 font-medium">{{ formatFiscalDate(document.canceladaEm) }}</dd>
      </div>
    </dl>
  </div>
</template>
