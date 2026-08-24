<template>
  <section class="space-y-6">
    <div class="mb-4 flex flex-col justify-between gap-2 md:flex-row">
      <div>
        <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Cog class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />Configurações
        </h2>
        <p class="text-sm text-muted-foreground">
          Defina as contas, categorias e regras financeiras usadas no módulo.
        </p>
      </div>
    </div>
    <Card
      ><CardHeader
        ><CardTitle>Financeiro automático</CardTitle
        ><CardDescription
          >A seleção usa os cadastros financeiros da conta, sem digitação de IDs.</CardDescription
        ></CardHeader
      ><CardContent class="grid gap-5 md:grid-cols-2"
        ><label class="grid gap-2 text-sm font-medium"
          >Categoria da receita
          <Select2Ajax
            v-model="form.receitaCategoriaId"
            url="/lancamentos/categorias/select2"
            placeholder="Selecione a categoria" /></label
        ><label class="grid gap-2 text-sm font-medium"
          >Conta da receita
          <Select2Ajax
            v-model="form.receitaContaFinanceiraId"
            url="/lancamentos/contas/select2"
            placeholder="Selecione a conta" /></label
        ><label class="grid gap-2 text-sm font-medium"
          >Categoria dos pagamentos aos ourives
          <Select2Ajax
            v-model="form.comissaoCategoriaId"
            url="/lancamentos/categorias/select2"
            placeholder="Selecione a categoria" /></label
        ><label class="grid gap-2 text-sm font-medium"
          >Conta dos pagamentos aos ourives
          <Select2Ajax
            v-model="form.comissaoContaFinanceiraId"
            url="/lancamentos/contas/select2"
            placeholder="Selecione a conta" /></label
        ><label class="grid gap-2 text-sm font-medium"
          >Categoria do pró-labore
          <Select2Ajax
            v-model="form.proLaboreCategoriaId"
            url="/lancamentos/categorias/select2"
            placeholder="Selecione a categoria" /></label
        ><label class="grid gap-2 text-sm font-medium"
          >Conta do pró-labore
          <Select2Ajax
            v-model="form.proLaboreContaFinanceiraId"
            url="/lancamentos/contas/select2"
            placeholder="Selecione a conta" /></label
        ><label class="grid gap-2 text-sm font-medium"
          >Validade do orçamento (dias)<Input
            v-model.number="form.prazoAprovacaoDias"
            type="number"
            min="1"
            max="30"
            placeholder="Ex.: 7"
        /></label>
        <div class="flex items-end">
          <Button :disabled="saving" @click="save">Salvar configurações</Button>
        </div></CardContent
      ></Card
    >
    <Card>
      <CardHeader>
        <CardTitle>Divisão e produção</CardTitle>
        <CardDescription>
          Os percentuais são copiados para a OS quando o financeiro é consolidado, preservando seu
          histórico.
        </CardDescription>
      </CardHeader>
      <CardContent class="grid gap-5 md:grid-cols-3">
        <label class="grid gap-2 text-sm font-medium"
          >Percentual da loja
          <Input
            v-model.number="form.percentualLoja"
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="Ex.: 50"
          />
        </label>
        <label class="grid gap-2 text-sm font-medium"
          >Percentual do ourives
          <Input
            v-model.number="form.percentualOurives"
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="Ex.: 50"
          />
        </label>
        <label class="grid gap-2 text-sm font-medium"
          >Perda padrão estimada
          <Input
            v-model.number="form.percentualPerdaPadrao"
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="Ex.: 10"
          />
        </label>
        <p
          class="text-sm md:col-span-3"
          :class="percentualValido ? 'text-muted-foreground' : 'text-destructive'"
        >
          Divisão atual:
          {{ percentualTotal.toLocaleString('pt-BR', { maximumFractionDigits: 2 }) }}% de 100%.
        </p>
        <div class="md:col-span-3">
          <Button :disabled="saving || !percentualValido" @click="save"
            >Salvar regras financeiras</Button
          >
        </div>
      </CardContent>
    </Card>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Cog } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { OuriveRepository } from '@/repositories/ourive-repository'
const toast = useToast()
const saving = ref(false)
const form = ref<any>({
  prazoAprovacaoDias: 7,
  receitaCategoriaId: null,
  receitaContaFinanceiraId: null,
  comissaoCategoriaId: null,
  comissaoContaFinanceiraId: null,
  proLaboreCategoriaId: null,
  proLaboreContaFinanceiraId: null,
  percentualLoja: 50,
  percentualOurives: 50,
  percentualPerdaPadrao: 10,
})
const percentualTotal = computed(
  () => Number(form.value.percentualLoja || 0) + Number(form.value.percentualOurives || 0),
)
const percentualValido = computed(() => Math.abs(percentualTotal.value - 100) < 0.000_001)
async function load() {
  try {
    form.value = await OuriveRepository.configuracao()
  } catch {
    toast.error('Não foi possível carregar as configurações.')
  }
}
async function save() {
  saving.value = true
  try {
    await OuriveRepository.salvarConfiguracao(form.value)
    toast.success('Configurações salvas.')
  } catch (error: any) {
    toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar.')
  } finally {
    saving.value = false
  }
}
onMounted(load)
</script>
