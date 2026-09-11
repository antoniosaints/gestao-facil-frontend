<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CheckSquare, FileDown, QrCode, Square } from 'lucide-vue-next'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ContaRepository } from '@/repositories/conta-repository'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import type { LancamentoFinanceiro, ParcelaFinanceiro } from '@/types/schemas'
import { formatCurrencyBR, formatDateToPtBR } from '@/utils/formatters'
import { useToast } from 'vue-toastification'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  lancamento: LancamentoFinanceiro
}>()

const toast = useToast()
const chavePix = ref('')
const tinhaChavePixConfigurada = ref(false)
const incluirPix = ref(false)
const confirmarChavePix = ref(false)
const observacao = ref('')
const parcelaIds = ref<number[]>([])
const loadingParametros = ref(false)
const exporting = ref(false)

const parcelas = computed(() => (props.lancamento.parcelas ?? []).filter((parcela) => parcela.id))
const todasSelecionadas = computed(
  () => parcelas.value.length > 0 && parcelas.value.every((parcela) => parcelaIds.value.includes(parcela.id!)),
)
const totalSelecionado = computed(() =>
  parcelas.value
    .filter((parcela) => parcelaIds.value.includes(parcela.id!))
    .reduce((total, parcela) => total + Number(parcela.valor || 0), 0),
)
const totalLancamento = computed(() =>
  parcelas.value.reduce((total, parcela) => total + Number(parcela.valor || 0), 0),
)

function selecionarTodas(selecionar: boolean) {
  parcelaIds.value = selecionar ? parcelas.value.map((parcela) => parcela.id!) : []
}

function selecionarParcela(parcela: ParcelaFinanceiro, selecionar: boolean | string) {
  if (!parcela.id) return
  if (selecionar) {
    parcelaIds.value = [...new Set([...parcelaIds.value, parcela.id])]
    return
  }
  parcelaIds.value = parcelaIds.value.filter((id) => id !== parcela.id)
}

async function carregarChavePix() {
  try {
    loadingParametros.value = true
    const response = await ContaRepository.getParametros()
    chavePix.value = String(response?.data?.chavePix ?? '').trim()
    tinhaChavePixConfigurada.value = Boolean(chavePix.value)
    incluirPix.value = Boolean(chavePix.value)
  } catch (error) {
    console.error(error)
    chavePix.value = ''
    tinhaChavePixConfigurada.value = false
    incluirPix.value = false
    toast.warning('Não foi possível carregar a chave PIX das configurações.')
  } finally {
    loadingParametros.value = false
  }
}

function prepararModal() {
  parcelaIds.value = parcelas.value.map((parcela) => parcela.id!)
  observacao.value = ''
  confirmarChavePix.value = false
  carregarChavePix()
}

watch(open, (isOpen) => {
  if (isOpen) prepararModal()
})

