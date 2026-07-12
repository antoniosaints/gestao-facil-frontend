<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { CheckCircle2, Cog, LoaderCircle, ShieldAlert } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  ContaRepository,
  type AdminIndicacaoConfig,
  type AdminModuloItem,
} from '@/repositories/conta-repository'

const toast = useToast()
const loading = ref(false)
const gateway = ref<'mercadopago' | 'abacatepay'>('mercadopago')
const mercadoPagoConfigured = ref(false)
const abacatePayConfigured = ref(false)
const updatedAccounts = ref<number | null>(null)

// Preços globais dos apps
const modulos = ref<AdminModuloItem[]>([])
const modulosLoading = ref(false)
const moduloSavingId = ref<number | null>(null)

async function loadModulos() {
  try {
    modulosLoading.value = true
    const response = await ContaRepository.listarModulosAdmin()
    modulos.value = response.data || []
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar os apps')
  } finally {
    modulosLoading.value = false
  }
}

async function salvarModulo(modulo: AdminModuloItem) {
  const preco = Number(modulo.preco)
  const desconto = Number(modulo.desconto)
  if (!Number.isFinite(preco) || preco < 0) {
    toast.error('Informe um preço válido para o app.')
    return
  }
  try {
    moduloSavingId.value = modulo.id
    const response = await ContaRepository.atualizarModuloAdmin(modulo.id, {
      preco,
      desconto: Number.isFinite(desconto) && desconto >= 0 ? desconto : 0,
      status: modulo.status,
    })
    toast.success(response.message || 'App atualizado')
    // Recarrega do servidor para refletir exatamente o valor persistido
    // (evita a sensação de "salvei mas não mudou" por estado local desatualizado).
    await loadModulos()
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao salvar o app')
  } finally {
    moduloSavingId.value = null
  }
}

// Programa de indicação
const indicacaoLoading = ref(false)
const indicacaoSaving = ref(false)
const indicacao = ref<AdminIndicacaoConfig>({
  ativa: false,
  tipoRecompensa: 'PERCENTUAL',
  valorRecompensa: 0,
  tipoBonusIndicado: 'PERCENTUAL',
  valorBonusIndicado: 0,
})

async function loadIndicacao() {
  try {
    indicacaoLoading.value = true
    const response = await ContaRepository.getAdminIndicacaoConfig()
    indicacao.value = response.data
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar o programa de indicação')
  } finally {
    indicacaoLoading.value = false
  }
}

async function salvarIndicacao() {
  try {
    indicacaoSaving.value = true
    await ContaRepository.saveAdminIndicacaoConfig({
      ativa: indicacao.value.ativa,
      tipoRecompensa: indicacao.value.tipoRecompensa,
      valorRecompensa: Number(indicacao.value.valorRecompensa || 0),
      tipoBonusIndicado: indicacao.value.tipoBonusIndicado,
      valorBonusIndicado: Number(indicacao.value.valorBonusIndicado || 0),
    })
    toast.success('Programa de indicação atualizado com sucesso')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao salvar o programa de indicação')
  } finally {
    indicacaoSaving.value = false
  }
}

async function loadConfig() {
  try {
    loading.value = true
    const response = await ContaRepository.getAdminGatewayConfig()
    gateway.value = response.data.gateway
    mercadoPagoConfigured.value = response.data.mercadoPagoConfigured
    abacatePayConfigured.value = response.data.abacatePayConfigured
    updatedAccounts.value = response.data.updatedAccounts ?? null
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar a configuração global do gateway')
  } finally {
    loading.value = false
  }
}

async function saveConfig() {
  try {
    loading.value = true
    const response = await ContaRepository.saveAdminGatewayConfig({
      gateway: gateway.value,
    })

    mercadoPagoConfigured.value = response.data.mercadoPagoConfigured
    abacatePayConfigured.value = response.data.abacatePayConfigured
    updatedAccounts.value = response.data.updatedAccounts ?? null

    toast.success('Gateway padrão da mensalidade atualizado com sucesso')
  } catch (error: any) {
    console.error(error)
    toast.error(error?.response?.data?.message || 'Erro ao salvar o gateway global')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadConfig()
  loadModulos()
  loadIndicacao()
})
</script>

