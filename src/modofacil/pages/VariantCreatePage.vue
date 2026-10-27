<script setup lang="ts">
import FormSelect from '../components/FormSelect.vue'
import FormResultLink from '../components/FormResultLink.vue'
import FormBack from '../components/FormBack.vue'
import { Input } from '@/components/ui/input'

import ReviewPanel from '../components/ReviewPanel.vue'
import PageHeader from '../components/PageHeader.vue'
import PageFrame from '../components/PageFrame.vue'
import { reactive, ref, onMounted } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { api, products } from '../adapters/domain'
import { decimal, errorMessage } from '../application/format'
import { useFlow } from '../application/useFlow'
import { useDomainMutation } from '../application/useDomainMutation'
import Feedback from '../components/Feedback.vue'
import { notifySuccess } from '../application/notifications'
const route = useFormContext(),
  baseId = Number(route.params.produtoBaseId),
  baseName = ref(''),
  form = reactive({
    nomeVariante: '',
    unidade: 'un',
    preco: '',
    precoCompra: '',
    estoque: '0',
    minimo: '0',
  }),
  dirty = ref(false),
  review = ref(false),
  validation = ref(''),
  loadError = ref(''),
  saved = ref<any>(null),
  photo = ref<File | null>(null),
  photoBusy = ref(false),
  photoError = ref(''),
  photoDone = ref(false),
  key = crypto.randomUUID()
const { busy, error, message, uncertain, run } = useDomainMutation()
useFlow(dirty, busy)
async function load() {
  loadError.value = ''
  try {
    baseName.value = (await products.get(baseId)).nome
  } catch (e) {
    loadError.value = errorMessage(e)
  }
}
onMounted(load)
function payload() {
  if (!form.nomeVariante.trim()) throw new Error('Informe o nome da variante.')
  return {
    chaveOperacao: key,
    nomeVariante: form.nomeVariante.trim(),
    unidade: form.unidade,
    preco: decimal(form.preco),
    precoCompra: form.precoCompra === '' ? null : decimal(form.precoCompra),
    estoque: decimal(form.estoque, 3),
    minimo: decimal(form.minimo, 3),
  }
}
function next() {
  validation.value = ''
  try {
    payload()
    review.value = true
  } catch (e) {
    validation.value = errorMessage(e)
  }
}
async function save() {
  let body
  try {
    body = payload()
  } catch (e) {
    validation.value = errorMessage(e)
    return
  }
  const result = await run(
    () => api.post(`/modofacil/produtos/${baseId}/variantes`, body),
    'Variante criada.',
  )
  if (result) {
    saved.value = result.value
    dirty.value = false
    if (photo.value) await upload()
  }
}
function choose(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  validation.value = ''
  if (
    f &&
    (f.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(f.type))
  ) {
    photo.value = null
    validation.value = 'Escolha JPEG, PNG ou WebP de até 5 MB.'
    return
  }
  photo.value = f || null
}
async function upload() {
  if (!saved.value || !photo.value || photoBusy.value) return
  photoBusy.value = true
  photoError.value = ''
  try {
    await products.photo(saved.value.varianteId, photo.value)
    photo.value = null
    photoDone.value = true
    notifySuccess('Foto da variante salva.')
  } catch (e) {
    photoError.value = 'Variante salva; a foto não foi enviada. ' + errorMessage(e)
  } finally {
    photoBusy.value = false
  }
}
</script>
<template>
  <PageFrame compact>
    <PageHeader
      ><template #title>Criar variante</template
      ><template #description
        >{{ baseName }} · As informações comuns são herdadas do produto.</template
      ><template #back
        ><FormBack :to="`/modofacil/produtos/${baseId}`">← Produto</FormBack></template
      ></PageHeader
    >

    <Feedback
      :error="loadError || validation || error || photoError"
      :message="message"
      @retry="loadError ? load() : saved && photo ? upload() : (validation = '')"
    />
    <form
      v-if="!saved"
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="review ? save() : next()"
      @input="dirty = true"
    >
      <fieldset
        :disabled="busy || uncertain || !baseName"
        class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <template v-if="!review"
          ><label
            >Nome da variante<Input
              v-model="form.nomeVariante"
              required
              maxlength="191"
              placeholder="Ex.: Azul / tamanho M" /></label
          ><label
            >Unidade<FormSelect
              v-model="form.unidade"
              :options="[
                ...['un', 'kg', 'l', 'm', 'g', 'cm', 'mm', 'mg', 'ml', 'cx'].map((unit) => ({
                  value: unit,
                  label: unit,
                })),
              ]" /></label
          ><label
            >Preço de venda<Input
              placeholder="0,00"
              v-model="form.preco"
              inputmode="decimal"
              required /></label
          ><label
            >Preço de compra<Input
              v-model="form.precoCompra"
              inputmode="decimal"
              placeholder="Não informado" /></label
          ><label
            >Estoque inicial<Input
              placeholder="Ex.: 10,500"
              v-model="form.estoque"
              inputmode="decimal"
              required /></label
          ><label
            >Estoque mínimo<Input
              placeholder="Ex.: 5"
              v-model="form.minimo"
              inputmode="decimal"
              required /></label
          ><label class="mf-full col-span-full"
            >Foto opcional<Input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @change="choose" /></label
        ></template>
        <ReviewPanel v-else>
          <template #title>Confira a nova variante</template>
          <p>
            {{ form.nomeVariante }} · {{ form.unidade }} · Venda {{ form.preco }} · Custo
            {{ form.precoCompra || 'Não informado' }}
          </p>
          <p>Estoque inicial {{ form.estoque }} · Mínimo {{ form.minimo }}.</p>
          <p>
            O domínio gera SKU e controla o estoque desta nova variante. As outras variantes
            permanecem intactas.
          </p>
        </ReviewPanel>
        <div
          class="mf-form-actions mf-actions col-span-full flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end"
        >
          <button v-if="review" type="button" @click="review = false">Voltar</button
          ><button
            class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          >
            {{ busy ? 'Criando…' : review ? 'Confirmar nova variante' : 'Conferir' }}
          </button>
        </div>
      </fieldset>
    </form>
    <section v-if="saved" class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5">
      <p>Base #{{ saved.produtoBaseId }} · Variante #{{ saved.varianteId }}</p>
      <button v-if="photo" :disabled="photoBusy" @click="upload">
        Reenviar somente a foto da variante
      </button>
      <p v-if="photoDone">Foto salva.</p>
      <FormResultLink :to="`/modofacil/produtos/${baseId}`">Ver todas as variantes</FormResultLink>
    </section>
  </PageFrame>
</template>
