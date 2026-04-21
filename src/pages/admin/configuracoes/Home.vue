<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { CheckCircle2, Cog, LoaderCircle, ShieldAlert } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ContaRepository } from '@/repositories/conta-repository'

const toast = useToast()
const loading = ref(false)
const gateway = ref<'mercadopago' | 'abacatepay'>('mercadopago')
const mercadoPagoConfigured = ref(false)
const abacatePayConfigured = ref(false)
const updatedAccounts = ref<number | null>(null)

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

onMounted(loadConfig)
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
  </div>
</template>
