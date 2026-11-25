<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Calculator, CalendarDays } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  emprestimos,
  mensagemEmprestimo,
  type EmprestimoDetalhe,
  type SimulacaoEmprestimo,
  type TermosSimulacao,
} from '@/repositories/emprestimo-repository'
import { dataCurta, descreverAntecipacao, moeda } from './format'

const props = defineProps<{ termos?: TermosSimulacao; emprestimo?: EmprestimoDetalhe }>()
const dias = defineModel<number | string>('dias', { default: 0 })
const cenarios = [
  { dias: -7, label: '7 dias antes', texto: '−7 dias' },
  { dias: 0, label: 'No vencimento', texto: 'No prazo' },
  { dias: 7, label: '7 dias de atraso', texto: '+7 dias' },
  { dias: 30, label: '30 dias de atraso', texto: '+30 dias' },
]
const tentativa = ref(0)
const carregando = ref(false)
const erro = ref('')
const cenario = ref<{ dias: number; resultado: SimulacaoEmprestimo }>()
const origem = computed(() => props.emprestimo ?? props.termos)
const quitado = computed(() => props.emprestimo?.parcelas.every((parcela) => parcela.recebidoEm))
const numeroDias = computed(() => {
  if (quitado.value) return 0
  const valor = Number(dias.value)
  if (dias.value !== '' && Number.isInteger(valor) && Math.abs(valor) <= 3650) return valor
})

watch(
  [origem, numeroDias, tentativa],
  ([dados, ajuste], anterior, onCleanup) => {
    erro.value = ''
    carregando.value = false
    if (dados !== anterior[0] || ajuste === undefined) {
      cenario.value = undefined
    }
    if (!dados || ajuste === undefined) return

    const requisicao = new AbortController()
    carregando.value = true
    const timer = window.setTimeout(async () => {
      try {
        const resultado =
          'id' in dados
            ? await emprestimos.simular(dados.id, ajuste, requisicao.signal)
            : await emprestimos.simularCriacao({ ...dados, dias: ajuste }, requisicao.signal)
        if (!requisicao.signal.aborted) cenario.value = { dias: ajuste, resultado }
      } catch (error) {
        if (!requisicao.signal.aborted) {
          erro.value = mensagemEmprestimo(error, 'Não foi possível calcular a previsão.')
        }
      } finally {
        if (!requisicao.signal.aborted) carregando.value = false
      }
    }, 200)
    onCleanup(() => {
      window.clearTimeout(timer)
      requisicao.abort()
    })
  },
  { immediate: true },
)

const parcelas = computed(() => cenario.value?.resultado.parcelas ?? [])
const resumo = computed(() =>
  parcelas.value.reduce(
    (soma, parcela) => ({
      juros: soma.juros + parcela.jurosCentavos,
      desconto: soma.desconto + parcela.descontoFixoCentavos,
      prazo: soma.prazo + (parcela.cotacao ? parcela.valorNoVencimentoCentavos : 0),
      simulacao: soma.simulacao + (parcela.cotacao?.totalCentavos ?? 0),
      pendentes: soma.pendentes + Number(Boolean(parcela.cotacao)),
    }),
    { juros: 0, desconto: 0, prazo: 0, simulacao: 0, pendentes: 0 },
  ),
)
const diferenca = computed(() => resumo.value.simulacao - resumo.value.prazo)
const regraAntecipacao = computed(() =>
  cenario.value ? descreverAntecipacao(cenario.value.resultado, resumo.value.juros > 0) : '',
)
const descricaoCenario = computed(() => {
  const valor = cenario.value?.dias ?? 0
  if (!valor) return 'Pagamento de cada parcela no vencimento'
  const quantidade = Math.abs(valor)
  const periodo = `${quantidade} ${quantidade === 1 ? 'dia' : 'dias'}`
  return valor > 0 ? `${periodo} após cada vencimento` : `${periodo} antes de cada vencimento`
})
</script>

