<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router'
import { Power } from 'lucide-vue-next'
import { useUiStore } from '@/stores/ui/uiStore'
import { hasPermission } from '@/hooks/authorize'
import { api, type Row } from '../adapters/domain'
import { deletionScopeKey } from '../application/deletionScope'
import { useDomainMutation } from '../application/useDomainMutation'
import ModalDialog from './ModalDialog.vue'
const props = defineProps<{
  kind: 'person' | 'service' | 'product'
  record: Row
  disabled?: boolean
  iconOnly?: boolean
}>()
const emit = defineEmits<{ changed: [] }>()
const ui = useUiStore(),
  opened = ref(false),
  targetActive = ref(true)
const scope = inject(deletionScopeKey, undefined)
const entity = computed(
  () => ({ person: 'pessoa', service: 'serviço', product: 'produto' })[props.kind],
)
const endpoint = `/modofacil/${{ person: 'pessoas', service: 'servicos', product: 'produtos' }[props.kind]}/${props.record.id}`
// All actions for this record share the pending/uncertain result across layouts.
const mutation = scope?.get(endpoint) || useDomainMutation()
scope?.set(endpoint, mutation)
const { busy, error, uncertain, run } = mutation
const allowed = computed(() => hasPermission(ui.usuarioLogged, props.kind === 'product' ? 4 : 2))
const active = computed(() =>
  props.kind === 'service' ? props.record.status === true : props.record.status === 'ATIVO',
)
const label = computed(() => (active.value ? 'Desativar' : 'Ativar'))
onBeforeRouteLeave(() => !busy.value)
onBeforeRouteUpdate(() => !busy.value)
function open() {
  error.value = ''
  targetActive.value = !active.value
  opened.value = true
}
async function save() {
  if (!allowed.value || props.disabled) return
  const status =
    props.kind === 'service' ? targetActive.value : targetActive.value ? 'ATIVO' : 'INATIVO'
  const result = await run(
    () => api.patch(`${endpoint}/${props.kind === 'person' ? 'basico' : 'status'}`, { status }),
    'Situação atualizada.',
  )
  if (!result) return
  opened.value = false
  emit('changed')
}
</script>
<template>
  <template v-if="allowed">
    <button
      type="button"
      :disabled="disabled || busy || uncertain"
      :aria-label="`${label} ${entity} ${record.nome}`"
      :title="`${label} ${entity}`"
      @click="open"
    >
      <Power
        :size="14"
        :class="
          active ? 'text-orange-600 dark:text-orange-300' : 'text-emerald-600 dark:text-emerald-300'
        "
      /><span :class="iconOnly ? 'sr-only' : ''">{{ label }}</span>
    </button>
    <ModalDialog
      v-if="opened"
      :title="`${targetActive ? 'Ativar' : 'Desativar'} ${entity}`"
      :busy="busy"
      :error="error"
      :uncertain="uncertain"
      size="sm"
      @close="opened = false"
    >
      <strong class="block break-words">{{ record.nome }}</strong>
      <p class="mt-3">
        {{
          kind === 'product'
            ? targetActive
              ? 'O produto e todas as suas variantes voltarão a ficar ativos para uso no sistema.'
              : 'O produto e todas as suas variantes ficarão inativos. O estoque, os preços e o histórico serão preservados.'
            : targetActive
              ? 'O cadastro voltará a ficar ativo para uso no sistema.'
              : props.kind === 'person'
                ? 'O cadastro ficará inativo. Os dados e o histórico desta pessoa serão preservados.'
                : 'O serviço ficará inativo. As vendas e ordens já registradas serão preservadas.'
        }}
      </p>
      <p
        v-if="kind === 'person' && record.status === 'BLOQUEADO'"
        class="!text-xs text-muted-foreground"
      >
        Esta pessoa está bloqueada. A confirmação alterará a situação para Ativo.
      </p>
      <template #footer
        ><button type="button" :disabled="busy" @click="opened = false">Cancelar</button
        ><button
          type="button"
          :disabled="busy || uncertain || disabled"
          class="!border-primary !bg-primary !text-primary-foreground"
          @click="save"
        >
          {{ busy ? 'Salvando…' : targetActive ? 'Confirmar ativação' : 'Confirmar desativação' }}
        </button></template
      >
    </ModalDialog>
  </template>
</template>
