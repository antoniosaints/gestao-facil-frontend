<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useUiStore } from '@/stores/ui/uiStore'
import http from '@/utils/axios'
import { HashGenerator } from '@/utils/generators'
import { CircleX, Save } from 'lucide-vue-next'
import { ref } from 'vue'
import { useToast } from 'vue-toastification'

const uiStore = useUiStore()
const toast = useToast()
const open = defineModel<boolean>('open', { default: false })
const idConta = HashGenerator.encode(uiStore.contaInfo.id!)
const link = ref(window.location.origin + `/publico/${idConta}/cadastro`)

const config = ref({
  quantidade_usos: 1,
  ativo: true,
})

function copiarLink() {
  const texto = `${link.value}`
  navigator.clipboard.writeText(texto)
  toast.success('Link copiado com sucesso!')
}

async function salvarConfiguracaoLink() {
  try {
    await http.post('/contas/parametros/linkpublico', {
      quantidade: config.value.quantidade_usos,
      ativo: config.value.ativo,
    })
    toast.success('Configurações salvas com sucesso')
  } catch (error: any) {
    console.log(error)
    toast.error(error.response.data.message || 'Erro ao copiar o link!')
  }
}
</script>

<template>
  <div>
    <ModalView v-model:open="open" description="Formulário publico de cadastro" title="Configurar formulário público"
      size="sm">
      <div class="px-4 flex flex-col gap-2 gap-y-4">
        <div>
          <Label for="quantidade_usos">Quantidade de usos</Label>
          <Input v-model="config.quantidade_usos" id="quantidade_usos" min="0" placeholder="0" type="number" />
        </div>
        <Label for="permitir_cadastro"
          class="flex items-center cursor-pointer bg-secondary/20 border justify-between px-4 py-3 rounded-md">
          <span>Permitir Cadastro</span>
          <Switch v-model="config.ativo" id="permitir_cadastro" />
        </Label>
        <div class="grid grid-cols-12 items-center col-span-2 gap-2 bg-card border border-border px-3 py-2 rounded-lg">
          <span class="text-muted-foreground truncate text-xs col-span-9">{{ link }}</span>
          <button
            class="text-blue-700 dark:text-blue-200 py-1 px-3 rounded-md bg-blue-200 dark:bg-blue-800 flex justify-center col-span-3"
            @click="copiarLink">
            <span class="text-xs">Copiar</span>
          </button>
        </div>
        <div class="flex justify-end col-span-2 gap-2">
          <Button @click="open = false" variant="outline">
            <CircleX /> Fechar
          </Button>
          <Button class="text-white" @click="salvarConfiguracaoLink">
            <Save /> Salvar
          </Button>
        </div>
      </div>
    </ModalView>
  </div>
</template>
