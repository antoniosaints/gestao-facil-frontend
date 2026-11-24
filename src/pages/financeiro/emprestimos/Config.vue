<script setup lang="ts">
import { ref, watch } from 'vue'
import { SlidersHorizontal } from 'lucide-vue-next'
import { vMaska } from 'maska/vue'
import { useToast } from 'vue-toastification'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { moneyMaskOptions } from '@/lib/imaska'
import {
  emprestimos,
  mensagemEmprestimo,
  type EmprestimoConfig,
} from '@/repositories/emprestimo-repository'

const open = defineModel<boolean>('open', { required: true })
const toast = useToast()
const config = ref<EmprestimoConfig>()
const desconto = ref('0')
const erro = ref('')
const busy = ref(false)

async function carregar() {
  erro.value = ''
  config.value = undefined
  busy.value = true
  try {
    config.value = await emprestimos.config()
    desconto.value = String(config.value.descontoJurosBps / 100).replace('.', ',')
  } catch (error) {
    erro.value = mensagemEmprestimo(error, 'Não foi possível carregar as configurações.')
  } finally {
    busy.value = false
  }
}
watch(open, (value) => {
  if (value) void carregar()
})
async function salvar() {
  if (!config.value || busy.value) return
  const descontoJurosBps = Math.round(Number(desconto.value.replace(',', '.')) * 100)
  if (!Number.isFinite(descontoJurosBps) || descontoJurosBps < 0 || descontoJurosBps > 10_000) {
    erro.value = 'Informe um desconto entre 0% e 100%.'
    return
  }
  busy.value = true
  erro.value = ''
  try {
    const { pixManual, mercadoPago } = config.value
    await emprestimos.config({ pixManual, mercadoPago, descontoJurosBps })
    toast.success('Configurações de empréstimos salvas.')
    open.value = false
  } catch (error) {
    erro.value = mensagemEmprestimo(error, 'Não foi possível salvar as configurações.')
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="open"
    title="Configurações de empréstimos"
    description="Escolha como os clientes podem pagar pelo link público."
    :icon="SlidersHorizontal"
    size="lg"
    content-class="max-h-[90dvh] gap-0 overflow-hidden"
    header-class="shrink-0 border-b px-6 pb-3 pt-4 text-left md:pt-6"
    body-class="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-py-4 px-6 py-4"
  >
    <p v-if="busy && !config" aria-live="polite" class="py-4 text-sm text-muted-foreground">
      Carregando configurações…
    </p>
    <form v-if="config" id="emprestimo-config-form" class="space-y-4" @submit.prevent="salvar">
      <div class="divide-y rounded-xl border">
        <div class="flex items-center justify-between gap-4 p-4">
          <div class="space-y-1">
            <Label for="emprestimo-pix-manual">Pix manual</Label>
            <p id="emprestimo-pix-manual-ajuda" class="text-xs text-muted-foreground">
              Usa a chave Pix cadastrada. Você confere o comprovante e confirma a baixa.
              <template v-if="!config.pixDisponivel"
                >Cadastre a chave Pix da conta para disponibilizar essa opção.</template
              >
            </p>
          </div>
          <Switch
            id="emprestimo-pix-manual"
            v-model="config.pixManual"
            :disabled="busy"
            aria-describedby="emprestimo-pix-manual-ajuda"
          />
        </div>
        <div class="flex items-center justify-between gap-4 p-4">
          <div class="space-y-1">
            <Label for="emprestimo-mercado-pago">Pix via Mercado Pago</Label>
            <p id="emprestimo-mercado-pago-ajuda" class="text-xs text-muted-foreground">
              A baixa ocorre quando o Mercado Pago confirma o pagamento.
              <template v-if="!config.gatewayDisponivel"
                >Conecte sua conta em Apps → Mercado Pago para disponibilizar essa opção.</template
              >
            </p>
          </div>
          <Switch
            id="emprestimo-mercado-pago"
            v-model="config.mercadoPago"
            :disabled="busy"
            aria-describedby="emprestimo-mercado-pago-ajuda"
          />
        </div>
      </div>
      <div class="space-y-2">
        <Label for="emprestimo-desconto">Desconto por antecipação (%)</Label>
        <Input
          id="emprestimo-desconto"
          v-model="desconto"
          v-maska="moneyMaskOptions"
          inputmode="decimal"
          class="max-w-32"
          :disabled="busy"
          aria-describedby="emprestimo-desconto-ajuda"
        />
        <p id="emprestimo-desconto-ajuda" class="text-xs text-muted-foreground">
          Padrão da conta para parcelas pagas antes do vencimento. Pode ser ajustado no cadastro de
          cada empréstimo e vale sobre os juros do contrato.
        </p>
      </div>
      <p v-if="erro" role="alert" class="text-sm text-destructive">{{ erro }}</p>
    </form>
    <div v-else-if="erro" class="space-y-3">
      <p role="alert" class="text-sm text-destructive">{{ erro }}</p>
      <Button variant="outline" @click="carregar">Tentar novamente</Button>
    </div>

    <template v-if="config" #footer>
      <div class="flex flex-wrap justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          class="flex-1 sm:flex-none"
          :disabled="busy"
          @click="open = false"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="emprestimo-config-form"
          class="flex-1 sm:flex-none"
          :disabled="busy"
        >
          {{ busy ? 'Salvando…' : 'Salvar configurações' }}
        </Button>
      </div>
    </template>
  </ModalView>
</template>