<template>
  <div class="space-y-4">
    <div>
      <h2 class="flex items-center gap-2 text-2xl font-bold text-foreground">
        <Cog class="h-6 w-6 text-primary dark:text-white" :stroke-width="2.5" />
        Configurações da plataforma
      </h2>
      <p class="text-sm text-muted-foreground">
        Controle global do gateway usado para cobrar a mensalidade SaaS dos assinantes.
      </p>
    </div>

    <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
      <CardHeader>
        <CardTitle class="text-base font-semibold">Gateway padrão da mensalidade</CardTitle>
        <CardDescription>
          Esta configuração sincroniza o campo <code>Contas.gateway</code> das contas existentes e também define o gateway padrão dos próximos cadastros.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
          <div class="space-y-2">
            <Label for="gateway-plataforma">Gateway</Label>
            <Select v-model="gateway">
              <SelectTrigger id="gateway-plataforma" class="w-full bg-background/80">
                <SelectValue placeholder="Selecione o gateway" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                <SelectItem value="abacatepay">AbacatePay</SelectItem>
              </SelectContent>
            </Select>
            <p class="text-xs text-muted-foreground">
              Mercado Pago mantém o fluxo atual. AbacatePay usa checkout hospedado com PIX e cartão para a renovação do SaaS.
            </p>
          </div>

          <div class="rounded-xl border border-border/70 bg-background/70 p-4">
            <div class="text-sm font-medium text-foreground">Estado das credenciais</div>
            <div class="mt-3 space-y-2 text-sm">
              <div class="flex items-center justify-between gap-3">
                <span>Mercado Pago</span>
                <span class="flex items-center gap-2" :class="mercadoPagoConfigured ? 'text-green-600' : 'text-amber-600'">
                  <CheckCircle2 v-if="mercadoPagoConfigured" class="h-4 w-4" />
                  <ShieldAlert v-else class="h-4 w-4" />
                  {{ mercadoPagoConfigured ? 'Configurado' : 'Pendente' }}
                </span>
              </div>
              <div class="flex items-center justify-between gap-3">
                <span>AbacatePay</span>
                <span class="flex items-center gap-2" :class="abacatePayConfigured ? 'text-green-600' : 'text-amber-600'">
                  <CheckCircle2 v-if="abacatePayConfigured" class="h-4 w-4" />
                  <ShieldAlert v-else class="h-4 w-4" />
                  {{ abacatePayConfigured ? 'Configurado' : 'Pendente' }}
                </span>
              </div>
            </div>
            <p class="mt-3 text-xs text-muted-foreground">
              As credenciais da AbacatePay ficam no ambiente do backend. Esta tela não armazena API keys por conta.
            </p>
          </div>
        </div>

        <Separator />

        <div class="rounded-xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground">
          <p>
            Ao salvar, o sistema atualiza todas as contas para o gateway selecionado. As próximas cobranças de mensalidade passarão a usar esse valor.
          </p>
          <p v-if="updatedAccounts !== null" class="mt-2 text-foreground">
            Última sincronização: {{ updatedAccounts }} conta(s) afetada(s).
          </p>
        </div>
      </CardContent>
      <CardFooter class="justify-end">
        <Button class="text-white" :disabled="loading" @click="saveConfig">
          <LoaderCircle v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
          {{ loading ? 'Salvando...' : 'Salvar gateway global' }}
        </Button>
      </CardFooter>
    </Card>

    <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
      <CardHeader>
        <CardTitle class="text-base font-semibold">Preços dos apps (global)</CardTitle>
        <CardDescription>
          Define o valor mensal de cada app. Ao salvar, o novo preço é aplicado a todas as contas que usam o app e a mensalidade é recalculada.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <div v-if="modulosLoading" class="flex items-center justify-center rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
          <LoaderCircle class="mr-2 h-4 w-4 animate-spin" /> Carregando apps...
        </div>
        <div v-else-if="!modulos.length" class="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          Nenhum app cadastrado.
        </div>
        <div v-else class="grid gap-3 md:grid-cols-2">
          <div v-for="modulo in modulos" :key="modulo.id" class="rounded-xl border border-border/70 bg-background/70 p-4">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-sm font-medium text-foreground">{{ modulo.nome }}</div>
                <div class="text-xs text-muted-foreground">{{ modulo.categoria }} • {{ modulo.contasAtivas }} conta(s) ativa(s)</div>
              </div>
              <Switch :model-value="modulo.status" @update:model-value="(v) => (modulo.status = Boolean(v))" />
            </div>
            <div class="mt-3 grid grid-cols-2 gap-2">
              <div class="space-y-1">
                <Label class="text-xs">Preço (R$)</Label>
                <Input :model-value="modulo.preco" type="number" min="0" step="0.01"
                  @update:model-value="(v) => (modulo.preco = v === '' || v === null ? 0 : Number(v))" />
              </div>
              <div class="space-y-1">
                <Label class="text-xs">Desconto (R$)</Label>
                <Input :model-value="modulo.desconto" type="number" min="0" step="0.01"
                  @update:model-value="(v) => (modulo.desconto = v === '' || v === null ? 0 : Number(v))" />
              </div>
            </div>
            <div class="mt-3 flex justify-end">
              <Button size="sm" variant="outline" :disabled="moduloSavingId === modulo.id" @click="salvarModulo(modulo)">
                <LoaderCircle v-if="moduloSavingId === modulo.id" class="mr-2 h-4 w-4 animate-spin" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card class="border-border/70 bg-card shadow-sm dark:bg-card">
      <CardHeader>
        <CardTitle class="text-base font-semibold">Programa de indicação</CardTitle>
        <CardDescription>
          Quando um indicado paga o 1º mês, o indicador ganha a recompensa como crédito que abate da própria mensalidade. O indicado também pode ganhar um bônus no 1º mês.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-5">
        <div class="flex items-center justify-between rounded-lg border border-border/70 bg-background/70 p-3">
          <div>
            <div class="text-sm font-medium text-foreground">Ativar programa de indicação</div>
            <div class="text-xs text-muted-foreground">Desligado, novas indicações não geram recompensa.</div>
          </div>
          <Switch :model-value="indicacao.ativa" @update:model-value="(v) => (indicacao.ativa = Boolean(v))" />
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <div class="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
            <div class="text-sm font-medium text-foreground">Recompensa do indicador</div>
            <div class="space-y-1">
              <Label class="text-xs">Tipo</Label>
              <Select v-model="indicacao.tipoRecompensa">
                <SelectTrigger class="w-full bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTUAL">Percentual (% do valor pago)</SelectItem>
                  <SelectItem value="VALOR">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1">
              <Label class="text-xs">{{ indicacao.tipoRecompensa === 'PERCENTUAL' ? 'Percentual (%)' : 'Valor (R$)' }}</Label>
              <Input v-model.number="indicacao.valorRecompensa" type="number" min="0" step="0.01" />
            </div>
          </div>

          <div class="space-y-3 rounded-xl border border-border/70 bg-background/70 p-4">
            <div class="text-sm font-medium text-foreground">Bônus do indicado (1º mês)</div>
            <div class="space-y-1">
              <Label class="text-xs">Tipo</Label>
              <Select v-model="indicacao.tipoBonusIndicado">
                <SelectTrigger class="w-full bg-background/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTUAL">Percentual (% da mensalidade)</SelectItem>
                  <SelectItem value="VALOR">Valor fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-1">
              <Label class="text-xs">{{ indicacao.tipoBonusIndicado === 'PERCENTUAL' ? 'Percentual (%)' : 'Valor (R$)' }}</Label>
              <Input v-model.number="indicacao.valorBonusIndicado" type="number" min="0" step="0.01" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter class="justify-end">
        <Button class="text-white" :disabled="indicacaoSaving || indicacaoLoading" @click="salvarIndicacao">
          <LoaderCircle v-if="indicacaoSaving" class="mr-2 h-4 w-4 animate-spin" />
          {{ indicacaoSaving ? 'Salvando...' : 'Salvar programa de indicação' }}
        </Button>
      </CardFooter>
    </Card>
  </div>
</template>
