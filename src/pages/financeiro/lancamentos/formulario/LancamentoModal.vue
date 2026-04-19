<script setup lang="ts">
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import ModalView from '@/components/formulario/ModalView.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useLancamentosStore } from '@/stores/lancamentos/useLancamentos'
import { computed, ref, watch } from 'vue'
import { vMaska } from 'maska/vue'
import { moneyMaskOptions } from '@/lib/imaska'
import type { FormularioLancamento } from '@/types/schemas'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { POSITION, useToast } from 'vue-toastification'
import { formatCurrencyBR, formatDateToPtBR, formatToNumberValue } from '@/utils/formatters'
import { useClientesStore } from '@/stores/clientes/useClientes'
import FormularioContas from '../modais/FormularioContas.vue'
import FormularioCategorias from '../modais/FormularioCategorias.vue'

const store = useLancamentosStore()
const storeCliente = useClientesStore()
const toast = useToast()
const erros = ref<{ [key: string]: string }>({})

const params = ref<{
  metodo: 'AVISTA' | 'PARCELADO'
  lancamentoEfetivado: boolean
  hasEntrada: boolean
}>({
  metodo: 'AVISTA',
  lancamentoEfetivado: false,
  hasEntrada: false,
})

const isEditMode = computed(() => Boolean(store.form.id))

const title = computed(() => {
  if (isEditMode.value) return 'Editar lançamento'
  const tipo = store.form.tipo === 'RECEITA' ? 'receita' : 'despesa'
  return params.value.metodo === 'AVISTA' ? `Lançamento de ${tipo}` : `Lançamento parcelado (${tipo})`
})

const description = computed(() =>
  isEditMode.value
    ? 'Nesta edição rápida você pode ajustar descrição, categoria, conta financeira, cliente/fornecedor e forma de pagamento padrão. Valores, datas, parcelas e status permanecem preservados.'
    : 'Preencha os campos abaixo',
)

const valorInputLabel = computed(() => {
  if (params.value.metodo === 'PARCELADO' && store.form.modoValorParcelamento === 'FIXO_PARCELA') {
    return 'Valor de cada parcela *'
  }
  return 'Valor Total *'
})

const descontoDesabilitado = computed(
  () => params.value.metodo === 'PARCELADO' && store.form.modoValorParcelamento === 'FIXO_PARCELA',
)

const intervaloPersonalizadoAtivo = computed(
  () => params.value.metodo === 'PARCELADO' && store.form.periodoParcelamento === 'PERSONALIZADO',
)

const valorInformado = computed(() => formatToNumberValue(store.form.valorTotal))
const valorEntrada = computed(() => formatToNumberValue(store.form.valorEntrada))
const desconto = computed(() => formatToNumberValue(store.form.desconto))
const parcelasQuantidade = computed(() => Number(store.form.parcelas || 1))

const valorParcelaResumo = computed(() => {
  if (params.value.metodo === 'AVISTA') return valorInformado.value - desconto.value
  if (store.form.modoValorParcelamento === 'FIXO_PARCELA') return valorInformado.value

  const total = valorInformado.value - desconto.value - valorEntrada.value
  return parcelasQuantidade.value > 0 ? total / parcelasQuantidade.value : 0
})

const totalResumo = computed(() => {
  if (params.value.metodo === 'AVISTA') return valorInformado.value - desconto.value
  if (store.form.modoValorParcelamento === 'FIXO_PARCELA') {
    return valorEntrada.value + valorInformado.value * parcelasQuantidade.value
  }
  return valorInformado.value - desconto.value
})

const descricaoPeriodo = computed(() => {
  switch (store.form.periodoParcelamento) {
    case 'DIARIO':
      return 'diário'
    case 'SEMANAL':
      return 'semanal'
    case 'QUINZENAL':
      return 'quinzenal'
    case 'PERSONALIZADO':
      return `a cada ${store.form.intervaloDiasPersonalizado || 0} dia(s)`
    case 'MENSAL':
    default:
      return 'mensal'
  }
})

