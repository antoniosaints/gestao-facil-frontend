<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { UserPlus, WalletCards } from 'lucide-vue-next'
import { vMaska } from 'maska/vue'
import { parseISO } from 'date-fns'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import FormSelect from '@/modofacil/components/FormSelect.vue'
import { Switch } from '@/components/ui/switch'
import { cpfCnpjMaskOptions, moneyMaskOptions } from '@/lib/imaska'
import { ClienteRepository } from '@/repositories/cliente-repository'
import { emprestimos, mensagemEmprestimo } from '@/repositories/emprestimo-repository'
import type { MetodoPagamentoFinanceiro } from '@/types/schemas'
import { randomUUID } from '@/utils/uuid'
import { dia, diaDoCalendario, formas, moeda } from './format'

const open = defineModel<boolean>('open', { required: true })
const emit = defineEmits<{ salvo: [id: number] }>()
const campos = () => ({
  clienteId: null as string | number | null,
  valor: '',
  juros: '0',
  jurosMora: '',
  multa: '',
  descontoFixo: '',
  descontoAntecipacao: '',
  numeroParcelas: 1,
  dataSaida: dia(),
  primeiroVencimento: '',
  formaSaida: 'PIX' as MetodoPagamentoFinanceiro,
  origem: 'avulso',
  contaSaidaId: null as string | number | null,
  lancamentoAutomatico: true,
  contaEntradaId: null as string | number | null,
  categoriaId: null as string | number | null,
})
const form = reactive(campos())
const novo = reactive({ nome: '', email: '', documento: '' })
const clienteAberto = ref(false)
const erroCliente = ref('')
const erro = ref('')
const salvando = ref(false)
const salvandoCliente = ref(false)
let chave = ''
const emCentavos = (valor: string) => Math.round(Number(valor.replace(',', '.')) * 100)
const principal = computed(() => emCentavos(form.valor))
const jurosBps = computed(() => emCentavos(form.juros))
const jurosMoraBps = computed(() => emCentavos(form.jurosMora))
const multaBps = computed(() => emCentavos(form.multa))
const descontoFixo = computed(() => emCentavos(form.descontoFixo))
const descontoJurosBps = computed(() =>
  jurosBps.value === 0 || form.descontoAntecipacao === ''
    ? null
    : emCentavos(form.descontoAntecipacao),
)
const juros = computed(() => Math.round((principal.value * jurosBps.value) / 10_000))
const total = computed(() => principal.value + juros.value - descontoFixo.value)
const menorParcela = computed(() => Math.floor(total.value / form.numeroParcelas))
const maiorParcela = computed(() => Math.ceil(total.value / form.numeroParcelas))
const categoriasVisiveis = computed(() => form.origem === 'conta' || form.lancamentoAutomatico)

watch(
  open,
  (value) => {
    if (!value) return
    chave = ''
    Object.assign(form, campos())
    Object.assign(novo, { nome: '', email: '', documento: '' })
    clienteAberto.value = false
    erro.value = ''
    erroCliente.value = ''
  },
  { immediate: true },
)

async function cadastrarCliente() {
  if (!novo.nome.trim() || salvandoCliente.value) return
  salvandoCliente.value = true
  erroCliente.value = ''
  try {
    const { data } = await ClienteRepository.save({
      nome: novo.nome.trim(),
      email: novo.email.trim() || undefined,
      documento: novo.documento || undefined,
      status: 'ATIVO',
      tipo: 'CLIENTE',
    })
    if (!data?.id) throw new Error()
    form.clienteId = data.id
    clienteAberto.value = false
    Object.assign(novo, { nome: '', email: '', documento: '' })
  } catch (error) {
    erroCliente.value = mensagemEmprestimo(error, 'Não foi possível cadastrar o cliente.')
  } finally {
    salvandoCliente.value = false
  }
}

