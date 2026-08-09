<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { VendaRepository, type VendaEfetivar } from '@/repositories/venda-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import { useVendasStore } from '@/stores/vendas/useVenda'
import { MetodoPagamento } from '@/types/schemas'
import { Input } from '@/components/ui/input'
import { formatCurrencyBR, formatToNumberValue } from '@/utils/formatters'
import { moneyMaskOptions } from '@/lib/imaska'
import { vMaska } from 'maska/vue'

const store = useVendasStore()
const uiStore = useUiStore()
const toast = useToast()

// Com o parâmetro da conta ligado o backend lança sempre; o modal deixa de
// oferecer a escolha para não prometer algo que ele não decide mais.
const lancamentoSempreAutomatico = computed(() => uiStore.vendaLancamentoAutomatico)

function createDefaultForm(): VendaEfetivar {
  return {
    cancelarCobrancaExterna: true,
    categoria: null,
    conta: null,
    dataPagamento: new Date().toISOString().split('T')[0],
    pagamento: MetodoPagamento.PIX,
    lancamentoManual: true,
  }
}

const faturarVenda = ref<VendaEfetivar>(createDefaultForm())
const pagamentoDividido = ref(false)
const pagamentos = ref<Array<{ metodo: MetodoPagamento; valor: string }>>([])
const valorVenda = ref(0)

const qtdFaturamento = computed(() =>
  store.idsFaturarMassa.length ? store.idsFaturarMassa.length : store.idMutation ? 1 : 0,
)
const emMassa = computed(() => store.idsFaturarMassa.length > 1)
const totalPagamentos = computed(() =>
  pagamentos.value.reduce((total, item) => total + formatToNumberValue(item.valor || 0), 0),
)
const saldoPagamento = computed(() => Math.max(0, valorVenda.value - totalPagamentos.value))

const lancamentoAutomatico = computed({
  get: () => !faturarVenda.value.lancamentoManual,
  set: (value: boolean) => {
    faturarVenda.value.lancamentoManual = !value
  },
})

watch(
  () => store.openModalFaturar,
  (isOpen) => {
    if (isOpen) {
      faturarVenda.value = createDefaultForm()
      pagamentoDividido.value = false
      pagamentos.value = []
      valorVenda.value = 0
      if (store.idMutation && !store.idsFaturarMassa.length) {
        void VendaRepository.get(store.idMutation).then((response: any) => {
          valorVenda.value = Number(response?.data?.valor || response?.valor || 0)
        })
      }
    }
  },
)

function finalizarFaturamento() {
  store.idMutation = null
  store.idsFaturarMassa = []
  store.openModalFaturar = false
  store.updateTable()
}

function alternarPagamentoDividido() {
  pagamentoDividido.value = !pagamentoDividido.value
  pagamentos.value = pagamentoDividido.value
    ? [
        {
          metodo: faturarVenda.value.pagamento,
          valor: valorVenda.value.toFixed(2).replace('.', ','),
        },
      ]
    : []
}

function adicionarPagamento() {
  pagamentos.value.push({
    metodo: faturarVenda.value.pagamento,
    valor: Math.max(0, valorVenda.value - totalPagamentos.value)
      .toFixed(2)
      .replace('.', ','),
  })
}

function removerPagamento(index: number) {
  pagamentos.value.splice(index, 1)
}

async function submit() {
  const ids = store.idsFaturarMassa.length
    ? [...store.idsFaturarMassa]
    : store.idMutation
      ? [store.idMutation]
      : []

  if (!ids.length) return toast.error('Nenhuma venda informada!')
  if (pagamentoDividido.value && Math.abs(totalPagamentos.value - valorVenda.value) > 0.004) {
    return toast.error('A soma dos pagamentos deve ser igual ao total da venda.')
  }
  const dadosPagamento: VendaEfetivar = {
    ...faturarVenda.value,
    pagamento: pagamentoDividido.value ? MetodoPagamento.OUTRO : faturarVenda.value.pagamento,
    pagamentos: pagamentoDividido.value
      ? pagamentos.value.map((item) => ({
          metodo: item.metodo,
          valor: formatToNumberValue(item.valor || 0),
        }))
      : undefined,
  }

  // Faturamento individual: mantém o erro detalhado vindo do backend.
  if (ids.length === 1) {
    try {
      await VendaRepository.efetivar(ids[0], dadosPagamento)
      finalizarFaturamento()
      toast.success('Venda faturada com sucesso')
    } catch (error: any) {
      console.log(error)
      finalizarFaturamento()
      toast.error(error.response?.data?.message || 'Erro ao faturar a venda!', {
        timeout: 3000,
      })
    }
    return
  }

  // Faturamento em massa: aplica os mesmos dados de pagamento a cada venda.
  let sucesso = 0
  let falhas = 0
  for (const id of ids) {
    try {
      await VendaRepository.efetivar(id, faturarVenda.value)
      sucesso++
    } catch (error) {
      console.log(error)
      falhas++
    }
  }
  finalizarFaturamento()
  if (sucesso > 0) toast.success(`${sucesso} venda(s) faturada(s) com sucesso.`)
  if (falhas > 0) toast.error(`${falhas} venda(s) não puderam ser faturada(s).`, { timeout: 4000 })
}
</script>

