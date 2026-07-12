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
import { OrdensServicoRepository, type OrdemServicoEfetivarPayload } from '@/repositories/os-repository'
import { useOrdemServicoStore } from '@/stores/servicos/useOrdensServicos'
import { MetodoPagamento } from '@/types/schemas'

const store = useOrdemServicoStore()
const toast = useToast()

function createDefaultForm(): OrdemServicoEfetivarPayload {
  return {
    cancelarCobrancaExterna: true,
    categoria: null,
    conta: null,
    dataPagamento: new Date().toISOString().split('T')[0],
    pagamento: MetodoPagamento.PIX,
    lancamentoManual: true,
  }
}

const faturarOs = ref<OrdemServicoEfetivarPayload>(createDefaultForm())

const qtdFaturamento = computed(() =>
  store.idsFaturarMassa.length ? store.idsFaturarMassa.length : store.idMutation ? 1 : 0,
)
const emMassa = computed(() => store.idsFaturarMassa.length > 1)

const lancamentoAutomatico = computed({
  get: () => !faturarOs.value.lancamentoManual,
  set: (value: boolean) => {
    faturarOs.value.lancamentoManual = !value
  },
})

watch(
  () => store.openModalFaturar,
  (isOpen) => {
    if (isOpen) {
      faturarOs.value = createDefaultForm()
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

  if (!ids.length) return toast.error('Nenhuma OS informada!')

  // Faturamento individual: mantém o erro detalhado do backend e recarrega o detalhe.
  if (ids.length === 1) {
    try {
      await OrdensServicoRepository.efetivar(ids[0], faturarOs.value)
      finalizarFaturamento()
      toast.success('OS faturada com sucesso')
      await store.reloadDetalhes()
    } catch (error: any) {
      console.log(error)
      finalizarFaturamento()
      toast.error(error.response?.data?.message || 'Erro ao faturar a OS!', {
        timeout: 3000,
      })
    }
    return
  }

  // Faturamento em massa: aplica os mesmos dados de pagamento a cada OS.
  let sucesso = 0
  let falhas = 0
  for (const id of ids) {
    try {
      await OrdensServicoRepository.efetivar(id, faturarOs.value)
      sucesso++
    } catch (error) {
      console.log(error)
      falhas++
    }
  }
  finalizarFaturamento()
  if (sucesso > 0) toast.success(`${sucesso} OS faturada(s) com sucesso.`)
  if (falhas > 0) toast.error(`${falhas} OS não puderam ser faturada(s).`, { timeout: 4000 })
}
</script>

<template>
  <ModalView
    v-model:open="store.openModalFaturar"
    :title="emMassa ? `Faturar ${qtdFaturamento} OS` : 'Faturar OS'"
    size="lg"
    :description="
      emMassa
        ? 'Os mesmos dados de pagamento serão aplicados a todas as OS selecionadas.'
        : 'Preencha os dados para faturar a ordem de serviço'
    "
  >
    <form class="flex flex-col px-4" @submit.prevent="submit">
      <div class="grid h-full w-full grid-cols-1 gap-4 rounded-md bg-background md:grid-cols-2">
        <div class="flex w-full flex-col gap-2">
          <Label for="formaPagamentoOs">Forma de pagamento</Label>
          <Select v-model="faturarOs.pagamento">
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
          <Label for="dataPagamentoOs">Data</Label>
          <Calendarpicker id="dataPagamentoOs" required teleport v-model="(faturarOs.dataPagamento as Date)" />
        </div>

        <div class="col-span-1 flex items-center justify-between rounded-lg border bg-card p-3 md:col-span-2">
          <div>
            <Label>Lançamento automático</Label>
            <p class="text-sm text-muted-foreground">
              Ative para criar o lançamento financeiro junto com o faturamento da OS.
            </p>
          </div>
          <Switch v-model="lancamentoAutomatico" />
        </div>

        <div class="col-span-1 flex items-center justify-between rounded-lg border bg-card p-3 md:col-span-2">
          <div>
            <Label>Cancelar cobrança pendente do Mercado Pago</Label>
            <p class="text-sm text-muted-foreground">
              Cancela cobranças externas pendentes quando o recebimento for registrado manualmente.
            </p>
          </div>
          <Switch v-model="faturarOs.cancelarCobrancaExterna" />
        </div>

        <div v-show="lancamentoAutomatico" class="flex w-full flex-col gap-2" :class="{ 'opacity-60': !lancamentoAutomatico }">
          <Label for="contaPagamentoOs">
            Conta
            <FormularioContas class="cursor-pointer px-2 text-blue-500">
              + Nova
            </FormularioContas>
          </Label>
          <Select2Ajax
            id="contaPagamentoOs"
            v-model="faturarOs.conta"
            :required="lancamentoAutomatico"
            :disabled="!lancamentoAutomatico"
            class="w-full"
            url="lancamentos/contas/select2"
          />
        </div>

        <div v-show="lancamentoAutomatico" class="flex w-full flex-col gap-2" :class="{ 'opacity-60': !lancamentoAutomatico }">
          <Label for="categoriaFinanceiraOs">
            Categoria
            <FormularioCategorias class="cursor-pointer px-2 text-blue-500">
              + Nova
            </FormularioCategorias>
          </Label>
          <Select2Ajax
            id="categoriaFinanceiraOs"
            v-model="faturarOs.categoria"
            :required="lancamentoAutomatico"
            :disabled="!lancamentoAutomatico"
            class="w-full"
            url="lancamentos/categorias/select2"
          />
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