<template>
  <section
    aria-label="Previsão de pagamentos"
    class="flex min-w-0 flex-col rounded-xl border bg-card"
  >
    <div class="shrink-0 space-y-3 p-3 sm:p-4">
      <div class="flex items-center gap-2.5">
        <span
          class="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary dark:text-blue-300"
        >
          <Calculator class="size-4" aria-hidden="true" />
        </span>
        <div class="min-w-0">
          <h3 class="text-base font-semibold tracking-tight">Previsão de pagamentos</h3>
          <p class="text-xs text-muted-foreground">Simule antecipação e atraso por parcela.</p>
        </div>
      </div>

      <div
        v-if="!origem"
        class="flex items-start gap-2.5 rounded-lg bg-muted/55 p-3 text-sm text-muted-foreground"
      >
        <CalendarDays class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Complete os dados e as condições do empréstimo para ver o cronograma.
      </div>

      <template v-else>
        <div v-if="!quitado" class="space-y-1.5 rounded-lg border bg-muted/25 p-2.5">
          <div class="flex flex-wrap gap-1.5" role="group" aria-label="Cenários de pagamento">
            <Button
              v-for="opcao in cenarios"
              :key="opcao.dias"
              type="button"
              size="sm"
              class="h-8 px-2 text-xs"
              :variant="numeroDias === opcao.dias ? 'default' : 'outline'"
              :aria-label="opcao.label"
              :aria-pressed="numeroDias === opcao.dias"
              :title="opcao.label"
              @click="dias = opcao.dias"
              >{{ opcao.texto }}</Button
            >
          </div>
          <Label class="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs">
            Dias em relação ao vencimento
            <Input
              v-model="dias"
              type="number"
              step="1"
              min="-3650"
              max="3650"
              class="h-8 w-20 tabular-nums"
              :aria-invalid="numeroDias === undefined"
            />
          </Label>
          <p v-if="numeroDias === undefined" role="alert" class="text-xs text-destructive">
            Informe um número inteiro de −3.650 a 3.650.
          </p>
          <p v-else class="text-xs text-muted-foreground">
            Dias negativos antecipam. Dias positivos atrasam.
          </p>
        </div>

        <div
          v-if="erro"
          class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-destructive/30 p-3"
        >
          <p role="alert" class="text-xs text-destructive">{{ erro }}</p>
          <Button type="button" variant="outline" size="sm" @click="tentativa++">Recalcular</Button>
        </div>
        <p
          v-if="carregando"
          role="status"
          :class="cenario ? 'text-xs text-muted-foreground' : 'sr-only'"
        >
          Calculando previsão…
        </p>
        <div v-if="carregando && !cenario" aria-hidden="true" class="space-y-2">
          <Skeleton class="h-16 w-full rounded-lg" />
          <Skeleton class="h-24 w-full rounded-lg" />
        </div>

        <div v-if="cenario" class="space-y-2" aria-live="polite">
          <p v-if="resumo.pendentes" class="text-xs font-medium text-muted-foreground">
            {{ descricaoCenario
            }}<template v-if="emprestimo"> · {{ resumo.pendentes }} em aberto</template>
          </p>
          <dl
            v-if="resumo.pendentes"
            class="grid grid-cols-2 divide-x overflow-hidden rounded-lg border tabular-nums"
          >
            <div class="min-w-0 px-3 py-2.5">
              <dt class="text-xs text-muted-foreground">Total no vencimento</dt>
              <dd class="break-words text-base font-semibold">{{ moeda(resumo.prazo) }}</dd>
            </div>
            <div class="min-w-0 bg-primary/5 px-3 py-2.5">
              <dt class="text-xs text-muted-foreground">Total na simulação</dt>
              <dd class="break-words text-base font-semibold text-primary dark:text-blue-300">
                {{ moeda(resumo.simulacao) }}
              </dd>
              <dd v-if="diferenca" class="text-xs text-muted-foreground">
                {{ moeda(Math.abs(diferenca)) }} {{ diferenca > 0 ? 'a mais' : 'a menos' }}
              </dd>
            </div>
          </dl>
          <p v-else class="text-sm font-medium">Todas as parcelas foram recebidas.</p>
          <p
            v-if="resumo.juros || resumo.desconto || regraAntecipacao"
            class="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground"
          >
            <span v-if="resumo.juros">Juros do contrato {{ moeda(resumo.juros) }}</span>
            <span v-if="resumo.desconto">Desconto fixo {{ moeda(resumo.desconto) }}</span>
            <span v-if="regraAntecipacao">Antecipação · {{ regraAntecipacao }}</span>
          </p>
        </div>
      </template>
    </div>

    <template v-if="cenario">
      <div
        class="min-h-28 max-h-72 overflow-auto border-t focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        tabindex="0"
        aria-label="Cronograma de parcelas"
        role="region"
      >
        <table class="w-full text-left text-xs tabular-nums sm:text-sm">
          <caption class="sr-only">
            Comparação de pagamentos por parcela
          </caption>
          <thead class="sticky top-0 z-10 bg-muted">
            <tr>
              <th scope="col" class="px-3 py-2.5 font-medium">Parcela</th>
              <th scope="col" class="px-2 py-2.5 text-right font-medium">No vencimento</th>
              <th scope="col" class="px-3 py-2.5 text-right font-medium">
                {{ emprestimo ? 'Simulado ou recebido' : 'Na simulação' }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="parcela in parcelas" :key="parcela.numero" class="align-top">
              <th scope="row" class="px-3 py-2.5 font-medium">
                {{ parcela.numero }}
                <span class="block whitespace-nowrap text-xs font-normal text-muted-foreground">{{
                  dataCurta(parcela.vencimento)
                }}</span>
              </th>
              <td class="whitespace-nowrap px-2 py-2.5 text-right">
                {{ moeda(parcela.valorNoVencimentoCentavos) }}
              </td>
              <td class="px-3 py-2.5 text-right">
                <template v-if="parcela.recebidoEm">
                  <span
                    v-if="parcela.recebidoCentavos !== null"
                    class="whitespace-nowrap font-semibold"
                    >{{ moeda(parcela.recebidoCentavos) }}</span
                  >
                  <span class="block text-xs text-muted-foreground"
                    >Recebido em {{ dataCurta(parcela.recebidoEm) }}</span
                  >
                </template>
                <template v-else-if="parcela.cotacao">
                  <span class="whitespace-nowrap font-semibold">{{
                    moeda(parcela.cotacao.totalCentavos)
                  }}</span>
                  <div
                    v-if="cenario.dias && parcela.dataSimulada"
                    class="space-y-0.5 text-xs text-muted-foreground"
                  >
                    <p>{{ dataCurta(parcela.dataSimulada) }}</p>
                    <p v-if="parcela.cotacao.multaCentavos">
                      + {{ moeda(parcela.cotacao.multaCentavos) }} de multa
                    </p>
                    <p v-if="parcela.cotacao.jurosMoraCentavos">
                      + {{ moeda(parcela.cotacao.jurosMoraCentavos) }} de juros de atraso
                    </p>
                    <p v-if="parcela.cotacao.descontoAntecipacaoCentavos">
                      − {{ moeda(parcela.cotacao.descontoAntecipacaoCentavos) }} por antecipação
                    </p>
                  </div>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p
        v-if="cenario.dias < 0 || emprestimo"
        class="shrink-0 border-t px-3 py-2 text-xs text-muted-foreground sm:px-4"
      >
        <template v-if="cenario.dias < 0"
          >A primeira data possível para antecipar é a data da saída do empréstimo.</template
        >
        <template v-if="emprestimo"
          >{{ cenario.dias < 0 ? ' ' : '' }}Os valores simulados são informativos. Para registrar um
          pagamento, use a aba Parcelas.</template
        >
      </p>
    </template>
  </section>
</template>