<template>
  <ModalView
    v-model:open="store.openModalFaturar"
    :title="emMassa ? `Faturar ${qtdFaturamento} vendas` : 'Faturar venda'"
    size="lg"
    :description="
      emMassa
        ? 'Os mesmos dados de pagamento serão aplicados a todas as vendas selecionadas.'
        : 'Preencha os dados para faturar a venda'
    "
  >
    <form class="flex flex-col px-4" @submit.prevent="submit">
      <div class="grid h-full w-full grid-cols-1 gap-4 rounded-md bg-background md:grid-cols-2">
        <div class="flex w-full flex-col gap-2">
          <Label for="formaPagamento">Forma de pagamento</Label>
          <Select v-model="faturarVenda.pagamento">
            <SelectTrigger class="w-full bg-card">
              <SelectValue placeholder="Selecione o pagamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Formas de Pagamento</SelectLabel>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="DINHEIRO">DINHEIRO</SelectItem>
                <SelectItem value="CARTAO">CARTAO</SelectItem>
                <SelectItem value="BOLETO">BOLETO</SelectItem>
                <SelectItem value="TRANSFERENCIA">TRANSFERENCIA</SelectItem>
                <SelectItem value="CHEQUE">CHEQUE</SelectItem>
                <SelectItem value="CREDITO">CREDITO</SelectItem>
                <SelectItem value="DEBITO">DEBITO</SelectItem>
                <SelectItem value="GATEWAY">GATEWAY</SelectItem>
                <SelectItem value="OUTRO">OUTRO</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div class="flex w-full flex-col gap-2">
          <Label for="dataPagamento">Data</Label>
          <Calendarpicker
            id="dataPagamento"
            required
            teleport
            v-model="(faturarVenda.dataPagamento as Date)"
          />
        </div>

        <div
          v-if="!emMassa"
          class="col-span-1 rounded-lg border border-dashed bg-card p-3 md:col-span-2"
        >
          <div class="flex items-center justify-between gap-3">
            <div>
              <Label>Pagamento dividido</Label>
              <p class="text-sm text-muted-foreground">
                Registre o valor da venda em mais de uma forma de pagamento.
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" @click="alternarPagamentoDividido">
              {{ pagamentoDividido ? 'Usar uma forma' : 'Dividir' }}
            </Button>
          </div>
          <div v-if="pagamentoDividido" class="mt-3 space-y-2">
            <div
              v-for="(item, index) in pagamentos"
              :key="index"
              class="grid grid-cols-[1fr_9rem_auto] gap-2"
            >
              <Select v-model="item.metodo">
                <SelectTrigger><SelectValue placeholder="Forma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  <SelectItem value="CARTAO">Cartão</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
              <Input
                v-model="item.valor"
                v-maska="moneyMaskOptions"
                type="text"
                inputmode="decimal"
                placeholder="0,00"
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                :disabled="pagamentos.length === 1"
                @click="removerPagamento(index)"
                >Remover</Button
              >
            </div>
            <div class="flex items-center justify-between text-xs">
              <Button type="button" size="sm" variant="ghost" @click="adicionarPagamento"
                >+ Adicionar forma</Button
              >
              <span :class="saldoPagamento ? 'text-amber-600' : 'text-emerald-600'">
                {{
                  saldoPagamento ? `Falta ${formatCurrencyBR(saldoPagamento)}` : 'Total informado'
                }}
              </span>
            </div>
          </div>
        </div>

        <div
          v-if="!lancamentoSempreAutomatico"
          class="col-span-1 flex items-center justify-between rounded-lg border bg-card p-3 md:col-span-2"
        >
          <div>
            <Label>Lancamento automatico</Label>
            <p class="text-sm text-muted-foreground">
              Ative para criar o lancamento financeiro junto com o faturamento, usando a conta e a
              categoria definidas em Configuracoes &gt; Vendas.
            </p>
          </div>
          <Switch v-model="lancamentoAutomatico" />
        </div>

        <div
          class="col-span-1 flex items-center justify-between rounded-lg border bg-card p-3 md:col-span-2"
        >
          <div>
            <Label>Cancelar cobranca do Mercado Pago</Label>
            <p class="text-sm text-muted-foreground">
              Cancela cobrancas pendentes do Mercado Pago apos registrar o recebimento manual.
            </p>
          </div>
          <Switch v-model="faturarVenda.cancelarCobrancaExterna" />
        </div>

        <p
          v-if="lancamentoSempreAutomatico"
          class="col-span-1 rounded-lg border border-dashed bg-card p-3 text-sm text-muted-foreground md:col-span-2"
        >
          O lancamento financeiro sera criado automaticamente, com a conta e a categoria definidas
          em Configuracoes &gt; Vendas.
        </p>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="store.openModalFaturar = false">
          Fechar
        </Button>
        <Button class="text-white" type="submit"> Registrar </Button>
      </div>
    </form>
  </ModalView>
</template>
