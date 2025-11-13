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
import { ClienteRepository } from '@/repositories/cliente-repository'
import { useClientesStore } from '@/stores/clientes/useClientes'
import { useToast } from 'vue-toastification'

const toast = useToast()
const store = useClientesStore()

async function submit() {
  try {
    await ClienteRepository.save({
      ...store.form,
    })
    toast.success('Registro salvo com sucesso!')
    store.updateTable()
    store.reset()
    store.openModal = false
  } catch (e: any) {
    console.log(e)
    toast.error('Erro ao salvar o cliente, verifique sua conexão e tente novamente.')
  }
}
</script>

<template>
  <ModalView
    v-model:open="store.openModal"
    size="2xl"
    description="Preencha dos dados do cliente"
    title="Formulário de clientes"
  >
    <form @submit.prevent="submit" class="flex flex-col px-4">
      <div
        class="bg-background dark:bg-background-dark rounded-md w-full h-full grid grid-cols-2 gap-4"
      >
        <div class="w-full gap-2 flex flex-col">
          <Label for="nome">Nome</Label>
          <Input id="nome" required v-model="store.form.nome" placeholder="Nome" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="tipo">Tipo</Label>
          <Select id="tipo" v-model="store.form.tipo">
            <SelectTrigger class="w-full bg-card">
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
          <Input id="email" v-model="store.form.email" placeholder="E-mail" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="telefone">Telefone</Label>
          <Input id="telefone" v-model="store.form.telefone" placeholder="Telefone" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="documento">CPF/CNPJ</Label>
          <Input id="documento" v-model="store.form.documento" placeholder="CPF/CNPJ" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="whatsapp">WhatsApp</Label>
          <Input id="whatsapp" v-model="store.form.whastapp" placeholder="WhatsApp" />
        </div>
        <div class="w-full gap-2 flex flex-col">
          <Label for="status">Status</Label>
          <Select id="status" v-model="store.form.status">
            <SelectTrigger class="w-full bg-card">
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
          <Input id="cep" v-model="store.form.cep" placeholder="CEP" />
        </div>
        <div class="w-full gap-2 flex flex-col col-span-2">
          <Label for="endereco">Endereço</Label>
          <Input id="endereco" v-model="store.form.endereco" placeholder="Endereço" />
        </div>
        <div class="w-full gap-2 flex flex-col col-span-2">
          <Label for="observacoes">Observações</Label>
          <Textarea
            id="observacoes"
            v-model="store.form.observacaos"
            placeholder="Observações"
          ></Textarea>
        </div>
      </div>
      <div class="flex justify-end gap-2 mt-4">
        <Button type="button" variant="secondary" @click="store.openModal = false"> Fechar </Button>
        <Button class="text-white" type="submit"> Registrar </Button>
      </div>
    </form>
  </ModalView>
</template>
