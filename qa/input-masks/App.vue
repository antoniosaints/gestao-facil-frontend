<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import PersonFields from '../../src/modofacil/components/PersonFields.vue'
import { emptyPerson, personPayload } from '../../src/modofacil/application/personForm'
import { Input } from '../../src/components/ui/input'
import { Button } from '../../src/components/ui/button'
import CartDrawer from '../../src/pages/loja/publico/components/CartDrawer.vue'
import type { CheckoutPayload } from '../../src/repositories/loja-repository'
import { useStorefrontLightTheme } from '../../src/composables/useStorefrontLightTheme'
import { store, product } from './fixtures'
useStorefrontLightTheme()
const form = reactive(emptyPerson())
form.nome = 'Cliente de homologação'
const amount = ref(0)
const checkoutOpen = ref(false)
const finished = ref(false)
const checkout = reactive<CheckoutPayload>({
  items: [],
  channel: 'WHATSAPP',
  deliveryType: 'ENTREGA_LOCAL',
  customer: {
    name: '',
    phone: '',
    postalCode: '',
    address: '',
    number: '',
    district: '',
    city: '',
    state: '',
  },
})
const payload = computed(() => JSON.stringify(personPayload(form), null, 2))
</script>
<template>
  <main class="mx-auto max-w-5xl space-y-6 p-5">
    <h1 class="text-2xl font-semibold">Homologação de formulários</h1>
    <p class="text-sm text-muted-foreground">
      Componentes reais com dados locais de teste. Nenhum cadastro é gravado.
    </p>
    <section aria-label="Cadastro de pessoa" class="space-y-4">
      <PersonFields :form="form" />
    </section>
    <section class="grid gap-4 rounded-lg border bg-card p-4 sm:grid-cols-2">
      <label
        >Valor com seis casas decimais<Input
          v-model.number="amount"
          type="number"
          min="-100"
          step="0.000001"
          placeholder="0,000000"
          icon-label="R$"
      /></label>
      <div>
        <p class="text-sm">
          Valor numérico: <output id="numeric-model">{{ amount }} ({{ typeof amount }})</output>
        </p>
        <Button class="mt-3" @click="checkoutOpen = true">Abrir checkout</Button>
        <p v-if="finished" role="status">Checkout confirmado localmente</p>
      </div>
    </section>
    <details>
      <summary>Valores preparados para envio</summary>
      <pre class="overflow-auto p-4 text-xs">{{ payload }}</pre>
    </details>
    <section aria-label="Formulário legado" class="space-y-3 rounded-lg border bg-card p-4">
      <h2 class="font-semibold">Formulário legado</h2>
      <div class="grid gap-4 sm:grid-cols-3">
        <label
          >Telefone legado<input
            class="mt-1 h-9 w-full rounded-md border px-3"
            type="tel"
            inputmode="tel"
            data-input-mask="phone"
            placeholder="(00) 00000-0000"
        /></label>
        <label
          >Documento legado<input
            class="mt-1 h-9 w-full rounded-md border px-3"
            inputmode="numeric"
            data-input-mask="cpf-cnpj"
            placeholder="CPF ou CNPJ"
        /></label>
        <label
          >CEP legado<input
            class="mt-1 h-9 w-full rounded-md border px-3"
            inputmode="numeric"
            data-input-mask="cep"
            placeholder="00000-000"
        /></label>
      </div>
    </section>
    <CartDrawer
      v-model:open="checkoutOpen"
      :store="store"
      :items="[{ product, quantity: 1 }]"
      :subtotal="10"
      :checkout="checkout"
      :checking-out="false"
      @finish="
        finished = true
        checkoutOpen = false
      "
    />
  </main>
</template>
