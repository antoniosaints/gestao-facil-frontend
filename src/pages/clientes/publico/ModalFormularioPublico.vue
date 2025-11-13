<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useUiStore } from '@/stores/ui/uiStore'
import { HashGenerator } from '@/utils/generators'
import { CircleX, Save } from 'lucide-vue-next'
import { ref } from 'vue'
import { useToast } from 'vue-toastification'

const uiStore = useUiStore()
const toast = useToast()
const open = defineModel<boolean>('open', { default: false })

const config = ref({
  quantidade_usos: 1,
  observacao_form: 'Bem vindo...',
  ativo: true,
  multiplo: false,
})

function createLinkCadastroPublico() {
  const idConta = HashGenerator.encode(uiStore.contaInfo.id!)
  const link = window.location.origin + `/publico/${idConta}/cadastro`
  const texto = `${link}`
  navigator.clipboard.writeText(texto)
  toast.success('Link copiado com sucesso!')
}
</script>

<template>
  <div>
    <ModalView
      v-model:open="open"
      description="Formulário publico de cadastro"
      title="Configurar formulário público"
      size="lg"
    >
      <div class="px-4 grid grid-cols-2 gap-2 gap-y-4">
        <div>
          <Label for="quantidade_usos">Quantidade de usos</Label>
          <Input
            v-model="config.quantidade_usos"
            id="quantidade_usos"
            min="0"
            placeholder="0"
            type="number"
          />
        </div>
        <div>
          <Label for="observacao_form">Observação</Label>
          <Input
            v-model="config.observacao_form"
            id="observacao_form"
            placeholder="Bem vindo..."
            type="text"
          />
        </div>
        <Label
          for="permitir_cadastro"
          class="flex items-center cursor-pointer bg-secondary/20 border justify-between px-4 py-3 rounded-md"
        >
          <span>Permitir Cadastro</span>
          <Switch v-model="config.ativo" id="permitir_cadastro" />
        </Label>
        <Label
          for="apenas_um_cadastro"
          class="flex items-center cursor-pointer bg-secondary/20 border justify-between px-4 py-3 rounded-md"
        >
          <span>Apenas um cadastro</span>
          <Switch v-model="config.multiplo" id="apenas_um_cadastro" />
        </Label>
        <div class="flex justify-end col-span-2 gap-2">
          <Button @click="open = false" variant="outline"><CircleX /> Fechar </Button>
          <Button @click="createLinkCadastroPublico"><Save /> Salvar e copiar </Button>
        </div>
      </div>
    </ModalView>
  </div>
</template>
