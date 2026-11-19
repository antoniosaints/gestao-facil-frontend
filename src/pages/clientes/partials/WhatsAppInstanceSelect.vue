<script setup lang="ts">
import { computed, useId } from 'vue'
import { RouterLink } from 'vue-router'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RefreshCw, Smartphone } from 'lucide-vue-next'

interface SenderInstance { id: number; nome: string; status: string; numeroConectado?: string | null }
const selected = defineModel<number | null>({ required: true })
const props = defineProps<{ instances: SenderInstance[]; moduleActive: boolean; loading?: boolean; disabled?: boolean }>()
defineEmits<{ refresh: [] }>()
const id = `whatsapp-sender-${useId()}`
const connected = computed(() => props.instances.filter(instance => instance.status === 'CONECTADA'))
</script>

<template>
  <section class="space-y-3 rounded-lg border bg-muted/20 p-4">
    <div class="flex items-center justify-between gap-2">
      <Label :for="id" class="flex items-center gap-2"><Smartphone class="h-4 w-4" />Instância de envio</Label>
      <Button v-if="moduleActive" type="button" variant="ghost" size="sm" :disabled="loading || disabled" aria-label="Atualizar instâncias de envio" @click="$emit('refresh')">
        <RefreshCw class="mr-1.5 h-3.5 w-3.5" :class="loading ? 'animate-spin' : ''" />Atualizar
      </Button>
    </div>
    <template v-if="moduleActive">
      <select :id="id" v-model="selected" :disabled="loading || disabled || !connected.length" :aria-describedby="`${id}-help`" class="h-11 w-full min-w-0 rounded-md border bg-background px-3 text-sm">
        <option :value="null">{{ loading ? 'Carregando instâncias…' : 'Selecione a instância para enviar' }}</option>
        <option v-for="instance in instances" :key="instance.id" :value="instance.id" :disabled="instance.status !== 'CONECTADA'">
          {{ instance.nome }}{{ instance.numeroConectado ? ` · ${instance.numeroConectado}` : '' }}{{ instance.status !== 'CONECTADA' ? ' · Desconectada' : '' }}
        </option>
      </select>
      <p :id="`${id}-help`" class="text-xs text-muted-foreground">
        {{ connected.length ? 'Este envio usa a instância selecionada, sem alterar a instância principal das notificações.' : 'Nenhuma instância conectada disponível. Conecte uma instância antes de enviar.' }}
      </p>
      <Button v-if="!loading && !connected.length" type="button" variant="outline" as-child><RouterLink to="/whatsapp">Gerenciar instâncias</RouterLink></Button>
    </template>
    <template v-else>
      <p class="text-sm text-muted-foreground">Ative o app WhatsApp para enviar mensagens por aqui.</p>
      <Button type="button" as-child class="text-white"><RouterLink :to="{ name: 'loja-home', query: { app: 'whatsapp' } }">Ativar app WhatsApp</RouterLink></Button>
    </template>
  </section>
</template>
