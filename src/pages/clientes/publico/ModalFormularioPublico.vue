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

const config = ref({
  quantidade_usos: 1,
  ativo: true,
})

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

async function createLinkCadastroPublico() {
  try {
    await http.post('/contas/parametros/linkpublico', {
      quantidade: config.value.quantidade_usos,
      ativo: config.value.ativo,
    })

    const idConta = HashGenerator.encode(uiStore.contaInfo.id!)
    const link = `${window.location.origin}/publico/${idConta}/cadastro`

    const ok = await copyToClipboard(link)

    if (!ok) {
      // fallback sem execCommand — exibe input para o usuário tocar e copiar
      const input = document.createElement('input')
      input.value = link
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.focus()
      input.select()
      // O usuário deve clicar e copiar manualmente
      toast.info('Toque e copie o link na barra de seleção.')
      return
    }

    toast.success('Link copiado com sucesso!')
    open.value = false
  } catch (error: any) {
    toast.error('Erro ao copiar o link!')
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
        <div class="flex justify-end col-span-2 gap-2">
          <Button @click="open = false" variant="outline">
            <CircleX /> Fechar
          </Button>
          <Button class="text-white" @click="createLinkCadastroPublico">
            <Save /> Salvar e copiar
          </Button>
        </div>
      </div>
    </ModalView>
  </div>
</template>
