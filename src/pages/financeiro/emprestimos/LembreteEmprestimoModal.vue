<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import WhatsAppInstanceSelect from '@/pages/clientes/partials/WhatsAppInstanceSelect.vue'
import { Button } from '@/components/ui/button'
import type { LembreteConfigPayload } from '@/repositories/inadimplencia-repository'
import {
  emprestimos,
  mensagemEmprestimo,
  type EmprestimoLembreteContexto,
  type EmprestimoLembreteResumo,
} from '@/repositories/emprestimo-repository'
import LembreteModal from '../inadimplencia/LembreteModal.vue'

const props = defineProps<{ emprestimoId: number }>()
const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ salvo: [resumo: EmprestimoLembreteResumo] }>()
const config = ref<LembreteConfigPayload>({
  ativo: true,
  dias: [],
  canalWhatsapp: true,
  canalEmail: false,
  canalSms: false,
  mensagemCustom: null,
})
const contexto = ref<EmprestimoLembreteContexto>()
const instanciaId = ref<number | null>(null)
const carregando = ref(false)
const salvando = ref(false)
const erro = ref('')
const instanciaDisponivel = computed(() =>
  contexto.value?.instancias.some(
    (instancia) => instancia.id === instanciaId.value && instancia.status === 'CONECTADA',
  ),
)
const podeAtivar = computed(
  () =>
    contexto.value?.whatsappAtivo && contexto.value.clienteTemWhatsApp && instanciaDisponivel.value,
)
let busca: AbortController | undefined

async function carregar() {
  busca?.abort()
  const controller = new AbortController()
  busca = controller
  carregando.value = true
  erro.value = ''
  try {
    const dados = await emprestimos.lembrete(props.emprestimoId, controller.signal)
    if (controller.signal.aborted) return
    if (!contexto.value) {
      config.value = {
        ...config.value,
        ativo: dados.ativo,
        dias: dados.dias,
        mensagemCustom: dados.mensagemCustom,
      }
      instanciaId.value = dados.instanciaId
    }
    contexto.value = dados
  } catch (error) {
    if (!controller.signal.aborted)
      erro.value = mensagemEmprestimo(error, 'Não foi possível carregar o lembrete.')
  } finally {
    if (busca === controller) carregando.value = false
  }
}

watch(
  [open, () => props.emprestimoId],
  ([aberto]) => {
    busca?.abort()
    contexto.value = undefined
    if (aberto) void carregar()
  },
  { immediate: true },
)
onBeforeUnmount(() => busca?.abort())

async function salvar({ ativo, dias, mensagemCustom }: LembreteConfigPayload) {
  if (salvando.value || (ativo && !podeAtivar.value)) return
  const id = props.emprestimoId
  salvando.value = true
  erro.value = ''
  try {
    const resumo = await emprestimos.salvarLembrete(id, {
      ativo,
      dias,
      mensagemCustom: mensagemCustom ?? null,
      instanciaId: instanciaId.value,
    })
    if (props.emprestimoId !== id) return
    emit('salvo', resumo)
    open.value = false
  } catch (error) {
    erro.value = mensagemEmprestimo(error, 'Não foi possível salvar o lembrete.')
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <LembreteModal
    v-model:open="open"
    titulo="Lembrete por WhatsApp"
    :descricao="`Configure os avisos das parcelas do empréstimo #${emprestimoId}.`"
    texto-desativado="Ao desativar, o cliente deixa de receber avisos automáticos deste empréstimo."
    :config="config"
    :saving="salvando"
    :indisponivel="!contexto"
    :bloqueio-ativo="carregando || !podeAtivar"
    :mensagem-padrao="contexto?.mensagemPadrao"
    @salvar="salvar"
  >
    <template #estado>
      <p v-if="carregando && !contexto" role="status" class="text-sm text-muted-foreground">
        Carregando agenda…
      </p>
      <div
        v-if="erro"
        class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 p-3"
      >
        <p role="alert" class="text-sm text-destructive">{{ erro }}</p>
        <Button
          v-if="!contexto"
          variant="outline"
          size="sm"
          :disabled="carregando"
          @click="carregar"
          >Tentar novamente</Button
        >
      </div>
    </template>
    <template #entrega>
      <div v-if="contexto" class="space-y-2">
        <WhatsAppInstanceSelect
          v-model="instanciaId"
          :instances="contexto.instancias"
          :module-active="contexto.whatsappAtivo"
          :loading="carregando"
          :disabled="salvando"
          @refresh="carregar"
        />
        <p v-if="!contexto.clienteTemWhatsApp" class="text-sm text-destructive">
          Cadastre um telefone ou WhatsApp válido na ficha do cliente para ativar os lembretes.
        </p>
        <p v-if="!contexto.enviosHabilitados" class="text-sm text-muted-foreground">
          Os envios automáticos estão pausados nas configurações de Inadimplência.
        </p>
        <p v-else class="text-xs text-muted-foreground">
          Horário de envio da conta {{ String(contexto.horaEnvio).padStart(2, '0') }}:00, horário de
          Brasília.
        </p>
      </div>
    </template>
  </LembreteModal>
</template>
