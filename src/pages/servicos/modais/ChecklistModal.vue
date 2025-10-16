<template>
  <Dialog v-model="open">
    <DialogTrigger as-child>
      <Button @click="open = true">Nova Revisão</Button>
    </DialogTrigger>

    <DialogContent class="max-w-4xl">
      <DialogHeader>
        <DialogTitle>Checklist de Equipamentos</DialogTitle>
      </DialogHeader>

      <!-- STEPPER -->
      <div class="flex items-center justify-between mt-4 mb-6">
        <div
          v-for="(label, index) in steps"
          :key="index"
          class="flex-1 flex flex-col items-center relative"
        >
          <div
            :class="[
              'rounded-full w-10 h-10 flex items-center justify-center text-white transition-colors',
              currentStep > index
                ? 'bg-green-600'
                : currentStep === index
                ? 'bg-blue-600'
                : 'bg-gray-400'
            ]"
          >
            <span v-if="currentStep > index">✔</span>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <span class="text-sm mt-2">{{ label }}</span>
          <div
            v-if="index < steps.length - 1"
            class="absolute top-5 left-1/2 w-full h-0.5 bg-gray-300 z-[-1]"
          ></div>
        </div>
      </div>

      <!-- STEP 1 - INFORMAÇÕES -->
      <div v-if="currentStep === 0" class="grid grid-cols-2 gap-4">
        <div>
          <Label>Equipamento</Label>
          <Input v-model="form.equipamento" placeholder="Ex: Compressor ABC" />
        </div>
        <div>
          <Label>Responsável</Label>
          <Input v-model="form.responsavel" placeholder="Nome do responsável" />
        </div>
        <div>
          <Label>Data de Início</Label>
          <Input type="date" v-model="form.dataInicio" />
        </div>
        <div>
          <Label>Template</Label>
          <Select v-model="selectedTemplate">
            <SelectTrigger>
              <SelectValue placeholder="Selecione um template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="(t, i) in templates" :key="i" :value="t.name">
                {{ t.name }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="col-span-2 text-right mt-4">
          <Button @click="nextStep" :disabled="!canNextStep">Próximo</Button>
        </div>
      </div>

      <!-- STEP 2 - CHECKLIST -->
      <div
        v-if="currentStep === 1"
        class="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-auto pr-2"
      >
        <div
          v-for="(item, index) in selectedItems"
          :key="index"
          class="p-3 border rounded-lg hover:shadow transition"
          :class="{
            'border-green-600 bg-green-50': item.status === 'ok',
            'border-blue-600 bg-blue-50': item.status === 'bom',
            'border-yellow-500 bg-yellow-50': item.status === 'atencao',
            'border-red-600 bg-red-50': item.status === 'defeito'
          }"
        >
          <div class="flex justify-between mb-2">
            <span class="font-medium">{{ item.nome }}</span>
          </div>
          <RadioGroup v-model="item.status" class="flex gap-2 flex-wrap">
            <div v-for="opt in options" :key="opt.value" class="flex items-center gap-1">
              <RadioGroupItem :value="opt.value" :id="`${index}-${opt.value}`" />
              <Label :for="`${index}-${opt.value}`">{{ opt.label }}</Label>
            </div>
          </RadioGroup>
          <Textarea
            v-model="item.observacao"
            placeholder="Observações..."
            class="mt-2 text-sm"
          />
        </div>

        <div class="col-span-1 sm:col-span-2 flex justify-between mt-4">
          <Button variant="secondary" @click="prevStep">Voltar</Button>
          <Button @click="nextStep">Próximo</Button>
        </div>
      </div>

      <!-- STEP 3 - RESUMO -->
      <div v-if="currentStep === 2" class="space-y-6">
        <div class="bg-gray-50 p-4 rounded-lg border">
          <p><strong>Equipamento:</strong> {{ form.equipamento }}</p>
          <p><strong>Responsável:</strong> {{ form.responsavel }}</p>
          <p><strong>Data de Início:</strong> {{ form.dataInicio }}</p>
          <p><strong>Template:</strong> {{ selectedTemplate }}</p>
        </div>

        <div
          v-for="(item, index) in criticalItems"
          :key="index"
          class="border p-4 rounded-lg bg-red-50"
        >
          <p><strong>{{ item.nome }}</strong> — <span class="uppercase">{{ item.status }}</span></p>
          <p class="text-sm text-gray-700 italic">{{ item.observacao || 'Sem observações' }}</p>
        </div>

        <div class="flex justify-between">
          <Button variant="secondary" @click="prevStep">Voltar</Button>
          <Button @click="finalizar">Finalizar</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ref, computed } from "vue"

const open = ref(false)
const currentStep = ref(0)
const steps = ["Informações Iniciais", "Checklist", "Resumo"]

const form = ref({
  equipamento: "",
  responsavel: "",
  dataInicio: "",
})

const options = [
  { label: "OK", value: "ok" },
  { label: "Bom", value: "bom" },
  { label: "Atenção", value: "atencao" },
  { label: "Defeito", value: "defeito" },
]

const templates = ref([
  {
    name: "Compressor",
    items: [
      { nome: "Pressão de saída", status: null, observacao: "" },
      { nome: "Filtro de ar", status: null, observacao: "" },
      { nome: "Nível de óleo", status: null, observacao: "" },
      { nome: "Vedação", status: null, observacao: "" },
      { nome: "Vazamento de ar", status: null, observacao: "" },
    ],
  },
  {
    name: "Gerador",
    items: [
      { nome: "Tensão de saída", status: null, observacao: "" },
      { nome: "Frequência", status: null, observacao: "" },
      { nome: "Nível de combustível", status: null, observacao: "" },
      { nome: "Sistema de refrigeração", status: null, observacao: "" },
      { nome: "Bateria", status: null, observacao: "" },
    ],
  },
])

const selectedTemplate = ref<string | null>(null)
const selectedItems = computed(() => {
  return templates.value.find((t) => t.name === selectedTemplate.value)?.items || []
})

const criticalItems = computed(() =>
  selectedItems.value.filter((i) => i.status === "atencao" || i.status === "defeito")
)

const canNextStep = computed(() => {
  return form.value.equipamento && form.value.responsavel && form.value.dataInicio && selectedTemplate.value
})

function nextStep() {
  if (currentStep.value < steps.length - 1) currentStep.value++
}
function prevStep() {
  if (currentStep.value > 0) currentStep.value--
}

function finalizar() {
  const data = {
    ...form.value,
    template: selectedTemplate.value,
    checklist: selectedItems.value,
  }
  console.log("✅ Checklist finalizado", data)
  // Aqui você pode fazer POST via axios
  open.value = false
  currentStep.value = 0
  selectedTemplate.value = null
}
</script>
