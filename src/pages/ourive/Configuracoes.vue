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
        ><div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <CardTitle>Financeiro automático</CardTitle
            ><CardDescription
              >A seleção usa os cadastros financeiros da conta, sem digitação de
              IDs.</CardDescription
            >
          </div>
          <div class="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" @click="openQuick('categoria')"
              ><FolderPlus class="mr-2 h-4 w-4" />Nova categoria</Button
            ><Button type="button" variant="outline" size="sm" @click="openQuick('conta')"
              ><WalletCards class="mr-2 h-4 w-4" />Nova conta</Button
            >
          </div>
        </div></CardHeader
      ><CardContent class="grid gap-5 md:grid-cols-2"
        ><label class="grid gap-2 text-sm font-medium"
          >Categoria da receita
          <div class="flex gap-2">
            <Select2Ajax
              v-model="form.receitaCategoriaId"
              class="flex-1"
              url="/lancamentos/categorias/select2"
              placeholder="Selecione a categoria"
            /><Button
              type="button"
              variant="outline"
              size="icon"
              title="Criar categoria"
              aria-label="Criar categoria para receita"
              @click="openQuick('categoria', 'receitaCategoriaId')"
              ><Plus class="h-4 w-4"
            /></Button></div></label
        ><label class="grid gap-2 text-sm font-medium"
          >Conta da receita
          <div class="flex gap-2">
            <Select2Ajax
              v-model="form.receitaContaFinanceiraId"
              class="flex-1"
              url="/lancamentos/contas/select2"
              placeholder="Selecione a conta"
            /><Button
              type="button"
              variant="outline"
              size="icon"
              title="Criar conta"
              aria-label="Criar conta para receita"
              @click="openQuick('conta', 'receitaContaFinanceiraId')"
              ><Plus class="h-4 w-4"
            /></Button></div></label
        ><label class="grid gap-2 text-sm font-medium"
          >Categoria dos pagamentos aos ourives
          <div class="flex gap-2">
            <Select2Ajax
              v-model="form.comissaoCategoriaId"
              class="flex-1"
              url="/lancamentos/categorias/select2"
              placeholder="Selecione a categoria"
            /><Button
              type="button"
              variant="outline"
              size="icon"
              title="Criar categoria"
              aria-label="Criar categoria para pagamentos aos ourives"
              @click="openQuick('categoria', 'comissaoCategoriaId')"
              ><Plus class="h-4 w-4"
            /></Button></div></label
        ><label class="grid gap-2 text-sm font-medium"
          >Conta dos pagamentos aos ourives
          <div class="flex gap-2">
            <Select2Ajax
              v-model="form.comissaoContaFinanceiraId"
              class="flex-1"
              url="/lancamentos/contas/select2"
              placeholder="Selecione a conta"
            /><Button
              type="button"
              variant="outline"
              size="icon"
              title="Criar conta"
              aria-label="Criar conta para pagamentos aos ourives"
              @click="openQuick('conta', 'comissaoContaFinanceiraId')"
              ><Plus class="h-4 w-4"
            /></Button></div></label
        ><label class="grid gap-2 text-sm font-medium"
          >Categoria do pró-labore
          <div class="flex gap-2">
            <Select2Ajax
              v-model="form.proLaboreCategoriaId"
              class="flex-1"
              url="/lancamentos/categorias/select2"
              placeholder="Selecione a categoria"
            /><Button
              type="button"
              variant="outline"
              size="icon"
              title="Criar categoria"
              aria-label="Criar categoria para pró-labore"
              @click="openQuick('categoria', 'proLaboreCategoriaId')"
              ><Plus class="h-4 w-4"
            /></Button></div></label
        ><label class="grid gap-2 text-sm font-medium"
          >Conta do pró-labore
          <div class="flex gap-2">
            <Select2Ajax
              v-model="form.proLaboreContaFinanceiraId"
              class="flex-1"
              url="/lancamentos/contas/select2"
              placeholder="Selecione a conta"
            /><Button
              type="button"
              variant="outline"
              size="icon"
              title="Criar conta"
              aria-label="Criar conta para pró-labore"
              @click="openQuick('conta', 'proLaboreContaFinanceiraId')"
              ><Plus class="h-4 w-4"
            /></Button></div></label
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
            :iconLabel="Percent"
            icon-label-title="Porcentagem"
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
            :iconLabel="Percent"
            icon-label-title="Porcentagem"
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
            :iconLabel="Percent"
            icon-label-title="Porcentagem"
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
    <Dialog v-model:open="quickModalOpen">
      <DialogContent class="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{{
            quickKind === 'categoria' ? 'Nova categoria financeira' : 'Nova conta financeira'
          }}</DialogTitle>
          <DialogDescription>
            {{
              quickKind === 'categoria'
                ? 'Crie uma categoria sem sair das configurações do ourive.'
                : 'Crie uma conta financeira sem sair das configurações do ourive.'
            }}
          </DialogDescription>
        </DialogHeader>
        <div v-if="quickKind === 'categoria'" class="grid gap-4 py-2">
          <label class="grid gap-1 text-sm font-medium"
            >Nome da categoria
            <Input v-model="quickCategory.nome" placeholder="Ex.: Receita de ourivesaria" />
          </label>
          <label class="grid gap-1 text-sm font-medium"
            >Categoria pai <span class="font-normal text-muted-foreground">(opcional)</span>
            <Select2Ajax
              v-model="quickCategory.categoriaPai"
              url="/lancamentos/categorias/select2"
              allow-clear
              placeholder="Sem categoria pai"
            />
          </label>
        </div>
        <div v-else class="grid gap-4 py-2">
          <label class="grid gap-1 text-sm font-medium"
            >Nome da conta
            <Input v-model="quickAccount.nome" placeholder="Ex.: Conta Ourive" />
          </label>
          <label class="grid gap-1 text-sm font-medium"
            >Saldo inicial <span class="font-normal text-muted-foreground">(opcional)</span>
            <Input
              v-model="quickAccount.saldoInicial"
              v-maska="moneyMaskOptions"
              type="text"
              inputmode="decimal"
              placeholder="0,00"
            />
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="quickModalOpen = false">Cancelar</Button>
          <Button type="button" :disabled="quickSaving" @click="saveQuick">
            {{
              quickSaving
                ? 'Salvando…'
                : quickKind === 'categoria'
                  ? 'Salvar categoria'
                  : 'Salvar conta'
            }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </section>
</template>
<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Cog, FolderPlus, Percent, Plus, WalletCards } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { OuriveRepository } from '@/repositories/ourive-repository'
import { LancamentosRepository } from '@/repositories/lancamento-repository'
import { moneyMaskOptions } from '@/lib/imaska'
import { formatToNumberValue } from '@/utils/formatters'
import { vMaska } from 'maska/vue'
const toast = useToast()
const saving = ref(false)
const quickModalOpen = ref(false)
const quickSaving = ref(false)
const quickKind = ref<'categoria' | 'conta'>('categoria')
const quickTarget = ref<string | null>(null)
const quickCategory = reactive({ nome: '', categoriaPai: null as number | string | null })
const quickAccount = reactive({ nome: '', saldoInicial: '' })
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
function openQuick(kind: 'categoria' | 'conta', target?: string) {
  quickKind.value = kind
  quickTarget.value = target || null
  quickCategory.nome = ''
  quickCategory.categoriaPai = null
  quickAccount.nome = ''
  quickAccount.saldoInicial = ''
  quickModalOpen.value = true
}
async function saveQuick() {
  const nome =
    quickKind.value === 'categoria' ? quickCategory.nome.trim() : quickAccount.nome.trim()
  if (!nome)
    return toast.info(
      `Informe o nome da ${quickKind.value === 'categoria' ? 'categoria' : 'conta'}.`,
    )
  quickSaving.value = true
  try {
    const response =
      quickKind.value === 'categoria'
        ? await LancamentosRepository.criarCategoria({
            nome,
            categoriaPai: quickCategory.categoriaPai ? Number(quickCategory.categoriaPai) : null,
          })
        : await LancamentosRepository.criarConta({
            nome,
            saldoInicial: formatToNumberValue(quickAccount.saldoInicial || 0),
          })
    const createdId = Number(response?.data?.id)
    if (!createdId) throw new Error('created_item_missing')
    if (quickTarget.value) form.value[quickTarget.value] = createdId
    quickModalOpen.value = false
    toast.success(
      `${quickKind.value === 'categoria' ? 'Categoria' : 'Conta'} criada${quickTarget.value ? ' e selecionada' : ''}.`,
    )
  } catch (error: any) {
    toast.error(error?.response?.data?.message || `Não foi possível criar a ${quickKind.value}.`)
  } finally {
    quickSaving.value = false
  }
}
onMounted(load)
</script>
