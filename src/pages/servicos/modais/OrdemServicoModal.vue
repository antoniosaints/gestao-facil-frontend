<template>
  <ModalView v-model:open="open" title="Formulario de Ordem de Servico" description="Preencha os campos abaixo">
    <div class="flex flex-col gap-4 px-4">
      <!-- STEPPER -->
      <div class="flex items-center justify-between mt-4 mb-6">
        <div v-for="(label, index) in steps" :key="index" class="flex-1 flex flex-col items-center relative">
          <div :class="[
            'rounded-full w-10 h-10 flex items-center justify-center text-white transition-colors',
            currentStep > index
              ? 'bg-green-600'
              : currentStep === index
                ? 'bg-blue-600'
                : 'bg-gray-400'
          ]">
            <span v-if="currentStep > index">✔</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span class="text-sm mt-2">{{ label }}</span>
          <div v-if="index < steps.length - 1" class="absolute top-5 left-1/2 w-full h-0.5 bg-gray-300 z-[-1]"></div>
        </div>
      </div>

      <!-- STEP 1 - DADOS DA OS -->
      <div v-if="currentStep === 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Cliente</Label>
          <Input v-model="os.cliente" placeholder="Nome do cliente" />
        </div>
        <div>
          <Label>Responsável</Label>
          <Input v-model="os.responsavel" placeholder="Responsável técnico" />
        </div>

        <div>
          <Label>Status</Label>
          <Select v-model="os.status">
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="aberta">Aberta</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="finalizada">Finalizada</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Garantia (em dias)</Label>
          <Input type="number" v-model.number="os.garantia" min="0" />
        </div>

        <div>
          <Label>Data de Início</Label>
          <Input type="date" v-model="os.dataInicio" />
        </div>
        <div>
          <Label>Data Final</Label>
          <Input type="date" v-model="os.dataFinal" />
        </div>

        <div class="sm:col-span-2">
          <Label>Termo de Garantia (opcional)</Label>
          <Textarea v-model="os.termoGarantia" placeholder="Informe o termo (opcional)" />
        </div>

        <div class="sm:col-span-2">
          <Label>Descrição da OS</Label>
          <Textarea v-model="os.descricao" placeholder="Descreva o problema/serviço..." />
        </div>

        <div class="col-span-2 text-right mt-4">
          <Button @click="nextStep" :disabled="!canNextStep">Próximo</Button>
        </div>
      </div>

      <!-- STEP 2 - ITENS -->
      <div v-if="currentStep === 1" class="space-y-4 max-h-[60vh] overflow-auto px-1">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <div>
            <Label>Descrição do Item</Label>
            <Input v-model="novoItem.descricao" placeholder="Produto ou serviço" />
          </div>
          <div>
            <Label>Quantidade</Label>
            <Input type="number" v-model.number="novoItem.qtd" min="1" />
          </div>
          <div>
            <Label>Valor Unitário</Label>
            <Input type="number" v-model.number="novoItem.valor" step="0.01" />
          </div>
        </div>
        <div class="flex justify-end">
          <Button @click="adicionarItem" :disabled="!novoItem.descricao || !novoItem.qtd || !novoItem.valor">
            Adicionar Item
          </Button>
        </div>

        <!-- Lista de Itens -->
        <div v-if="itens.length" class="border rounded-lg divide-y">
          <div v-for="(item, index) in itens" :key="index"
            class="flex justify-between items-center p-2 hover:bg-gray-50">
            <div>
              <p class="font-medium">{{ item.descricao }}</p>
              <p class="text-sm text-gray-500">{{ item.qtd }} x R$ {{ item.valor.toFixed(2) }}</p>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-semibold">R$ {{ (item.qtd * item.valor).toFixed(2) }}</span>
              <Button variant="destructive" size="sm" @click="removerItem(index)">Remover</Button>
            </div>
          </div>
        </div>

        <!-- Descontos -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          <div>
            <Label>Desconto (%)</Label>
            <Input type="number" v-model.number="descontoPercentual" min="0" max="100" />
          </div>
          <div>
            <Label>Desconto (R$)</Label>
            <Input type="number" v-model.number="descontoValor" step="0.01" />
          </div>
        </div>

        <div class="flex justify-between items-center mt-6 border-t pt-4">
          <span class="text-lg font-medium">Total:</span>
          <span class="text-2xl font-bold text-green-700">R$ {{ totalFinal.toFixed(2) }}</span>
        </div>

        <div class="flex justify-between mt-4">
          <Button variant="secondary" @click="prevStep">Voltar</Button>
          <Button @click="nextStep" :disabled="itens.length === 0">Próximo</Button>
        </div>
      </div>

      <!-- STEP 3 - RESUMO -->
      <div v-if="currentStep === 2" class="space-y-6">
        <div class="bg-gray-50 border p-4 rounded-lg">
          <p><strong>Cliente:</strong> {{ os.cliente }}</p>
          <p><strong>Responsável:</strong> {{ os.responsavel }}</p>
          <p><strong>Status:</strong> {{ os.status }}</p>
          <p><strong>Data:</strong> {{ os.dataInicio }} - {{ os.dataFinal }}</p>
          <p><strong>Garantia:</strong> {{ os.garantia }} dias</p>
          <p v-if="os.termoGarantia"><strong>Termo de Garantia:</strong> {{ os.termoGarantia }}</p>
          <p><strong>Descrição:</strong> {{ os.descricao }}</p>
        </div>

        <div class="border rounded-lg overflow-hidden">
          <div v-for="(item, i) in itens" :key="i" class="flex justify-between p-2 border-b last:border-0">
            <div>
              <p class="font-medium">{{ item.descricao }}</p>
              <p class="text-sm text-gray-500">{{ item.qtd }} x R$ {{ item.valor.toFixed(2) }}</p>
            </div>
            <p class="font-semibold">R$ {{ (item.qtd * item.valor).toFixed(2) }}</p>
          </div>
        </div>

        <div class="flex justify-between items-center mt-4 text-lg">
          <span>Subtotal</span>
          <span>R$ {{ subtotal.toFixed(2) }}</span>
        </div>
        <div v-if="descontoPercentual || descontoValor" class="flex justify-between items-center text-lg">
          <span>Desconto</span>
          <span>- R$ {{ descontoAplicado.toFixed(2) }}</span>
        </div>
        <div class="flex justify-between items-center text-2xl font-bold border-t pt-3">
          <span>Total</span>
          <span class="text-green-700">R$ {{ totalFinal.toFixed(2) }}</span>
        </div>

        <div class="flex justify-between mt-4">
          <Button variant="secondary" @click="prevStep">Voltar</Button>
          <Button @click="finalizar">Finalizar OS</Button>
        </div>
      </div>
    </div>
  </ModalView>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ref, computed } from "vue"