async function submitFormulario() {
  if (isEditMode.value) {
    await LancamentosRepository.atualizarLancamento(store.form.id!, {
      categoriaId: store.form.categoriaId,
      clienteId: store.form.clienteId,
      descricao: store.form.descricao,
      contasFinanceiroId: store.form.contasFinanceiroId,
      formaPagamento: store.form.formaPagamento,
    })
    store.openModal = false
    store.updateTable()
    store.reset()
    params.value = { metodo: 'AVISTA', lancamentoEfetivado: false, hasEntrada: false }
    toast.success('Lançamento atualizado com sucesso')
    return
  }

  if (params.value.hasEntrada && valorEntrada.value >= totalResumo.value) {
    toast.error('O valor de entrada deve ser menor que o valor total', {
      timeout: 3000,
      position: POSITION.BOTTOM_RIGHT,
    })
    return
  }

  if (!descontoDesabilitado.value && desconto.value >= valorInformado.value) {
    toast.error('O desconto não pode ser maior que o valor total', {
      timeout: 3000,
      position: POSITION.BOTTOM_RIGHT,
    })
    return
  }

  const data = {
    categoriaId: store.form.categoriaId,
    clienteId: store.form.clienteId,
    descricao: store.form.descricao,
    contasFinanceiroId: store.form.contasFinanceiroId,
    dataEntrada: params.value.hasEntrada ? store.form.dataEntrada : null,
    dataLancamento: store.form.dataLancamento,
    desconto: descontoDesabilitado.value ? 0 : formatToNumberValue(store.form.desconto),
    lancamentoEfetivado: params.value.lancamentoEfetivado,
    tipoLancamentoModo: params.value.metodo,
    formaPagamento: store.form.formaPagamento,
    parcelas: params.value.metodo === 'PARCELADO' ? store.form.parcelas : 1,
    valorEntrada: params.value.hasEntrada ? formatToNumberValue(store.form.valorEntrada) : 0,
    tipo: store.form.tipo,
    valorTotal: formatToNumberValue(store.form.valorTotal),
    periodoParcelamento: params.value.metodo === 'PARCELADO' ? store.form.periodoParcelamento : 'MENSAL',
    intervaloDiasPersonalizado:
      params.value.metodo === 'PARCELADO' && store.form.periodoParcelamento === 'PERSONALIZADO'
        ? Number(store.form.intervaloDiasPersonalizado || 0)
        : null,
    modoValorParcelamento:
      params.value.metodo === 'PARCELADO' ? store.form.modoValorParcelamento : 'TOTAL',
  } as FormularioLancamento & {
    lancamentoEfetivado: boolean
    tipoLancamentoModo: 'AVISTA' | 'PARCELADO'
  }

  await LancamentosRepository.save(data)
  store.openModal = false
  store.updateTable()
  store.reset({ preserveBatchFields: true, preserveDate: true })
  params.value = { metodo: 'AVISTA', lancamentoEfetivado: false, hasEntrada: false }
  toast.success('Lançamento cadastrado com sucesso')
}

const validar = () => {
  erros.value = {}

  if (!store.form.descricao?.trim()) erros.value.descricao = 'A descrição é obrigatória.'
  if (!store.form.categoriaId) erros.value.categoriaId = 'A categoria é obrigatória.'
  if (!store.form.contasFinanceiroId) erros.value.contasFinanceiroId = 'A conta financeira é obrigatória.'

  if (isEditMode.value) return

  if (!store.form.dataLancamento) erros.value.dataLancamento = 'A data é obrigatória.'

  if (params.value.metodo === 'PARCELADO' && parcelasQuantidade.value < 1) {
    erros.value.parcelas = 'Informe ao menos 1 parcela.'
  }

  if (intervaloPersonalizadoAtivo.value && Number(store.form.intervaloDiasPersonalizado || 0) < 1) {
    erros.value.intervaloDiasPersonalizado = 'Informe a quantidade de dias personalizada.'
  }
}

