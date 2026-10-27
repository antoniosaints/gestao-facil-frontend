<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRouter } from 'vue-router'
import { Trash2 } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { api, type Row } from '../adapters/domain'
import { useDomainMutation } from '../application/useDomainMutation'
import { deletionScopeKey } from '../application/deletionScope'
import { money } from '../application/format'
import ModalDialog from './ModalDialog.vue'
const props = defineProps<{
  kind: 'sale' | 'finance' | 'product' | 'service' | 'person'
  record: Row
  disabled?: boolean
  redirect?: string
  iconOnly?: boolean
}>()
const emit = defineEmits<{ deleted: [] }>()
const ui = useUiStore(),
  router = useRouter(),
  opened = ref(false)
const policies = {
  person: {
    label: 'pessoa',
    path: '/modofacil/pessoas',
    level: 2,
    effect:
      'A pessoa será removida do cadastro. Se houver vínculos que impeçam a exclusão, desative o cadastro para preservar o histórico.',
  },
  sale: {
    label: 'venda',
    path: '/modofacil/vendas',
    level: 3,
    effect: 'A venda será removida com os ajustes de estoque e caixa previstos pelo sistema.',
  },
  finance: {
    label: 'lançamento',
    path: '/modofacil/financeiro/lancamentos',
    level: 3,
    effect:
      'O lançamento e suas parcelas serão removidos. A exclusão não devolve valores pagos nem estorna cobranças.',
  },
  product: {
    label: 'produto',
    path: '/modofacil/produtos',
    level: 4,
    effect: 'O produto e todas as suas variantes serão removidos do cadastro.',
  },
  service: {
    label: 'serviço',
    path: '/modofacil/servicos',
    level: 2,
    effect:
      'O serviço será removido do cadastro. Vínculos que impeçam a exclusão serão informados pelo sistema.',
  },
}
const policy = computed(() => policies[props.kind])
const allowed = computed(() => hasPermission(ui.usuarioLogged, policy.value.level))
const identity = computed(
  () =>
    (props.kind === 'finance'
      ? props.record.descricao || props.record.Uid
      : props.kind === 'sale'
        ? props.record.Uid
        : props.record.nome) || `#${props.record.id}`,
)
const blocked = computed(
  () => props.kind === 'sale' && (props.record.faturado || props.record.status === 'FATURADO'),
)
const amount = computed(() =>
  props.kind === 'sale'
    ? props.record.valor
    : props.kind === 'finance'
      ? props.record.valorTotal
      : undefined,
)
const scope = inject(deletionScopeKey, undefined)
const endpoint = `${policy.value.path}/${props.record.id}`
const mutation = scope?.get(endpoint) || useDomainMutation()
scope?.set(endpoint, mutation)
const { busy, error, uncertain, run } = mutation
onBeforeRouteLeave(() => !busy.value)
onBeforeRouteUpdate(() => !busy.value)
async function remove() {
  if (!allowed.value || blocked.value || props.disabled) return
  const result = await run(
    () => api.remove(`${policy.value.path}/${props.record.id}`),
    'Registro excluído.',
  )
  if (!result) return
  opened.value = false
  emit('deleted')
  if (props.redirect) await router.replace(props.redirect)
}
</script>
<template>
  <template v-if="allowed">
    <button
      type="button"
      class="!border-red-500/25 !text-red-600 hover:!bg-red-500/10 dark:!text-red-300"
      :disabled="disabled || busy || uncertain"
      :aria-label="`Excluir ${policy.label} ${identity}`"
      :title="`Excluir ${policy.label}`"
      @click="opened = true"
    >
      <Trash2 :size="14" /><span :class="iconOnly ? 'sr-only' : ''">Excluir</span>
    </button>
    <ModalDialog
      v-if="opened"
      :title="`Excluir ${policy.label}`"
      :busy="busy"
      :error="error"
      :uncertain="uncertain"
      danger
      @close="opened = false"
    >
      <div class="rounded-lg border border-border bg-muted/30 p-4">
        <strong class="block break-words">{{ identity }}</strong
        ><small>Registro #{{ record.id }}</small>
        <p v-if="amount != null" class="mt-2 !mb-0 font-semibold">{{ money(amount) }}</p>
      </div>
      <p v-if="blocked" class="mt-4 !mb-0 text-sm">
        Esta venda está faturada. Abra os detalhes e estorne o faturamento antes de excluí-la.
      </p>
      <template v-else
        ><p class="mt-4">{{ policy.effect }}</p>
        <p class="!mb-0 text-xs text-muted-foreground">
          A exclusão é permanente e não pode ser desfeita.
        </p></template
      >
      <template #footer
        ><button type="button" :disabled="busy" @click="opened = false">Voltar</button
        ><button
          v-if="!blocked"
          type="button"
          class="!border-red-600 !bg-red-600 !text-white hover:!bg-red-700"
          :disabled="busy || uncertain || disabled"
          @click="remove"
        >
          Confirmar exclusão
        </button></template
      >
    </ModalDialog>
  </template>
</template>