import ModalView from "@/components/formulario/ModalView.vue"

const open = ref(true)
const currentStep = ref(0)
const steps = ["Dados da OS", "Itens e Descontos", "Resumo"]

const os = ref({
  cliente: "",
  responsavel: "",
  status: "",
  garantia: 0,
  termoGarantia: "",
  descricao: "",
  dataInicio: "",
  dataFinal: "",
})

const canNextStep = computed(() =>
  os.value.cliente &&
  os.value.responsavel &&
  os.value.status &&
  os.value.dataInicio &&
  os.value.dataFinal
)

function nextStep() {
  if (currentStep.value < steps.length - 1) currentStep.value++
}
function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

// ITENS
const itens = ref<{ descricao: string; qtd: number; valor: number }[]>([])
const novoItem = ref({ descricao: "", qtd: 1, valor: 0 })
const descontoPercentual = ref(0)
const descontoValor = ref(0)

function adicionarItem() {
  itens.value.push({ ...novoItem.value })
  novoItem.value = { descricao: "", qtd: 1, valor: 0 }
}

function removerItem(index: number) {
  itens.value.splice(index, 1)
}

const subtotal = computed(() =>
  itens.value.reduce((acc, item) => acc + item.qtd * item.valor, 0)
)

const descontoAplicado = computed(() => {
  let desc = 0
  if (descontoPercentual.value) desc = (subtotal.value * descontoPercentual.value) / 100
  if (descontoValor.value) desc += descontoValor.value
  return desc
})

const totalFinal = computed(() => subtotal.value - descontoAplicado.value)

function finalizar() {
  const dadosOS = {
    ...os.value,
    itens: itens.value,
    subtotal: subtotal.value,
    desconto: descontoAplicado.value,
    total: totalFinal.value,
  }
  console.log("✅ OS Finalizada", dadosOS)
  // Aqui você pode fazer POST via axios
  open.value = false
  currentStep.value = 0
  itens.value = []
  descontoPercentual.value = 0
  descontoValor.value = 0
}
</script>
