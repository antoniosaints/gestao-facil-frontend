<script setup lang="ts">
import { ref, watch } from 'vue'
import { Info, Settings2 } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { InadimplenciaRepository } from '@/repositories/inadimplencia-repository'
import DiasLembreteEditor from './DiasLembreteEditor.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'salvo'): void
}>()

const toast = useToast()

const loading = ref(false)
const saving = ref(false)
const horaEnvio = ref('10')
const dias = ref<number[]>([-3, -1, 0, 1])
const mensagem = ref('')

const horas = Array.from({ length: 24 }, (_, h) => h)

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    try {
      loading.value = true
      const config = await InadimplenciaRepository.getConfig()
      horaEnvio.value = String(config.horaEnvio)
      dias.value = config.dias?.length ? [...config.dias] : [-3, -1, 0, 1]
      mensagem.value = config.mensagem || ''
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Erro ao carregar as configurações.')
    } finally {
      loading.value = false
    }
  },
)

async function salvar() {
  try {
    saving.value = true
    await InadimplenciaRepository.salvarConfig({
      horaEnvio: Number(horaEnvio.value),
      dias: dias.value,
      mensagem: mensagem.value.trim() || null,
    })
    toast.success('Configurações padrão salvas.')
    emit('salvo')
    emit('update:open', false)
  } catch (error: any) {
    toast.error(error?.response?.data?.message || 'Não foi possível salvar.')
  } finally {
    saving.value = false
  }
}

function pad(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}
</script>

<template>
  <ModalView
    :open="open"
    :icon="Settings2"
    title="Configurações padrão de lembretes"
    description="Valores padrão do sistema para os lembretes de cobrança ao cliente."
    size="2xl"
    @update:open="emit('update:open', $event)"
  >
    <div class="space-y-5 px-4">
      <!-- Horário de envio -->
      <div>
        <Label class="mb-1 block text-sm font-semibold">Horário de envio</Label>
        <p class="mb-2 text-xs text-muted-foreground">
          Hora em que os lembretes ao cliente são disparados diariamente.
        </p>
        <Select v-model="horaEnvio">
          <SelectTrigger class="w-40">
            <SelectValue placeholder="Horário" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="h in horas" :key="h" :value="String(h)">{{ pad(h) }}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Dias padrão -->
      <div>
        <Label class="mb-1 block text-sm font-semibold">Dias padrão ({{ dias.length }})</Label>
        <p class="mb-2 text-xs text-muted-foreground">
          Agenda usada como base ao configurar clientes/lançamentos e no padrão do sistema.
        </p>
        <DiasLembreteEditor v-model="dias" />
      </div>

      <!-- Mensagem padrão -->
      <div>
        <Label class="mb-1 block text-sm font-semibold">Mensagem padrão (opcional)</Label>
        <Textarea
          v-model="mensagem"
          rows="3"
          placeholder="Olá {cliente}, sua parcela de {valor} vence em {vencimento}."
        />
        <p class="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Info class="h-3 w-3" />
          Variáveis: {cliente}, {descricao}, {valor}, {vencimento}, {parcela}. Sem preencher, usamos um texto padrão.
        </p>
      </div>

      <div class="flex justify-end gap-2 border-t pt-4">
        <Button type="button" variant="outline" @click="emit('update:open', false)">Cancelar</Button>
        <Button type="button" :disabled="saving || loading" @click="salvar">Salvar</Button>
      </div>
    </div>
  </ModalView>
</template>
