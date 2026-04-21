<template>
  <div class="container mx-auto space-y-6">
    <div class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <MessageCircle class="h-6 w-6" :stroke-width="2.5" />
          WhatsApp
        </h1>
        <p class="text-sm text-muted-foreground">
          Configure as credenciais operacionais do app WhatsApp desta conta.
        </p>
      </div>
    </div>

    <Card class="bg-background">
      <form @submit.prevent="submit">
        <CardHeader>
          <CardTitle class="font-normal">Credenciais do app</CardTitle>
          <CardDescription>
            Esses dados ficam vinculados à conta atual e são usados pelos fluxos do app WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2 md:col-span-2">
              <Label for="whatsapp-token">Token da API</Label>
              <Input
                id="whatsapp-token"
                v-model="form.WhatsappAPIToken"
                type="password"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="Seu token de integração"
              />
            </div>

            <div class="space-y-2">
              <Label for="whatsapp-session">Sessão</Label>
              <Input
                id="whatsapp-session"
                v-model="form.WhatsappAPISession"
                type="text"
                autocomplete="off"
                autocapitalize="off"
                spellcheck="false"
                placeholder="Nome ou id da sessão"
              />
            </div>

            <div class="space-y-2">
              <Label for="whatsapp-number">Número</Label>
              <Input
                id="whatsapp-number"
                v-model="form.WhatsappAPINumber"
                type="text"
                inputmode="numeric"
                placeholder="5599999999999"
              />
            </div>
          </div>

          <div class="rounded-lg border bg-body/50 p-4 text-sm text-muted-foreground">
            Use esse app quando a conta precisar de uma entrada dedicada para configurações e operação do canal WhatsApp.
          </div>
        </CardContent>
        <CardFooter class="justify-end">
          <Button :disabled="loading" class="text-white" type="submit">
            <LoaderIcon v-if="loading" class="mr-2 animate-spin" />
            {{ loading ? 'Salvando...' : 'Salvar configurações' }}
          </Button>
        </CardFooter>
      </form>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { MessageCircle, LoaderIcon } from 'lucide-vue-next'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContaRepository } from '@/repositories/conta-repository'

const toast = useToast()
const loading = ref(false)
const form = reactive({
  WhatsappAPIToken: '',
  WhatsappAPISession: '',
  WhatsappAPINumber: '',
})

async function loadParametros() {
  try {
    loading.value = true
    const response = await ContaRepository.getParametros()
    Object.assign(form, {
      WhatsappAPIToken: response.data?.WhatsappAPIToken || '',
      WhatsappAPISession: response.data?.WhatsappAPISession || '',
      WhatsappAPINumber: response.data?.WhatsappAPINumber || '',
    })
  } catch (error) {
    console.error(error)
    toast.error('Erro ao carregar as configurações do WhatsApp.')
  } finally {
    loading.value = false
  }
}

async function submit() {
  try {
    loading.value = true
    await ContaRepository.parametros({
      WhatsappAPIToken: form.WhatsappAPIToken || null,
      WhatsappAPISession: form.WhatsappAPISession || null,
      WhatsappAPINumber: form.WhatsappAPINumber || null,
    })
    toast.success('Configurações do WhatsApp salvas com sucesso.')
  } catch (error) {
    console.error(error)
    toast.error('Erro ao salvar as configurações do WhatsApp.')
  } finally {
    loading.value = false
  }
}

onMounted(loadParametros)
</script>
