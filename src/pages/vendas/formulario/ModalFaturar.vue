<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import Calendarpicker from '@/components/formulario/calendarpicker.vue'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
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
import FormularioCategorias from '@/pages/financeiro/lancamentos/modais/FormularioCategorias.vue'
import FormularioContas from '@/pages/financeiro/lancamentos/modais/FormularioContas.vue'
import { VendaRepository, type VendaEfetivar } from '@/repositories/venda-repository'
import { useVendasStore } from '@/stores/vendas/useVenda'
import { MetodoPagamento } from '@/types/schemas'

const store = useVendasStore()
const toast = useToast()

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

const qtdFaturamento = computed(() =>
  store.idsFaturarMassa.length ? store.idsFaturarMassa.length : store.idMutation ? 1 : 0,
)
const emMassa = computed(() => store.idsFaturarMassa.length > 1)

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
    }
  },
)

function finalizarFaturamento() {
  store.idMutation = null
  store.idsFaturarMassa = []
  store.openModalFaturar = false
  store.updateTable()
}

async function submit() {
  const ids = store.idsFaturarMassa.length
    ? [...store.idsFaturarMassa]
    : store.idMutation
      ? [store.idMutation]
      : []

  if (!ids.length) return toast.error('Nenhuma venda informada!')

  // Faturamento individual: mantém o erro detalhado vindo do backend.
  if (ids.length === 1) {
    try {
      await VendaRepository.efetivar(ids[0], faturarVenda.value)
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
          <Calendarpicker id="dataPagamento" required teleport v-model="(faturarVenda.dataPagamento as Date)" />
        </div>

        <div class="col-span-1 flex items-center justify-between rounded-lg border bg-card p-3 md:col-span-2">
          <div>
            <Label>Lancamento automatico</Label>
            <p class="text-sm text-muted-foreground">
              Ative para criar o lancamento financeiro junto com o faturamento.
            </p>
          </div>
          <Switch v-model="lancamentoAutomatico" />
        </div>

        <div class="col-span-1 flex items-center justify-between rounded-lg border bg-card p-3 md:col-span-2">
          <div>
            <Label>Cancelar cobranca do Mercado Pago</Label>
            <p class="text-sm text-muted-foreground">
              Cancela cobrancas pendentes do Mercado Pago apos registrar o recebimento manual.
            </p>
          </div>
          <Switch v-model="faturarVenda.cancelarCobrancaExterna" />
        </div>

        <div v-show="lancamentoAutomatico" class="flex w-full flex-col gap-2" :class="{ 'opacity-60': !lancamentoAutomatico }">
          <Label for="contaPagamento">
            Conta
            <FormularioContas class="cursor-pointer px-2 text-blue-500">
              + Nova
            </FormularioContas>
          </Label>
          <Select2Ajax
            id="contaPagamento"
            v-model="faturarVenda.conta"
            :required="lancamentoAutomatico"
            :disabled="!lancamentoAutomatico"
            class="w-full"
            url="lancamentos/contas/select2"
          />
          <p class="text-xs text-muted-foreground">
            {{ lancamentoAutomatico ? 'Selecione a conta financeira.' : 'Ative o lancamento automatico para informar a conta.' }}
          </p>
        </div>

        <div v-show="lancamentoAutomatico" class="flex w-full flex-col gap-2" :class="{ 'opacity-60': !lancamentoAutomatico }">
          <Label for="categoriaFinanceira">
            Categoria
            <FormularioCategorias class="cursor-pointer px-2 text-blue-500">
              + Nova
            </FormularioCategorias>
          </Label>
          <Select2Ajax
            id="categoriaFinanceira"
            v-model="faturarVenda.categoria"
            :required="lancamentoAutomatico"
            :disabled="!lancamentoAutomatico"
            class="w-full"
            url="lancamentos/categorias/select2"
          />
          <p class="text-xs text-muted-foreground">
            {{ lancamentoAutomatico ? 'Selecione a categoria financeira.' : 'Ative o lancamento automatico para informar a categoria.' }}
          </p>
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" @click="store.openModalFaturar = false">
          Fechar
        </Button>
        <Button class="text-white" type="submit">
          Registrar
        </Button>
      </div>
    </form>
  </ModalView>
</template>