const formularioValido = computed(() => Object.keys(erros.value).length === 0)

const submit = async () => {
  validar()
  if (!formularioValido.value) return

  try {
    await submitFormulario()
  } catch (error: any) {
    console.log(error)
    toast.error(error?.response?.data?.message || 'Erro ao salvar o lançamento!')
  }
}

watch(
  () => params.value.hasEntrada,
  () => {
    if (!params.value.hasEntrada) {
      store.form.valorEntrada = ''
      store.form.dataEntrada = ''
    }
  },
)

watch(
  () => params.value.metodo,
  (value) => {
    if (value === 'AVISTA') {
      store.form.parcelas = 1
      store.form.periodoParcelamento = 'MENSAL'
      store.form.intervaloDiasPersonalizado = null
      store.form.modoValorParcelamento = 'TOTAL'
      params.value.hasEntrada = false
    }
  },
)

watch(
  () => store.form.modoValorParcelamento,
  (value) => {
    if (value === 'FIXO_PARCELA') {
      store.form.desconto = ''
    }
  },
)

watch(
  () => store.openModal,
  (open) => {
    if (!open) {
      erros.value = {}
      params.value = { metodo: 'AVISTA', lancamentoEfetivado: false, hasEntrada: false }
    }
  },
)
</script>

<template>
  <ModalView v-model:open="store.openModal" :title="title" :description="description" size="3xl">
    <form class="space-y-4 px-4" @submit.prevent="submit">
      <template v-if="isEditMode">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="md:col-span-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            Recomendado para manter consistência contábil: valores, datas, parcelamento e status ficam congelados após o lançamento.
            Se for necessário corrigir valor, o ideal é estornar/ajustar com rastreabilidade em vez de reescrever o histórico.
          </div>

          <div class="md:col-span-2">
            <label for="descricao-edicao" class="mb-1 block text-sm font-medium">Descrição *</label>
            <Input id="descricao-edicao" v-model="store.form.descricao" type="text" placeholder="Ex: Mensalidade do cliente XPTO" />
            <p v-if="erros.descricao" class="text-sm text-red-600">{{ erros.descricao }}</p>
          </div>

          <div>
            <label for="formaPagamentoEdicao" class="mb-1 block text-sm font-medium">Forma de pagamento padrão *</label>
            <Select v-model="store.form.formaPagamento">
              <SelectTrigger>
                <SelectValue placeholder="Forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                <SelectItem value="CREDITO">Cartão de Crédito</SelectItem>
                <SelectItem value="DEBITO">Cartão de Débito</SelectItem>
                <SelectItem value="BOLETO">Boleto</SelectItem>
                <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                <SelectItem value="DEPOSITO">Depósito</SelectItem>
                <SelectItem value="CHEQUE">Cheque</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label for="clienteIdLancamentoEdicao" class="mb-1 block text-sm font-medium">
              {{ store.form.tipo === 'RECEITA' ? 'Cliente' : 'Fornecedor' }}
              <a @click="storeCliente.openSave" class="cursor-pointer px-2 text-blue-500">+ Novo</a>
            </label>
            <Select2Ajax id="clienteIdLancamentoEdicao" v-model="store.form.clienteId" url="/clientes/select2" allowClear />
          </div>

          <div>
            <label for="categoriaIdLancamentoEdicao" class="mb-1 block text-sm font-medium">
              Categoria *
              <FormularioCategorias class="cursor-pointer px-2 text-blue-500">+ Nova</FormularioCategorias>
            </label>
            <Select2Ajax id="categoriaIdLancamentoEdicao" v-model="store.form.categoriaId" url="lancamentos/categorias/select2" />
            <p v-if="erros.categoriaId" class="text-sm text-red-600">{{ erros.categoriaId }}</p>
          </div>

          <div>
            <label for="contasFinanceiroIdEdicao" class="mb-1 block text-sm font-medium">
              Conta *
              <FormularioContas class="cursor-pointer px-2 text-blue-500">+ Nova</FormularioContas>
            </label>
            <Select2Ajax id="contasFinanceiroIdEdicao" v-model="store.form.contasFinanceiroId" url="lancamentos/contas/select2" />
            <p v-if="erros.contasFinanceiroId" class="text-sm text-red-600">{{ erros.contasFinanceiroId }}</p>
          </div>
        </div>
      </template>

      <template v-else>
        <div class="grid grid-cols-1 gap-3">
          <div class="grid grid-cols-12 gap-3">
            <div class="col-span-12 md:col-span-8">
              <label for="descricao" class="mb-1 block text-sm font-medium">Descrição *</label>
              <Input
                id="descricao"
                v-model="store.form.descricao"
                type="text"
                name="descricao"
                required
                placeholder="Ex: Venda de 1 notebook"
              />
              <p v-if="erros.descricao" class="text-sm text-red-600">{{ erros.descricao }}</p>
            </div>
            <div class="col-span-6 md:col-span-4">
              <label for="dataFinanceiroLancamento" class="mb-1 block text-sm font-medium">
                {{ params.metodo === 'AVISTA' ? 'Data vencimento' : 'Data primeira parcela' }} *
              </label>
              <Calendarpicker
                id="dataFinanceiroLancamento"
                :teleport="true"
                :required="false"
                name="dataLancamento"
                v-model="store.form.dataLancamento"
              />
              <p v-if="erros.dataLancamento" class="text-sm text-red-600">{{ erros.dataLancamento }}</p>
            </div>

            <div class="col-span-6 md:col-span-4">
              <label for="tipoLancamentoFinanceiro" class="mb-1 block text-sm font-medium">Tipo/Natureza *</label>
              <Select disabled v-model="store.form.tipo" required>
                <SelectTrigger>
                  <SelectValue placeholder="Natureza" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEITA">Receita</SelectItem>
                  <SelectItem value="DESPESA">Despesa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="col-span-6 md:col-span-4">
              <label for="valorTotalLancamento" class="mb-1 block text-sm font-medium">{{ valorInputLabel }}</label>
              <Input
                id="valorTotalLancamento"
                v-model="store.form.valorTotal"
                v-maska="moneyMaskOptions"
                type="text"
                name="valorTotal"
                required
                placeholder="0,00"
              />
            </div>

            <div class="col-span-6 md:col-span-4">
              <label for="descontoFormularioLancamento" class="mb-1 block text-sm font-medium">
                Desconto
                <span v-if="descontoDesabilitado" class="text-xs text-muted-foreground">(indisponível com valor fixo)</span>
              </label>
              <Input
                id="descontoFormularioLancamento"
                v-model="store.form.desconto"
                :disabled="descontoDesabilitado"
                type="text"
                v-maska="moneyMaskOptions"
                name="desconto"
                placeholder="0,00"
              />
            </div>

            <div :class="[params.metodo === 'AVISTA' ? 'col-span-6 md:col-span-6' : 'col-span-6 md:col-span-3']">
              <label for="metodoLancamentoModoLancamento" class="mb-1 block text-sm font-medium">Método *</label>
              <Select v-model="params.metodo" required id="metodoLancamentoModoLancamento">
                <SelectTrigger>
                  <SelectValue placeholder="Forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AVISTA">À vista</SelectItem>
                  <SelectItem value="PARCELADO">Parcelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="params.metodo === 'PARCELADO'" class="col-span-6 md:col-span-3">
              <label for="parcelas" class="mb-1 block text-sm font-medium">Parcelas *</label>
              <Input id="parcelas" v-model="store.form.parcelas" type="number" min="1" required placeholder="1" />
              <p v-if="erros.parcelas" class="text-sm text-red-600">{{ erros.parcelas }}</p>
            </div>

            <div
              :class="[
                'mb-1 block text-sm font-medium',
                params.metodo === 'AVISTA' ? 'col-span-6' : 'col-span-6 md:col-span-3',
              ]"
            >
              <span class="mb-0 block text-sm font-medium">Efetivado</span>
              <div class="mt-1 items-center gap-2">
                <label
                  for="lancamentoEfetivadoTotal"
                  class="flex h-[36px] cursor-pointer rounded-lg border border-border bg-card px-3 dark:bg-card-dark"
                >
                  <div class="flex items-center">
                    <label class="relative inline-flex cursor-pointer items-center">
                      <Switch id="lancamentoEfetivadoTotal" v-model="params.lancamentoEfetivado" />
                      <span class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Efetivado</span>
                    </label>
                  </div>
                </label>
              </div>
            </div>

            <div v-if="params.metodo === 'PARCELADO'" class="col-span-6 md:col-span-3">
              <span class="mb-0 block text-sm font-medium">Entrada</span>
              <div class="mt-1 items-center gap-2">
                <label
                  for="temEntradaLancamento"
                  class="flex h-[36px] cursor-pointer rounded-lg border border-border bg-card px-3 dark:bg-card-dark"
                >
                  <div class="flex items-center">
                    <label class="relative inline-flex cursor-pointer items-center">
                      <Switch id="temEntradaLancamento" v-model="params.hasEntrada" />
                      <span class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                        {{ params.hasEntrada ? 'Sim' : 'Não' }}
                      </span>
                    </label>
                  </div>
                </label>
              </div>
            </div>

            <template v-if="params.metodo === 'PARCELADO'">
              <div class="col-span-12 md:col-span-6">
                <label class="mb-1 block text-sm font-medium">Como aplicar o valor</label>
                <Select v-model="store.form.modoValorParcelamento">
                  <SelectTrigger>
                    <SelectValue placeholder="Como aplicar o valor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOTAL">Dividir o valor total entre as parcelas</SelectItem>
                    <SelectItem value="FIXO_PARCELA">Usar o valor informado em todas as parcelas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div class="col-span-12 md:col-span-6">
                <label class="mb-1 block text-sm font-medium">Período de parcelamento</label>
                <Select v-model="store.form.periodoParcelamento">
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MENSAL">Mensal</SelectItem>
                    <SelectItem value="SEMANAL">Semanal</SelectItem>
                    <SelectItem value="DIARIO">Diário</SelectItem>
                    <SelectItem value="QUINZENAL">Quinzenal</SelectItem>
                    <SelectItem value="PERSONALIZADO">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div v-if="intervaloPersonalizadoAtivo" class="col-span-12 md:col-span-4">
                <label class="mb-1 block text-sm font-medium">Quantidade de dias *</label>
                <Input
                  :model-value="store.form.intervaloDiasPersonalizado ?? ''"
                  @update:model-value="(value) => (store.form.intervaloDiasPersonalizado = value as string | number)"
                  type="number"
                  min="1"
                  placeholder="Ex: 10"
                />
                <p v-if="erros.intervaloDiasPersonalizado" class="text-sm text-red-600">
                  {{ erros.intervaloDiasPersonalizado }}
                </p>
              </div>
            </template>

            <div v-if="params.metodo === 'PARCELADO' && params.hasEntrada" class="col-span-12 grid grid-cols-2 gap-3">
              <div>
                <label for="valorEntradaLancamento" class="mb-1 block text-sm font-medium">Valor Entrada</label>
                <Input
                  id="valorEntradaLancamento"
                  v-model="store.form.valorEntrada"
                  :required="params.hasEntrada"
                  type="text"
                  v-maska="moneyMaskOptions"
                  name="valorEntrada"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label for="dataEntradaLancamento" class="mb-1 block text-sm font-medium">Data Entrada</label>
                <Calendarpicker
                  id="dataEntradaLancamento"
                  :teleport="true"
                  :required="store.form.valorEntrada != '' && params.hasEntrada"
                  name="dataEntrada"
                  v-model="store.form.dataEntrada"
                />
              </div>
            </div>

            <div class="col-span-6">
              <label for="formaPagamentoLancamento" class="mb-1 block text-sm font-medium">Forma de Pagamento *</label>
              <Select v-model="store.form.formaPagamento" required>
                <SelectTrigger>
                  <SelectValue placeholder="Forma de pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  <SelectItem value="CREDITO">Cartão de Crédito</SelectItem>
                  <SelectItem value="DEBITO">Cartão de Débito</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="col-span-6">
              <label for="clienteIdLancamento" class="mb-1 block text-sm font-medium">
                {{ store.form.tipo === 'RECEITA' ? 'Cliente' : 'Fornecedor' }}
                <a @click="storeCliente.openSave" class="cursor-pointer px-2 text-blue-500">+ Novo</a>
              </label>
              <Select2Ajax id="clienteIdLancamento" v-model="store.form.clienteId" url="/clientes/select2" allowClear />
            </div>

            <div class="col-span-6">
              <label for="categoriaIdLancamento" class="mb-1 block text-sm font-medium">
                Categoria *
                <FormularioCategorias class="cursor-pointer px-2 text-blue-500">+ Nova</FormularioCategorias>
              </label>
              <Select2Ajax id="categoriaIdLancamento" v-model="store.form.categoriaId" url="lancamentos/categorias/select2" />
              <p v-if="erros.categoriaId" class="text-sm text-red-600">{{ erros.categoriaId }}</p>
            </div>

            <div class="col-span-6">
              <label for="contasFinanceiroId" class="mb-1 block text-sm font-medium">
                Conta *
                <FormularioContas class="cursor-pointer px-2 text-blue-500">+ Nova</FormularioContas>
              </label>
              <Select2Ajax id="contasFinanceiroId" v-model="store.form.contasFinanceiroId" url="lancamentos/contas/select2" />
              <p v-if="erros.contasFinanceiroId" class="text-sm text-red-600">{{ erros.contasFinanceiroId }}</p>
            </div>
          </div>

          <div class="flex flex-col rounded-md border bg-gray-50 px-4 py-2 dark:bg-gray-900">
            <span class="text-muted-foreground">Resumo do lançamento</span>
            <span class="text-sm">Total previsto: {{ formatCurrencyBR(totalResumo) }}</span>
            <span v-if="desconto && !descontoDesabilitado" class="text-sm">Desconto aplicado: {{ formatCurrencyBR(desconto) }}</span>
            <span v-if="params.metodo === 'PARCELADO' && params.hasEntrada" class="text-sm">
              Entrada de: {{ formatCurrencyBR(store.form.valorEntrada) }}
            </span>
            <span v-if="params.metodo === 'PARCELADO'" class="text-sm">
              {{ params.hasEntrada ? 'Mais' : 'Em' }} {{ store.form.parcelas }} parcela(s)
              {{ store.form.modoValorParcelamento === 'FIXO_PARCELA' ? 'fixas' : '' }} de:
              {{ formatCurrencyBR(valorParcelaResumo) }}
            </span>
            <span v-if="params.metodo === 'PARCELADO'" class="text-sm capitalize">
              Periodicidade: {{ descricaoPeriodo }}
            </span>
            <span class="text-sm">
              {{ params.metodo === 'AVISTA' ? 'Vencimento' : 'Primeira parcela' }}:
              {{ formatDateToPtBR(store.form.dataLancamento as string) }}
            </span>
          </div>
        </div>
      </template>

      <div class="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="store.openModal = false">Fechar</Button>
        <Button class="text-white" type="submit">{{ isEditMode ? 'Salvar alterações' : 'Registrar' }}</Button>
      </div>
    </form>
  </ModalView>
</template>
