<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { FilePlus } from 'lucide-vue-next'

import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { formatCurrencyBR } from '@/utils/formatters'

type ParcelaCobranca = { id: number; valor: number }

const props = defineProps<{
  open: boolean
  parcelas: ParcelaCobranca[]
  clienteId?: number | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  finished: []
}>()

const toast = useToast()

const gateway = ref<'mercadopago' | 'abacatepay' | undefined>(undefined)
const tipo = ref<'PIX' | 'BOLETO' | 'LINK'>('PIX')
const processando = ref(false)
const progresso = ref(0)

const valorTotal = computed(() => props.parcelas.reduce((acc, parcela) => acc + Number(parcela.valor || 0), 0))
// Boleto exige cliente e valor mínimo por cobrança, igual ao fluxo individual.
const parcelasAbaixoDoMinimoBoleto = computed(() => props.parcelas.filter((parcela) => Number(parcela.valor || 0) < 4))

watch(
  () => props.open,
  (aberto) => {
    if (!aberto) return
    gateway.value = undefined
    tipo.value = 'PIX'
    progresso.value = 0
  },
)

async function gerar() {
  if (!gateway.value) {
    toast.error('Gateway de pagamento nao informado!', { timeout: 5000 })
    return
  }

  if (!props.parcelas.length) {
    toast.error('Nenhuma parcela pendente sem cobrança selecionada.')
    return
  }

  if (tipo.value === 'BOLETO') {
    if (!props.clienteId) {
      toast.error('Informe o cliente do lançamento para gerar boletos.', { timeout: 5000 })
      return
    }
    if (parcelasAbaixoDoMinimoBoleto.value.length) {
      toast.error('O valor mínimo para boleto é R$ 4,00 e há parcelas abaixo desse valor.', { timeout: 5000 })
      return
    }
  }

  processando.value = true
  progresso.value = 0
  let sucesso = 0
  const falhas: string[] = []

  // O gateway gera uma cobrança por requisição, então o lote roda sequencialmente
  // e um erro isolado nunca interrompe as demais parcelas.
  for (const parcela of props.parcelas) {
    try {
      await LancamentosRepository.gerarCobranca(
        tipo.value,
        Number(parcela.valor || 0),
        gateway.value,
        props.clienteId ?? null,
        { id: parcela.id, tipo: 'parcela' },
      )
      sucesso++
    } catch (error: any) {
      console.error(error)
      falhas.push(error?.response?.data?.message || 'Erro desconhecido')
    } finally {
      progresso.value++
    }
  }

  processando.value = false

  if (sucesso > 0) toast.success(`${sucesso} cobrança(s) gerada(s) com sucesso.`)
  if (falhas.length) {
    toast.error(`${falhas.length} cobrança(s) não puderam ser geradas: ${falhas[0]}`, { timeout: 8000 })
  }

  emit('finished')
  if (!falhas.length) emit('update:open', false)
}
</script>

<template>
  <ModalView
    :open="open"
    size="lg"
    title="Gerar cobranças em lote"
    :description="`Uma cobrança será criada para cada parcela selecionada, com o valor da própria parcela.`"
    @update:open="emit('update:open', $event)"
  >
    <div class="grid gap-4 px-4">
      <div class="rounded-xl border bg-muted/20 p-4 text-sm">
        <p class="font-medium text-foreground">
          {{ parcelas.length }} parcela(s) • {{ formatCurrencyBR(valorTotal) }}
        </p>
        <p class="mt-1 text-xs text-muted-foreground">
          Só entram parcelas pendentes que ainda não possuem cobrança vinculada.
        </p>
      </div>

      <div>
        <Label>Gateway</Label>
        <Select v-model="gateway">
          <SelectTrigger class="w-full">
            <SelectValue placeholder="Selecione o gateway" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="mercadopago">Mercado pago</SelectItem>
              <SelectItem value="abacatepay">AbacatePay</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <div v-show="gateway">
        <RadioGroup v-model="tipo" default-value="PIX" class="grid grid-cols-3">
          <Label for="lote-pix" class="flex cursor-pointer items-center gap-2 rounded-lg border bg-success/20 p-3 px-4 text-sm">
            <RadioGroupItem id="lote-pix" value="PIX" class="bg-white" />
            PIX
          </Label>
          <Label for="lote-boleto" class="flex cursor-pointer items-center gap-2 rounded-lg border bg-body/70 p-3 px-4 text-sm">
            <RadioGroupItem id="lote-boleto" value="BOLETO" class="bg-white" />
            Boleto
          </Label>
          <Label for="lote-link" class="flex cursor-pointer items-center gap-2 rounded-lg border bg-primary/20 p-3 px-4 text-sm">
            <RadioGroupItem id="lote-link" value="LINK" class="bg-white" />
            Link
          </Label>
        </RadioGroup>
      </div>

      <p v-if="tipo === 'BOLETO' && !clienteId" class="text-xs text-rose-600">
        Este lançamento não tem cliente vinculado — boletos exigem um cliente.
      </p>
      <p v-else-if="tipo === 'BOLETO' && parcelasAbaixoDoMinimoBoleto.length" class="text-xs text-rose-600">
        {{ parcelasAbaixoDoMinimoBoleto.length }} parcela(s) abaixo do mínimo de R$ 4,00 para boleto.
      </p>

      <p v-if="processando" class="text-sm text-muted-foreground">
        Gerando cobrança {{ progresso }} de {{ parcelas.length }}...
      </p>

      <div class="mt-2 flex justify-end gap-2">
        <Button type="button" variant="secondary" :disabled="processando" @click="emit('update:open', false)">
          Fechar
        </Button>
        <Button type="button" class="text-white" :disabled="processando || !gateway" @click="gerar">
          <FilePlus class="h-4 w-4" />
          {{ processando ? `Gerando ${progresso}/${parcelas.length}...` : 'Gerar cobranças' }}
        </Button>
      </div>
    </div>
  </ModalView>
</template>