async function salvar() {
  if (salvando.value) return
  erro.value = ''
  if (!form.clienteId || !(principal.value > 0) || !form.dataSaida || !form.primeiroVencimento) {
    erro.value = 'Informe o cliente, o valor emprestado e as datas do empréstimo.'
    return
  }
  if (form.dataSaida > dia() || form.primeiroVencimento < form.dataSaida) {
    erro.value = 'A data da saída deve ser até hoje, e o vencimento deve ser a partir da saída.'
    return
  }
  if (principal.value > 100_000_000 || principal.value < form.numeroParcelas) {
    erro.value = 'Informe até R$ 1.000.000,00 e pelo menos um centavo de principal por parcela.'
    return
  }
  if (!(jurosBps.value >= 0 && jurosBps.value <= 100_000)) {
    erro.value = 'Informe juros sobre o valor emprestado entre 0% e 1.000%.'
    return
  }
  if (
    ![jurosMoraBps.value, multaBps.value, descontoJurosBps.value ?? 0].every(
      (valor) => valor >= 0 && valor <= 10_000,
    )
  ) {
    erro.value = 'Informe juros por atraso, multa e desconto por antecipação entre 0% e 100%.'
    return
  }
  if (!(descontoFixo.value >= 0 && principal.value - descontoFixo.value >= form.numeroParcelas)) {
    erro.value = 'O desconto deve deixar pelo menos um centavo de principal por parcela.'
    return
  }
  if (
    (form.origem === 'conta' && !form.contaSaidaId) ||
    (form.lancamentoAutomatico && !form.contaEntradaId) ||
    (categoriasVisiveis.value && !form.categoriaId)
  ) {
    erro.value = 'Preencha a conta financeira e a categoria dos lançamentos.'
    return
  }
  salvando.value = true
  try {
    const { id } = await emprestimos.criar({
      chaveOperacao: (chave ||= randomUUID()),
      clienteId: Number(form.clienteId),
      principalCentavos: principal.value,
      dataSaida: form.dataSaida,
      primeiroVencimento: form.primeiroVencimento,
      jurosBps: jurosBps.value,
      jurosMoraBps: jurosMoraBps.value,
      multaBps: multaBps.value,
      descontoFixoCentavos: descontoFixo.value,
      descontoJurosBps: descontoJurosBps.value,
      numeroParcelas: form.numeroParcelas,
      formaSaida: form.formaSaida,
      contaSaidaId: form.origem === 'conta' ? Number(form.contaSaidaId) : null,
      contaEntradaId: form.lancamentoAutomatico ? Number(form.contaEntradaId) : null,
      categoriaId: categoriasVisiveis.value ? Number(form.categoriaId) : null,
      lancamentoAutomatico: form.lancamentoAutomatico,
    })
    open.value = false
    emit('salvo', id)
  } catch (error) {
    erro.value = mensagemEmprestimo(error, 'Não foi possível registrar o empréstimo.')
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="open"
    title="Novo empréstimo"
    description="Informe os dados da saída e monte o cronograma de recebimento."
    :icon="WalletCards"
    size="2xl"
    content-class="max-h-[90dvh] gap-0 overflow-hidden"
    header-class="shrink-0 border-b px-6 pb-3 pt-4 text-left md:pt-6"
    body-class="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-py-4 px-6 py-4"
  >
    <div class="space-y-4">
      <section class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <Label for="emprestimo-cliente">Cliente</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            :aria-expanded="clienteAberto"
            aria-controls="emprestimo-novo-cliente"
            :disabled="salvando || salvandoCliente"
            @click="clienteAberto = !clienteAberto"
          >
            <UserPlus class="size-4" /> Cadastrar cliente
          </Button>
        </div>
        <Select2Ajax
          id="emprestimo-cliente"
          v-model="form.clienteId"
          aria-label="Cliente"
          url="/clientes/select2"
          linked-kind="cliente"
          :params="[{ key: 'clienteAtivo', value: true }]"
          :disabled="salvando"
          placeholder="Buscar cliente ativo"
        />
        <form
          v-if="clienteAberto"
          id="emprestimo-novo-cliente"
          class="space-y-4 rounded-xl border bg-muted/30 p-4"
          @submit.prevent="cadastrarCliente"
        >
          <fieldset :disabled="salvandoCliente" class="grid min-w-0 gap-4 sm:grid-cols-2">
            <div class="space-y-2 sm:col-span-2">
              <Label for="emprestimo-cliente-nome">Nome</Label>
              <Input
                id="emprestimo-cliente-nome"
                v-model="novo.nome"
                required
                maxlength="191"
                autocomplete="off"
              />
            </div>
            <div class="space-y-2">
              <Label for="emprestimo-cliente-email">E-mail (opcional)</Label>
              <Input
                id="emprestimo-cliente-email"
                v-model="novo.email"
                type="email"
                maxlength="191"
                autocomplete="off"
              />
            </div>
            <div class="space-y-2">
              <Label for="emprestimo-cliente-documento">CPF ou CNPJ (opcional)</Label>
              <Input
                id="emprestimo-cliente-documento"
                v-model="novo.documento"
                v-maska="cpfCnpjMaskOptions"
                inputmode="numeric"
              />
            </div>
          </fieldset>
          <p v-if="erroCliente" role="alert" class="text-sm text-destructive">{{ erroCliente }}</p>
          <div class="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              :disabled="salvandoCliente"
              @click="clienteAberto = false"
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" :disabled="salvandoCliente">
              {{ salvandoCliente ? 'Cadastrando…' : 'Salvar cliente' }}
            </Button>
          </div>
        </form>
      </section>

      <form id="emprestimo-cadastro-form" class="space-y-4" @submit.prevent="salvar">
        <fieldset
          class="grid min-w-0 gap-4 rounded-xl border p-4 sm:grid-cols-6"
          :disabled="salvando"
        >
          <legend class="px-1 text-sm font-medium">Valor e parcelas</legend>
          <div class="min-w-0 space-y-2 sm:col-span-3">
            <Label for="emprestimo-valor">Valor emprestado (R$)</Label>
            <Input
              id="emprestimo-valor"
              v-model="form.valor"
              v-maska="moneyMaskOptions"
              inputmode="decimal"
              placeholder="0,00"
              required
            />
          </div>
          <div class="min-w-0 space-y-2 sm:col-span-3">
            <Label for="emprestimo-parcelas">Número de parcelas</Label>
            <Input
              id="emprestimo-parcelas"
              v-model.number="form.numeroParcelas"
              type="number"
              min="1"
              max="120"
              required
            />
          </div>
          <div class="min-w-0 space-y-2 sm:col-span-2">
            <Label for="dp-input-emprestimo-saida">Data da saída</Label>
            <Calendarpicker
              uid="emprestimo-saida"
              :aria-labels="{ input: 'Data da saída' }"
              :model-value="form.dataSaida || null"
              :max-date="parseISO(dia())"
              :disabled="salvando"
              teleport
              @update:model-value="form.dataSaida = diaDoCalendario($event)"
            />
          </div>
          <div class="min-w-0 space-y-2 sm:col-span-2">
            <Label for="dp-input-emprestimo-vencimento">Primeiro vencimento</Label>
            <Calendarpicker
              uid="emprestimo-vencimento"
              :aria-labels="{ input: 'Primeiro vencimento' }"
              :model-value="form.primeiroVencimento || null"
              :min-date="form.dataSaida ? parseISO(form.dataSaida) : null"
              :disabled="salvando"
              teleport
              @update:model-value="form.primeiroVencimento = diaDoCalendario($event)"
            />
          </div>
          <div class="min-w-0 space-y-2 sm:col-span-2">
            <Label for="emprestimo-forma-saida">Forma da saída</Label>
            <FormSelect
              id="emprestimo-forma-saida"
              v-model="form.formaSaida"
              :options="formas"
              :disabled="salvando"
              aria-label="Forma da saída"
            />
          </div>
        </fieldset>
        <fieldset
          class="grid min-w-0 gap-4 rounded-xl border p-4 sm:grid-cols-2"
          :disabled="salvando"
        >
          <legend class="px-1 text-sm font-medium">Juros, multa e descontos</legend>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-juros">Juros sobre o valor emprestado (%)</Label>
            <Input
              id="emprestimo-juros"
              v-model="form.juros"
              v-maska="moneyMaskOptions"
              inputmode="decimal"
              placeholder="0"
              aria-describedby="emprestimo-juros-ajuda"
            />
            <p id="emprestimo-juros-ajuda" class="text-xs text-muted-foreground">
              Deixe em 0 para cobrar juros somente em caso de atraso.
            </p>
          </div>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-juros-mora">Juros por atraso (% ao mês)</Label>
            <Input
              id="emprestimo-juros-mora"
              v-model="form.jurosMora"
              v-maska="moneyMaskOptions"
              inputmode="decimal"
              placeholder="0"
              aria-describedby="emprestimo-juros-mora-ajuda"
            />
            <p id="emprestimo-juros-mora-ajuda" class="text-xs text-muted-foreground">
              Juros simples sobre o valor líquido da parcela, por dia de atraso, com mês de 30 dias.
            </p>
          </div>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-multa">Multa por atraso (%)</Label>
            <Input
              id="emprestimo-multa"
              v-model="form.multa"
              v-maska="moneyMaskOptions"
              inputmode="decimal"
              placeholder="0"
              aria-describedby="emprestimo-multa-ajuda"
            />
            <p id="emprestimo-multa-ajuda" class="text-xs text-muted-foreground">
              Cobrada uma vez sobre o valor líquido de cada parcela vencida.
            </p>
          </div>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-desconto-fixo">Desconto fixo (R$)</Label>
            <Input
              id="emprestimo-desconto-fixo"
              v-model="form.descontoFixo"
              v-maska="moneyMaskOptions"
              inputmode="decimal"
              placeholder="0,00"
              aria-describedby="emprestimo-desconto-fixo-ajuda"
            />
            <p id="emprestimo-desconto-fixo-ajuda" class="text-xs text-muted-foreground">
              Abatido do principal e distribuído entre as parcelas, mesmo em atraso.
            </p>
          </div>
          <div v-if="jurosBps > 0" class="min-w-0 space-y-2 sm:col-span-2">
            <Label for="emprestimo-desconto-antecipacao">Desconto por antecipação (%)</Label>
            <Input
              id="emprestimo-desconto-antecipacao"
              v-model="form.descontoAntecipacao"
              v-maska="moneyMaskOptions"
              inputmode="decimal"
              placeholder="Padrão da conta"
              class="sm:max-w-48"
              aria-describedby="emprestimo-desconto-antecipacao-ajuda"
            />
            <p id="emprestimo-desconto-antecipacao-ajuda" class="text-xs text-muted-foreground">
              Reduz os juros do contrato em parcelas pagas antes do vencimento. Em branco, usa o
              padrão da conta. Digite 0 para desativar neste empréstimo.
            </p>
          </div>
          <p
            v-if="total > 0 && form.numeroParcelas > 0"
            class="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground sm:col-span-2"
          >
            <strong class="text-foreground">{{ moeda(total) }} a receber sem atraso</strong>
            <template v-if="juros > 0"> · {{ moeda(juros) }} em juros do contrato</template>
            <template v-if="descontoFixo > 0">
              · {{ moeda(descontoFixo) }} de desconto fixo</template
            >
            · {{ form.numeroParcelas }} × {{ moeda(menorParcela)
            }}<template v-if="maiorParcela !== menorParcela"> a {{ moeda(maiorParcela) }}</template>
          </p>
        </fieldset>
        <fieldset
          class="grid min-w-0 gap-4 rounded-xl border p-4 sm:grid-cols-2"
          :disabled="salvando"
        >
          <legend class="px-1 text-sm font-medium">Movimentação financeira</legend>
          <div class="min-w-0 space-y-2">
            <Label for="emprestimo-origem">Origem do dinheiro</Label>
            <FormSelect
              id="emprestimo-origem"
              v-model="form.origem"
              :options="[
                { value: 'avulso', label: 'Avulso' },
                { value: 'conta', label: 'Conta financeira' },
              ]"
              :disabled="salvando"
              aria-label="Origem do dinheiro"
            />
          </div>
          <div v-if="form.origem === 'conta'" class="min-w-0 space-y-2">
            <Label for="emprestimo-conta-saida">Conta da saída</Label>
            <Select2Ajax
              id="emprestimo-conta-saida"
              v-model="form.contaSaidaId"
              aria-label="Conta da saída"
              url="/lancamentos/contas/select2"
              linked-kind="conta"
              :disabled="salvando"
            />
          </div>
          <p v-else class="self-end text-xs text-muted-foreground sm:pb-2">
            A saída avulsa fica registrada no empréstimo.
          </p>
          <div class="flex items-center justify-between gap-4 border-t pt-4 sm:col-span-2">
            <div class="space-y-1">
              <Label for="emprestimo-lancamento-automatico"
                >Lançar recebimentos automaticamente no Financeiro</Label
              >
              <p id="emprestimo-lancamento-automatico-ajuda" class="text-xs text-muted-foreground">
                Cria uma receita efetivada na data do pagamento quando houver baixa.
              </p>
            </div>
            <Switch
              id="emprestimo-lancamento-automatico"
              v-model="form.lancamentoAutomatico"
              :disabled="salvando"
              aria-describedby="emprestimo-lancamento-automatico-ajuda"
            />
          </div>
          <div v-if="form.lancamentoAutomatico" class="min-w-0 space-y-2">
            <Label for="emprestimo-conta-entrada">Conta dos recebimentos</Label>
            <Select2Ajax
              id="emprestimo-conta-entrada"
              v-model="form.contaEntradaId"
              aria-label="Conta dos recebimentos"
              url="/lancamentos/contas/select2"
              linked-kind="conta"
              :disabled="salvando"
            />
          </div>
          <div v-if="categoriasVisiveis" class="min-w-0 space-y-2">
            <Label for="emprestimo-categoria">Categoria financeira</Label>
            <Select2Ajax
              id="emprestimo-categoria"
              v-model="form.categoriaId"
              aria-label="Categoria financeira"
              url="/lancamentos/categorias/select2"
              linked-kind="categoria"
              :disabled="salvando"
            />
          </div>
        </fieldset>
        <p v-if="erro" role="alert" class="text-sm text-destructive">{{ erro }}</p>
      </form>
    </div>

    <template #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          class="flex-1 sm:flex-none"
          :disabled="salvando || salvandoCliente"
          @click="open = false"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="emprestimo-cadastro-form"
          class="flex-1 sm:flex-none"
          :disabled="salvando || clienteAberto"
        >
          {{ salvando ? 'Registrando…' : 'Registrar empréstimo' }}
        </Button>
      </div>
    </template>
  </ModalView>
</template>
