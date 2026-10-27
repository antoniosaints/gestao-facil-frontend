<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import FormSection from './FormSection.vue'
import FormSelect from './FormSelect.vue'
import type { PersonForm } from '../application/personForm'
defineProps<{ form: PersonForm; editing?: boolean }>()
const emit = defineEmits<{ change: [] }>()
const states =
  'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ')
</script>
<template>
  <FormSection title="Identificação" description="Defina como esta pessoa será usada no sistema.">
    <label class="sm:col-span-2"
      >{{ editing ? 'Nome' : 'Nome completo' }} <span class="text-destructive">*</span
      ><Input
        v-model="form.nome"
        placeholder="Nome completo ou razão social"
        required
        minlength="2"
        maxlength="191"
        autocomplete="name"
    /></label>
    <label
      >Tipo de cadastro<FormSelect
        v-model="form.tipo"
        :options="[
          { value: 'CLIENTE', label: 'Cliente' },
          { value: 'FORNECEDOR', label: 'Fornecedor' },
        ]"
        @update:model-value="emit('change')"
    /></label>
    <label
      >Situação<FormSelect
        v-model="form.status"
        :options="[
          { value: 'ATIVO', label: 'Ativo' },
          { value: 'INATIVO', label: 'Inativo' },
          { value: 'BLOQUEADO', label: 'Bloqueado' },
        ]"
        @update:model-value="emit('change')"
    /></label>
  </FormSection>
  <FormSection title="Contato" description="Canais para falar com o cliente ou fornecedor.">
    <label class="sm:col-span-2"
      >E-mail<Input
        v-model="form.email"
        placeholder="nome@email.com"
        type="email"
        maxlength="191"
        autocomplete="email"
    /></label>
    <label
      >Telefone<Input
        v-model="form.telefone"
        placeholder="(00) 00000-0000"
        type="tel"
        maxlength="191"
        autocomplete="tel"
    /></label>
    <label
      >WhatsApp<Input
        v-model="form.whastapp"
        placeholder="(00) 00000-0000"
        type="tel"
        maxlength="191"
    /></label>
  </FormSection>
  <details class="col-span-full rounded-lg border border-border p-4 [&>summary]:!mb-0">
    <summary class="text-sm">
      Documento, endereço e observações
      <span class="text-xs font-normal text-muted-foreground">· Opcional</span>
    </summary>
    <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
      <label
        >CPF ou CNPJ<Input
          v-model="form.documento"
          placeholder="CPF ou CNPJ, somente números"
          inputmode="numeric"
          maxlength="18"
      /></label>
      <label
        >CEP<Input
          v-model="form.cep"
          placeholder="00000-000"
          inputmode="numeric"
          maxlength="9"
          autocomplete="postal-code"
      /></label>
      <label
        >Inscrição estadual<Input
          v-model="form.ie"
          placeholder="Número da inscrição estadual"
          maxlength="191"
      /></label>
      <label
        >Inscrição municipal<Input
          v-model="form.im"
          placeholder="Número da inscrição municipal"
          maxlength="191"
      /></label>
      <label class="sm:col-span-2"
        >Endereço<Input
          v-model="form.endereco"
          placeholder="Rua, avenida ou logradouro"
          maxlength="191"
          autocomplete="street-address"
      /></label>
      <label
        >Número<Input v-model="form.numero" placeholder="Ex.: 120 ou S/N" maxlength="191"
      /></label>
      <label
        >Bairro<Input v-model="form.bairro" placeholder="Nome do bairro" maxlength="191"
      /></label>
      <label
        >Cidade<Input
          v-model="form.cidade"
          placeholder="Nome da cidade"
          maxlength="191"
          autocomplete="address-level2"
      /></label>
      <label
        >Estado (UF)<FormSelect
          v-model="form.estado"
          placeholder="Selecione o estado"
          :options="[
            { value: '', label: 'Não informado' },
            ...states.map((value) => ({ value, label: value })),
          ]"
          @update:model-value="emit('change')"
      /></label>
      <label
        >Código do município<Input
          v-model="form.municipio"
          placeholder="Código IBGE do município"
          inputmode="numeric"
          maxlength="191"
      /></label>
      <label class="col-span-full"
        >Observações<Textarea
          v-model="form.observacaos"
          placeholder="Informações úteis para o atendimento desta pessoa"
          :rows="3"
          maxlength="191"
        /><small>{{ form.observacaos.length }}/191 caracteres</small></label
      >
    </div>
  </details>
</template>