async function exportar() {
  if (!props.lancamento.id) return
  if (!parcelaIds.value.length) {
    toast.error('Selecione pelo menos uma parcela para exportar.')
    return
  }
  if (incluirPix.value && !chavePix.value.trim()) {
    toast.error('Informe a chave PIX que deve aparecer na cobrança.')
    return
  }
  if (incluirPix.value && !confirmarChavePix.value) {
    toast.error('Confirme a chave PIX antes de gerar a cobrança.')
    return
  }

  try {
    exporting.value = true
    const response = await LancamentosRepository.exportarCobrancaPdf(props.lancamento.id, {
      parcelaIds: parcelaIds.value,
      observacao: observacao.value.trim() || undefined,
      incluirPix: incluirPix.value,
      chavePix: incluirPix.value ? chavePix.value.trim() : undefined,
    })
    const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `cobranca-${props.lancamento.Uid || props.lancamento.id}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success('Cobrança em PDF gerada com sucesso.')
    open.value = false
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Não foi possível gerar a cobrança em PDF.')
  } finally {
    exporting.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="open"
    title="Exportar cobrança em PDF"
    description="Escolha as parcelas e revise as informações que serão enviadas ao cliente."
    size="lg"
    desktop-variant="sheet"
  >
    <div class="space-y-5 px-4">
      <section class="space-y-3">
        <div class="flex items-center justify-between gap-3">
          <div>
            <h3 class="text-sm font-semibold">Parcelas da cobrança</h3>
            <p class="text-xs text-muted-foreground">O PDF mostra o total das parcelas selecionadas.</p>
          </div>
          <Button type="button" variant="outline" size="sm" @click="selecionarTodas(!todasSelecionadas)">
            <CheckSquare v-if="todasSelecionadas" class="h-4 w-4" />
            <Square v-else class="h-4 w-4" />
            {{ todasSelecionadas ? 'Desmarcar todas' : 'Selecionar todas' }}
          </Button>
        </div>

        <div class="max-h-52 divide-y overflow-y-auto rounded-md border border-border">
          <label
            v-for="parcela in parcelas"
            :key="parcela.id"
            class="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted/50"
          >
            <Checkbox
              :model-value="parcelaIds.includes(parcela.id!)"
              @update:model-value="selecionarParcela(parcela, $event)"
            />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-sm font-medium">{{ parcela.descricao || `Parcela ${parcela.numero}` }}</span>
              <span class="text-xs text-muted-foreground">Vencimento: {{ formatDateToPtBR(parcela.vencimento) }}</span>
            </span>
            <span class="text-sm font-semibold">{{ formatCurrencyBR(Number(parcela.valor || 0)) }}</span>
          </label>
          <p v-if="!parcelas.length" class="px-3 py-6 text-center text-sm text-muted-foreground">
            Este lançamento não possui parcelas para exportar.
          </p>
        </div>

        <div class="rounded-md bg-muted px-3 py-2 text-sm">
          <div class="flex justify-between gap-3"><span>Total selecionado</span><strong>{{ formatCurrencyBR(totalSelecionado) }}</strong></div>
          <div v-if="parcelaIds.length !== parcelas.length" class="mt-1 flex justify-between gap-3 text-xs text-muted-foreground"><span>Total de todas as parcelas</span><span>{{ formatCurrencyBR(totalLancamento) }}</span></div>
        </div>
      </section>

      <section class="space-y-3 rounded-md border border-border p-3">
        <div class="flex items-center gap-3">
          <Checkbox v-model="incluirPix" :disabled="loadingParametros" />
          <div>
            <Label class="cursor-pointer">Incluir pagamento via PIX</Label>
            <p class="text-xs text-muted-foreground">Será gerado um QR Code com o valor total selecionado.</p>
          </div>
        </div>
        <div v-if="incluirPix" class="space-y-2">
          <Label for="chave-pix-cobranca">Chave PIX</Label>
          <Input id="chave-pix-cobranca" v-model="chavePix" :disabled="loadingParametros" placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória" @update:model-value="confirmarChavePix = false" />
          <p v-if="tinhaChavePixConfigurada" class="text-xs text-amber-700 dark:text-amber-300">
            Usamos a chave cadastrada nas configurações. Confirme se ela está correta antes de exportar.
          </p>
          <p v-else class="text-xs text-muted-foreground">Nenhuma chave PIX foi encontrada nas configurações. Informe a chave desejada.</p>
          <label class="flex cursor-pointer items-center gap-2 pt-1 text-sm">
            <Checkbox v-model="confirmarChavePix" />
            Confirmo que esta é a chave PIX correta.
          </label>
        </div>
      </section>

      <section class="space-y-2">
        <Label for="observacao-cobranca">Observação no PDF <span class="font-normal text-muted-foreground">(opcional)</span></Label>
        <Textarea id="observacao-cobranca" v-model="observacao" :maxlength="2000" placeholder="Ex.: Em caso de dúvidas, entre em contato conosco." />
      </section>

      <div class="flex justify-end gap-2 pb-1">
        <Button type="button" variant="outline" :disabled="exporting" @click="open = false">Cancelar</Button>
        <Button type="button" :disabled="exporting || !parcelaIds.length || (incluirPix && !confirmarChavePix)" @click="exportar">
          <FileDown class="h-4 w-4" />
          {{ exporting ? 'Gerando PDF...' : 'Exportar PDF' }}
        </Button>
      </div>
    </div>
  </ModalView>
</template>
