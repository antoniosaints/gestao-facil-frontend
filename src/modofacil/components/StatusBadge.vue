<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ value?: string | boolean | null; label?: string }>()
const code = computed(() => String(props.value ?? '').toUpperCase())
const labels: Record<string, string> = {
  TRUE: 'Ativo',
  FALSE: 'Inativo',
  ATIVO: 'Ativo',
  INATIVO: 'Inativo',
  PAGO: 'Pago',
  EFETIVADO: 'Efetivado',
  PAGA: 'Paga',
  FATURADO: 'Faturada',
  FATURADA: 'Faturada',
  FINALIZADO: 'Finalizada',
  CONCLUIDO: 'Concluído',
  CONCLUIDA: 'Concluída',
  PENDENTE: 'Pendente',
  PARCIAL: 'Parcial',
  IGNORADO: 'Ignorado',
  ABERTA: 'Aberta',
  ABERTO: 'Aberto',
  APROVADA: 'Aprovada',
  ANDAMENTO: 'Em andamento',
  EM_ANDAMENTO: 'Em andamento',
  ORCAMENTO: 'Orçamento',
  CANCELADO: 'Cancelado',
  CANCELADA: 'Cancelada',
  ATRASADO: 'Atrasado',
  ESTORNADO: 'Estornado',
  ESTORNADA: 'Estornada',
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
  DESCARTE: 'Descarte',
  TRANSFERENCIA: 'Transferência',
  RECEITA: 'Receita',
  DESPESA: 'Despesa',
}
const tone = computed(() => {
  if (
    [
      'TRUE',
      'ATIVO',
      'PAGO',
      'EFETIVADO',
      'PAGA',
      'FATURADO',
      'FATURADA',
      'FINALIZADO',
      'CONCLUIDO',
      'CONCLUIDA',
      'ENTRADA',
      'RECEITA',
    ].includes(code.value)
  )
    return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
  if (
    [
      'FALSE',
      'INATIVO',
      'CANCELADO',
      'CANCELADA',
      'ATRASADO',
      'ESTORNADO',
      'ESTORNADA',
      'DESCARTE',
      'DESPESA',
    ].includes(code.value)
  )
    return 'bg-red-500/15 text-red-700 dark:text-red-300'
  if (['PENDENTE', 'PARCIAL', 'ABERTA', 'ABERTO', 'ORCAMENTO', 'SAIDA'].includes(code.value))
    return 'bg-orange-500/15 text-orange-700 dark:text-orange-300'
  return 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
})
</script>
<template>
  <span
    class="inline-flex max-w-full items-center rounded-[4px] px-2 py-0.5 text-[11px] font-medium leading-5"
    :class="tone"
    >{{ label || labels[code] || value || 'Não informado' }}</span
  >
</template>
