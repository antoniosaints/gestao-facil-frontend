<script setup lang="ts">
import ModalAction from '../components/ModalAction.vue'
import { Input } from '@/components/ui/input'

import { useConfirmation } from '../application/confirmation'
import ModalDialog from '../components/ModalDialog.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { ref, onMounted } from 'vue'
import { CaixaRepository } from '../adapters/domain'
import { decimal, errorMessage, money } from '../application/format'
import Feedback from '../components/Feedback.vue'
const editorOpen = ref(false)
const context = ref<Awaited<ReturnType<typeof CaixaRepository.contexto>> | null>(null),
  action = ref('abrir'),
  value = ref('0'),
  description = ref(''),
  pdvId = ref<number | null>(null),
  busy = ref(false),
  error = ref(''),
  message = ref(''),
  summary = ref<any>(null),
  uncertain = ref(false)
async function load() {
  busy.value = true
  error.value = ''
  try {
    context.value = await CaixaRepository.contexto()
    if (context.value.caixaAtivo)
      summary.value = await CaixaRepository.resumoCaixa(context.value.caixaAtivo.id)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
onMounted(load)
async function enter(id: number) {
  busy.value = true
  try {
    await CaixaRepository.entrarCaixa({ caixaId: id })
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
const confirmOperation = useConfirmation()
async function save() {
  if (busy.value || uncertain.value) return
  busy.value = true
  error.value = ''
  let sent = false
  try {
    const valor = decimal(value.value)
    if (
      !(await confirmOperation({
        title: !context.value?.caixaAtivo
          ? 'Confirmar abertura do caixa?'
          : action.value === 'fechar'
            ? 'Confirmar fechamento do caixa?'
            : 'Confirmar movimento de caixa?',
        description: `${!context.value?.caixaAtivo ? 'Saldo inicial' : action.value === 'fechar' ? 'Valor contado' : action.value === 'SANGRIA' ? 'Retirada' : 'Reforço'}: ${money(valor)}. ${description.value || 'Confira o valor antes de registrar.'}`,
        confirmLabel: !context.value?.caixaAtivo
          ? 'Confirmar abertura'
          : action.value === 'fechar'
            ? 'Confirmar fechamento'
            : 'Confirmar movimento',
        danger: !!context.value?.caixaAtivo && ['fechar', 'SANGRIA'].includes(action.value),
      }))
    )
      return
    sent = true
    if (!context.value?.caixaAtivo)
      await CaixaRepository.abrirCaixa({
        pdvId: pdvId.value,
        valorInicial: valor,
        observacao: description.value,
      })
    else if (action.value === 'fechar')
      await CaixaRepository.fecharCaixa({
        caixaId: context.value.caixaAtivo.id,
        valorFechamento: valor,
        descricao: description.value,
      })
    else
      await CaixaRepository.movimentarCaixa({
        caixaId: context.value.caixaAtivo.id,
        tipoMovimento: action.value === 'SANGRIA' ? 'SANGRIA' : 'REFORCO',
        descricao: description.value,
        valor,
      })
    message.value = 'Operação de caixa registrada.'
    editorOpen.value = false
    await load()
  } catch (e) {
    error.value = errorMessage(e)
    if (sent && !(e as any).response) {
      uncertain.value = true
      error.value += ' Confira o estado do caixa antes de repetir.'
    }
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>Seu caixa</template
      ><template #description
        >Abra o turno, registre entradas e retiradas e confira o fechamento.</template
      ><template #back
        ><RouterLink to="/modofacil/vendas">← Vendas</RouterLink></template
      ></PageHeader
    >

    <Feedback :loading="busy" :error="error" :message="message" @retry="load" /><template
      v-if="context"
      ><section
        v-if="context.caixaAtivo"
        class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5"
      >
        <h2>{{ context.caixaAtivo.codigo }}</h2>
        <p>Saldo esperado: {{ money(context.caixaAtivo.saldoEsperado) }}</p>
        <ModalAction
          class="mf-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/90 no-underline transition-colors hover:bg-muted/50 mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          form="venda-nova"
          >Fazer venda neste caixa</ModalAction
        >
        <details v-if="summary">
          <summary>Resumo e movimentos do turno</summary>
          <p>Vendido: {{ money(summary.resumo?.totalVendido) }}</p>
          <ul>
            <li v-for="mov in summary.movimentos" :key="mov.id">
              {{ mov.tipo }} · {{ money(mov.valor) }} · {{ mov.descricao }}
            </li>
          </ul>
        </details>
      </section>
      <section
        v-else-if="context.caixasAbertos.length"
        class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5"
      >
        <h2>Caixas abertos</h2>
        <div
          class="mf-actions my-4 flex flex-wrap items-end gap-3"
          v-for="cash in context.caixasAbertos"
          :key="cash.id"
        >
          <span>{{ cash.codigo }}</span
          ><button :disabled="busy" @click="enter(cash.id)">Entrar neste caixa</button>
        </div>
      </section>
      <button
        type="button"
        class="!border-blue-600 !bg-blue-600 !text-white"
        :disabled="busy || uncertain"
        @click="editorOpen = true"
      >
        {{ context.caixaAtivo ? 'Movimentar ou fechar caixa' : 'Abrir caixa' }}
      </button>
      <ModalDialog
        v-if="editorOpen"
        :title="context.caixaAtivo ? 'Movimentar ou fechar caixa' : 'Abrir caixa'"
        :busy="busy"
        :error="error"
        :uncertain="uncertain"
        @close="editorOpen = false"
      >
        <form
          class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
          @submit.prevent="save"
        >
          <h2>{{ context.caixaAtivo ? 'Movimentar ou fechar' : 'Abrir caixa' }}</h2>
          <fieldset
            :disabled="busy || uncertain"
            class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2"
          >
            <label v-if="context.caixaAtivo"
              >Operação<select v-model="action">
                <option value="REFORCO">Reforço de dinheiro</option>
                <option value="SANGRIA">Retirada / sangria</option>
                <option value="fechar">Fechar caixa</option>
              </select></label
            ><label v-else
              >Terminal<select v-model="pdvId">
                <option :value="null">Sem terminal específico</option>
                <option v-for="pdv in context.pdvs" :key="pdv.id" :value="pdv.id">
                  {{ pdv.nome }}
                </option>
              </select></label
            ><label
              >{{
                !context.caixaAtivo
                  ? 'Saldo inicial'
                  : action === 'fechar'
                    ? 'Valor contado no fechamento'
                    : 'Valor'
              }}<Input v-model="value" inputmode="decimal" required /></label
            ><label>Observação<Input v-model="description" /></label>
            <div
              class="mf-actions col-span-full flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
            >
              <button
                class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
              >
                Confirmar
                {{
                  !context.caixaAtivo
                    ? 'abertura'
                    : action === 'fechar'
                      ? 'fechamento'
                      : 'movimento'
                }}
              </button>
            </div>
          </fieldset>
        </form></ModalDialog
      ></template
    >
  </PageFrame>
</template>
