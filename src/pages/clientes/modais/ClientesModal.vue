<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import IaTextAssistant from '@/components/ia/IaTextAssistant.vue'
import { ClienteRepository } from '@/repositories/cliente-repository'
import { cepMaskOptions, cpfCnpjMaskOptions, phoneMaskOptions } from '@/lib/imaska'
import { useClientesStore } from '@/stores/clientes/useClientes'
import { vMaska } from 'maska/vue'
import { useToast } from 'vue-toastification'
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useConfirm } from '@/composables/useConfirm'

const toast = useToast()
const store = useClientesStore()
const isSubmitting = ref(false)
const submitError = ref('')
const initialForm = ref('')
const confirmingClose = ref(false)
const entityName = computed(() => store.form.tipo === 'FORNECEDOR' ? 'fornecedor' : 'cliente')
const dirty = computed(() => store.openModal && JSON.stringify(store.form) !== initialForm.value)

watch(() => store.openModal, (open) => {
  if (open) {
    initialForm.value = JSON.stringify(store.form)
    submitError.value = ''
  }
}, { immediate: true, flush: 'sync' })

async function canLeave() {
  if (isSubmitting.value || confirmingClose.value) return false
  if (!dirty.value) return true
  confirmingClose.value = true
  try {
    return await useConfirm().confirm({
      title: 'Descartar alterações?',
      message: 'As alterações ainda não foram salvas. Deseja descartá-las?',
      confirmText: 'Descartar alterações',
      cancelText: 'Continuar editando',
      colorButton: 'danger',
    })
  } finally {
    confirmingClose.value = false
  }
}

async function requestClose() {
  if (await canLeave()) {
    store.openModal = false
    store.reset()
  }
}

const modalOpen = computed({
  get: () => store.openModal,
  set: (open: boolean) => { if (!open) void requestClose() },
})

function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value || isSubmitting.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload))
onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))
onBeforeRouteLeave(async () => {
  if (!store.openModal) return true
  if (!await canLeave()) return false
  store.openModal = false
  store.reset()
  return true
})

async function submit() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  submitError.value = ''
  try {
    const resposta = await ClienteRepository.save({
      ...store.form,
    })
    toast.success(`${entityName.value === 'cliente' ? 'Cliente' : 'Fornecedor'} salvo com sucesso!`)
    store.updateTable()
    // Auto-seleciona o cliente recém-criado no select que abriu o cadastro.
    if (resposta?.data) store.notifyCreated(resposta.data)
    store.reset()
    store.openModal = false
  } catch (e: any) {
    submitError.value = e?.response?.data?.message || 'Não foi possível salvar. Verifique sua conexão e tente novamente. Seus dados foram mantidos.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <ModalView
    v-model:open="modalOpen"
    size="2xl"
    description="Preencha os dados. O nome é obrigatório."
    :title="`${store.form.id ? 'Editar' : 'Novo'} ${entityName}`"
  >
    <form @submit.prevent="submit" class="flex flex-col px-4" :aria-busy="isSubmitting">
      <p v-if="submitError" role="alert" class="mb-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{{ submitError }}</p>
      <fieldset :disabled="isSubmitting" class="min-w-0 border-0 p-0 m-0">
      <div
        class="bg-background dark:bg-background-dark rounded-md w-full h-full grid grid-cols-1 sm:grid-cols-2 gap-4"
      >
        <div class="w-full gap-2 flex flex-col">
          <Label for="nome">Nome</Label>
          <Input id="nome" name="nome" autocomplete="name" required v-model="store.form.nome" placeholder="Nome completo ou razão social" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="tipo">Tipo</Label>
          <Select v-model="store.form.tipo" :disabled="isSubmitting">
            <SelectTrigger id="tipo" class="w-full bg-card">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CLIENTE">Cliente</SelectItem>
              <SelectItem value="FORNECEDOR">Fornecedor</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="email">E-mail</Label>
          <Input id="email" name="email" type="email" autocomplete="email" v-model="store.form.email" placeholder="nome@exemplo.com" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="telefone">Telefone</Label>
          <Input id="telefone" v-model="store.form.telefone" v-maska="phoneMaskOptions" inputmode="tel" placeholder="(00) 00000-0000" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="documento">CPF/CNPJ</Label>
          <Input id="documento" v-model="store.form.documento" v-maska="cpfCnpjMaskOptions" inputmode="numeric" placeholder="CPF ou CNPJ" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" v-model="store.form.whastapp" v-maska="phoneMaskOptions" inputmode="tel" placeholder="(00) 00000-0000" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="status">Status</Label>
          <Select v-model="store.form.status" :disabled="isSubmitting">
            <SelectTrigger id="status" class="w-full bg-card">
              <SelectValue placeholder="Selecione o status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ATIVO">Ativo</SelectItem>
              <SelectItem value="INATIVO">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="cidade">Cidade</Label>
          <Input id="cidade" v-model="store.form.cidade" placeholder="Cidade" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="estado">Estado</Label>
          <Input id="estado" v-model="store.form.estado" placeholder="Estado" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="cep">CEP</Label>
          <Input id="cep" v-model="store.form.cep" v-maska="cepMaskOptions" inputmode="numeric" placeholder="00000-000" />
        </div>
        <div class="w-full gap-2 flex flex-col sm:col-span-2">
          <Label for="endereco">Endereço</Label>
          <Input id="endereco" v-model="store.form.endereco" placeholder="Endereço" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="numero">Número</Label>
          <Input id="numero" v-model="store.form.numero" placeholder="Número do endereço" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="bairro">Bairro</Label>
          <Input id="bairro" v-model="store.form.bairro" placeholder="Bairro" />
        </div>
        <div class="w-full gap-2 flex flex-col sm:col-span-2">
          <div class="flex items-center justify-between gap-2">
            <Label for="observacoes">Observações</Label>
            <IaTextAssistant v-model="store.form.observacaos"
              contexto="Observações sobre um cliente em um sistema de gestão (ERP)."
              title="Observações do cliente com IA" />
          </div>
          <Textarea
            id="observacoes"
            v-model="store.form.observacaos"
            placeholder="Observações"
          ></Textarea>
        </div>
      </div>
      </fieldset>
      <div class="flex justify-end gap-2 mt-4">
        <Button type="button" variant="outline" :disabled="isSubmitting || confirmingClose" @click="requestClose">Cancelar</Button>
        <Button type="submit" :disabled="isSubmitting || confirmingClose">{{ isSubmitting ? 'Salvando…' : `Salvar ${entityName}` }}</Button>
      </div>
      <span class="sr-only" role="status">{{ isSubmitting ? 'Salvando. Aguarde.' : '' }}</span>
    </form>
  </ModalView>
</template>
