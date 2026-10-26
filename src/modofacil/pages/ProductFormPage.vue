<script setup lang="ts">
import FormResultLink from '../components/FormResultLink.vue'
import FormBack from '../components/FormBack.vue'
import { Textarea } from '@/components/ui/textarea'

import { Input } from '@/components/ui/input'

import ReviewPanel from '../components/ReviewPanel.vue'
import PageFrame from '../components/PageFrame.vue'
import { computed, onMounted, reactive, ref } from 'vue'
import { useFormContext } from '../application/modalWorkspace'
import { products, type Row, type SavedProduct, type BasicProduct } from '../adapters/domain'
import { decimal, errorMessage, money } from '../application/format'
import { useFlow } from '../application/useFlow'
import Feedback from '../components/Feedback.vue'
import CategoryPicker from '../components/CategoryPicker.vue'
import { changedProductFields } from '../application/productPayload'
const route = useFormContext()
const editing = !!route.params.produtoBaseId
const form = reactive({
  nome: '',
  categoriaId: null as number | null,
  unidade: 'un',
  preco: '',
  precoCompra: '',
  estoque: '0',
  minimo: '0',
  descricao: '',
})
const categoryLabel = ref(''),
  step = ref(1),
  error = ref(''),
  message = ref(''),
  busy = ref(false),
  loading = ref(false),
  dirty = ref(false),
  file = ref<File | null>(null),
  saved = ref<SavedProduct | null>(null),
  variantId = ref(0)
const key = crypto.randomUUID()
let replayBody: BasicProduct | null = null
const original = ref<BasicProduct | null>(null)
const variantInfo = ref<Row | null>(null)
const units = [
  ['un', 'Unidade'],
  ['kg', 'Quilograma'],
  ['l', 'Litro'],
  ['m', 'Metro'],
  ['g', 'Gramas'],
  ['cm', 'Centímetros'],
  ['mm', 'Milímetros'],
  ['mg', 'Miligramas'],
  ['ml', 'Mililitro'],
  ['cx', 'Caixa'],
]
const readonly = computed(() => !!saved.value)
useFlow(dirty, busy)
async function load() {
  loading.value = true
  error.value = ''
  try {
    if (editing) {
      const base = await products.get(Number(route.params.produtoBaseId))
      categoryLabel.value = base.categoria || base.Categoria?.nome || ''
      const variants: Row[] = await products.variants(Number(route.params.produtoBaseId))
      const id = Number(
        route.params.varianteId ||
          route.query.varianteId ||
          base.variantePadraoId ||
          variants.find((v) => v.ehPadrao)?.id,
      )
      const variant = variants.find((v) => v.id === id)
      if (!variant) throw new Error('Escolha uma variante nos detalhes do produto.')
      variantId.value = variant.id
      variantInfo.value = variant
      Object.assign(form, {
        nome: base.nome,
        categoriaId: base.categoriaId,
        unidade: variant.unidade || 'un',
        preco: String(variant.preco),
        precoCompra: variant.precoCompra == null ? '' : String(variant.precoCompra),
        estoque: String(variant.estoque),
        minimo: String(variant.minimo),
        descricao: base.descricao || '',
      })
    }
    original.value = editing
      ? {
          nome: form.nome,
          categoriaId: form.categoriaId,
          unidade: form.unidade,
          preco: decimal(form.preco),
          precoCompra: form.precoCompra === '' ? null : decimal(form.precoCompra),
          minimo: decimal(form.minimo, 3),
          descricao: form.descricao || null,
        }
      : null
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}
onMounted(load)
function validate() {
  if (step.value === 1 && form.nome.trim().length < 2)
    throw new Error('Informe um nome com pelo menos 2 caracteres.')
  if (step.value === 2) {
    decimal(form.preco)
    if (form.precoCompra !== '') decimal(form.precoCompra)
    if (!editing) decimal(form.estoque, 3)
    decimal(form.minimo, 3)
  }
}
function next() {
  error.value = ''
  try {
    validate()
    step.value++
  } catch (e) {
    error.value = errorMessage(e)
  }
}
function selectPhoto(event: Event) {
  error.value = ''
  const photo = (event.target as HTMLInputElement).files?.[0]
  if (!photo) {
    file.value = null
    return
  }
  if (
    photo.size > 5 * 1024 * 1024 ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)
  ) {
    file.value = null
    error.value = 'Escolha uma imagem JPEG, PNG ou WebP de até 5 MB.'
    ;(event.target as HTMLInputElement).value = ''
    return
  }
  file.value = photo
  dirty.value = true
}
async function upload() {
  if (!saved.value || !file.value) return
  busy.value = true
  error.value = ''
  try {
    await products.photo(saved.value.varianteId, file.value)
    file.value = null
    message.value = 'Produto e foto salvos.'
    dirty.value = false
  } catch (e) {
    error.value = `Produto salvo; a foto não foi enviada. ${errorMessage(e)}`
  } finally {
    busy.value = false
  }
}
async function save() {
  busy.value = true
  error.value = ''
  try {
    const body: BasicProduct = {
      nome: form.nome.trim(),
      categoriaId: form.categoriaId,
      unidade: form.unidade,
      preco: decimal(form.preco),
      precoCompra: form.precoCompra === '' ? null : decimal(form.precoCompra),
      minimo: decimal(form.minimo, 3),
      descricao: form.descricao.trim() || null,
    }
    if (editing) {
      const restricted = changedProductFields(body, original.value!)
      saved.value = Object.keys(restricted).length
        ? await products.update(Number(route.params.produtoBaseId), variantId.value, restricted)
        : {
            produtoBaseId: Number(route.params.produtoBaseId),
            varianteId: variantId.value,
            produto: variantInfo.value!,
          }
    } else {
      body.estoque = decimal(form.estoque, 3)
      if (replayBody && JSON.stringify(replayBody) !== JSON.stringify(body))
        throw new Error(
          'A tentativa anterior pode ter sido salva. Repita com os mesmos dados antes de iniciar outro cadastro.',
        )
      replayBody = body
      saved.value = await products.create(body, key)
    }
    dirty.value = false
    message.value = 'Produto salvo. Os dados avançados foram preservados.'
    if (file.value) await upload()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    busy.value = false
  }
}
</script>
<template>
  <PageFrame compact>
    <div class="mf-head mb-5 flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1>{{ editing ? 'Editar produto' : 'Cadastre sem complicação' }}</h1>
        <p>Uma etapa por vez. Volte sem perder o que preencheu.</p>
      </div>
      <FormBack
        :to="editing ? `/modofacil/produtos/${route.params.produtoBaseId}` : '/modofacil/produtos'"
        >Voltar aos produtos</FormBack
      >
    </div>
    <Feedback
      :loading="loading"
      :error="error"
      :message="message"
      @retry="saved && file ? upload() : (error = '')"
    />
    <ol
      class="mf-steps grid grid-cols-3 border-b border-border p-0 [&>li]:min-w-0 [&>li]:break-words [&>li]:border-b-2 [&>li]:border-transparent [&>li]:px-2 [&>li]:py-3 [&>li]:text-center [&>li]:text-[11px] [&>li]:text-muted-foreground sm:[&>li]:text-sm [&>[aria-current]]:border-blue-600 [&>[aria-current]]:font-medium [&>[aria-current]]:text-blue-600 dark:[&>[aria-current]]:text-blue-300"
    >
      <li
        v-for="(label, index) in ['Sobre o produto', 'Preço e estoque', 'Foto e revisão']"
        :key="label"
        :aria-current="step === index + 1 ? 'step' : undefined"
      >
        {{ index + 1 }}. {{ label }}
      </li>
    </ol>
    <form
      class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5 mf-stack grid gap-4"
      @submit.prevent="step < 3 ? next() : save()"
      @input="dirty = true"
      v-if="!loading && !saved"
    >
      <fieldset :disabled="busy || readonly" class="mf-stack grid gap-4">
        <div v-show="step === 1" class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
          <label
            >Nome<Input
              v-model="form.nome"
              minlength="2"
              maxlength="191"
              autocomplete="off" /></label
          ><CategoryPicker
            v-model="form.categoriaId"
            :initial-label="categoryLabel"
            @update:model-value="dirty = true"
          /><label
            >Unidade<select v-model="form.unidade">
              <option v-for="[value, label] in units" :key="value" :value="value">
                {{ label }}
              </option>
            </select></label
          >
        </div>
        <div v-show="step === 2" class="mf-grid grid grid-cols-1 gap-4 md:grid-cols-2">
          <label
            >Preço de venda<Input
              v-model="form.preco"
              inputmode="decimal"
              placeholder="49,90"
            /><small>Valor cobrado do cliente.</small></label
          ><label
            >Preço de compra<Input
              v-model="form.precoCompra"
              inputmode="decimal"
              placeholder="Não informado"
            /><small>Deixe vazio se ainda não conhece o custo.</small></label
          ><label
            >Estoque atual<Input
              v-model="form.estoque"
              inputmode="decimal"
              :readonly="editing"
            /><small>{{
              editing
                ? 'Saldo somente para consulta. Altere por reposição ou descarte.'
                : 'Quantidade inicial, até 3 casas decimais.'
            }}</small></label
          ><label
            >Estoque mínimo<Input v-model="form.minimo" inputmode="decimal" /><small
              >Avise quando chegar a esta quantidade.</small
            ></label
          >
          <p
            v-if="editing && variantInfo"
            class="mf-notice my-4 break-words rounded-[6px] border border-blue-500/20 bg-blue-500/10 p-4 text-sm text-blue-800 dark:text-blue-300 mf-full col-span-full"
          >
            Variante: {{ variantInfo.nomeVariante || 'Padrão' }} ·
            {{
              variantInfo.controlaEstoque ? 'Com controle de estoque' : 'Sem controle de estoque'
            }}. Esta configuração será preservada.
          </p>
        </div>
        <div v-show="step === 3" class="mf-stack grid gap-4">
          <label>Descrição<Textarea v-model="form.descricao" /></label
          ><label
            >Foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              @change="selectPhoto"
            /><small
              >Opcional · JPEG, PNG ou WebP · até 5 MB. A imagem atual é preservada se você não
              escolher outra.</small
            ></label
          >
          <ReviewPanel>
            <template #title>Confira seu produto</template>
            <p>
              <strong>{{ form.nome }}</strong> · {{ form.unidade }}
            </p>
            <p>
              Venda: {{ money(Number(form.preco.replace(',', '.'))) }} · Custo:
              {{
                form.precoCompra === ''
                  ? 'Não informado'
                  : money(Number(form.precoCompra.replace(',', '.')))
              }}
            </p>
            <p>Estoque: {{ form.estoque }} · Mínimo: {{ form.minimo }}</p>
            <p>
              Informações fiscais, promoção, SKU e demais configurações existentes não são
              alteradas.
            </p>
          </ReviewPanel>
        </div>
      </fieldset>
      <div class="mf-actions my-4 flex flex-wrap items-end gap-3">
        <button
          v-if="step > 1"
          type="button"
          :disabled="busy"
          @click="
            ($event) => {
              step--
              error = ''
            }
          "
        >
          Voltar</button
        ><button
          class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
          :disabled="busy"
          type="submit"
        >
          {{ busy ? 'Salvando…' : step < 3 ? 'Continuar' : 'Salvar produto' }}
        </button>
      </div>
    </form>
    <section v-if="saved" class="mf-card min-w-0 rounded-[8px] border border-border bg-card p-5">
      <h2>Seu produto foi salvo</h2>
      <p>Base #{{ saved.produtoBaseId }} · Variante #{{ saved.varianteId }}</p>
      <button
        v-if="file"
        :disabled="busy"
        class="mf-primary !border-blue-600 !bg-blue-600 !text-white hover:!border-blue-700 hover:!bg-blue-700"
        @click="upload"
      >
        Reenviar somente a foto</button
      ><FormResultLink
        class="mf-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[6px] border border-border bg-card px-4 py-2 text-sm font-medium text-foreground/90 no-underline transition-colors hover:bg-muted/50"
        :to="`/modofacil/produtos/${saved.produtoBaseId}`"
        >Ver produto</FormResultLink
      >
    </section>
  </PageFrame>
</template>
