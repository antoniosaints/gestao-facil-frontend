<script setup lang="ts">
import './siteTypography.css'
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { isAxiosError } from 'axios'
import { ArrowLeft, ArrowRight, Check, Loader2 } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { vMaska } from '@/lib/maska'
import { cpfCnpjMaskOptions, phoneMaskOptions } from '@/lib/imaska'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAccountCreateStore } from '@/stores/login/useCreateAccount'
import { ContaRepository, type CreateConta } from '@/repositories/conta-repository'
import { OnboardingRepository } from '@/repositories/onboarding-repository'
import { isAppAvailable } from '@/utils/appAccess'
import {
  OPERATION_KEYS,
  type OnboardingConfig,
  type OnboardingPreview,
  type OperationAnswers,
} from '@/types/onboarding'
import { FONT_OPTIONS, normalizeThemeCustomization } from '@/utils/themeCustomization'
import ThemePreview from './components/ThemePreview.vue'

const store = useAccountCreateStore()
const router = useRouter()
const route = useRoute()
const toast = useToast()
const steps = ['Seu acesso', 'Seu empreendimento', 'Seus módulos', 'Sua identidade', 'Confirmação']
const step = ref(1)
const heading = ref<HTMLElement | null>(null)
const formElement = ref<HTMLFormElement | null>(null)
const busy = ref(false)
const configLoading = ref(false)
const config = ref<OnboardingConfig | null>(null)
const preview = ref<OnboardingPreview | null>(null)
const message = ref('')
const errors = ref<Record<string, string>>({})
const answers = ref<OperationAnswers>(
  Object.fromEntries(OPERATION_KEYS.map((key) => [key, false])) as OperationAnswers,
)
const selectedModules = ref<string[]>([])
const selectedMenus = ref<string[]>([])
const theme = ref(normalizeThemeCustomization())
const selectedPreset = ref('')
const reviewedAnswers = ref('')
let alive = true

const menuNames: Record<string, string> = {
  dashboard: 'Visão geral',
  financeiro: 'Financeiro',
  clientes: 'Clientes',
  vendas: 'Vendas',
  produtos: 'Produtos',
  servicos: 'Serviços',
  reservas: 'Agendamento',
  arena: 'Arena',
  ourive: 'Ourivesaria',
  restaurante: 'Restaurante',
  assinaturas: 'Contratos',
  atendimento: 'Atendimento',
  'loja-virtual': 'Loja virtual',
  'produtos:combos': 'Combos',
  configuracoes: 'Configurações',
  perfil: 'Perfil',
  loja: 'App Store',
  usuarios: 'Equipe',
  changelog: 'Novidades',
  metas: 'Metas',
  whatsapp: 'WhatsApp',
  'notas-fiscais': 'Notas fiscais',
  'core-ia': 'CORE IA',
}
const menuLabel = (key: string) => menuNames[key] || key
const menus = computed(() =>
  [
    ...new Set([
      ...(config.value?.baseMenuKeys || []),
      ...(config.value?.modules
        .map((module) => module.menuKey)
        .filter((key): key is string => !!key) || []),
      ...(preview.value?.menusSugeridos || []),
      ...selectedMenus.value,
    ]),
  ].filter((key) => !key.includes(':') && isAppAvailable(key)),
)
const questions = computed(() =>
  config.value?.questions.filter(({ key }) => key !== 'emiteNotas' || isAppAvailable('notas-fiscais')),
)
const fonts = computed(() =>
  (config.value?.fonts || FONT_OPTIONS)
    .map((font) => (typeof font === 'string' ? { value: font, label: font } : font))
    .filter((font) => FONT_OPTIONS.some((option) => option.value === font.value)),
)
const modules = computed(() =>
  (preview.value?.modulos || [])
    .filter((module) => isAppAvailable(module.codigo))
    .map((module) => ({
      ...module,
      name:
        config.value?.modules.find((item) => item.codigo === module.codigo)?.nome || module.codigo,
    })),
)
const selectedSummary = computed(() => modules.value.filter((module) => module.selecionado))
const formatMoney = (value: number) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function toggle(values: string[], key: string, checked: boolean) {
  return checked ? [...new Set([...values, key])] : values.filter((value) => value !== key)
}
function applyPreset(preset: OnboardingConfig['themePresets'][number]) {
  theme.value = normalizeThemeCustomization({ ...preset.tema, fonte: theme.value.fonte })
  selectedPreset.value = preset.id
}
function checked(event: Event) {
  return (event.target as HTMLInputElement).checked
}
async function focusHeading() {
  await nextTick()
  heading.value?.focus()
}
async function goTo(value: number) {
  step.value = value
  await focusHeading()
}
async function focusError() {
  await nextTick()
  formElement.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}
async function loadConfig() {
  configLoading.value = true
  message.value = ''
  try {
    const data = await OnboardingRepository.config()
    if (!alive) return
    config.value = data
    if (!selectedPreset.value && data.themePresets.length) {
      const preset = data.themePresets[0]!
      theme.value = normalizeThemeCustomization(preset.tema)
      selectedPreset.value = preset.id
    }
  } catch {
    if (alive) message.value = 'Não foi possível carregar as opções do cadastro. Tente novamente.'
  } finally {
    if (alive) configLoading.value = false
  }
}
function validate(current: number) {
  errors.value = {}
  const form = store.form
  if (current === 1) {
    if (!form.firstName.trim()) errors.value.firstName = 'Informe seu nome.'
    if (!form.lastName.trim()) errors.value.lastName = 'Informe seu sobrenome.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.value.email = 'Informe um e-mail válido.'
    if (form.phone.replace(/\D/g, '').length < 10)
      errors.value.phone = 'Informe um telefone com DDD.'
    if (form.password.length < 6) errors.value.password = 'Use pelo menos 6 caracteres.'
  }
  if (current === 2) {
    if (!form.storeName.trim()) errors.value.storeName = 'Informe o nome do empreendimento.'
    if (!form.segment) errors.value.segment = 'Selecione o segmento.'
    if (!form.employees) errors.value.employees = 'Selecione o tamanho da equipe.'
  }
  if (current === 5 && !form.terms) errors.value.terms = 'Aceite os termos para criar sua conta.'
  if (Object.keys(errors.value).length) {
    void focusError()
    return false
  }
  return true
}
async function review(reset: boolean) {
  const result = await OnboardingRepository.preview({
    version: 1,
    catalogVersion: config.value?.catalogVersion,
    respostas: { ...answers.value },
    ...(reset
      ? {}
      : {
          modulosSelecionados: [...selectedModules.value],
          menusSelecionados: [...selectedMenus.value],
        }),
  })
  if (!alive) return
  preview.value = result
  selectedModules.value = result.modulos
    .filter((module) => module.selecionado && isAppAvailable(module.codigo))
    .map((module) => module.codigo)
  selectedMenus.value = result.menusEfetivos.filter(isAppAvailable)
  reviewedAnswers.value = JSON.stringify(answers.value)
}
async function next() {
  if (busy.value || !validate(step.value)) return
  busy.value = true
  message.value = ''
  try {
    if (step.value === 2) await review(reviewedAnswers.value !== JSON.stringify(answers.value))
    if (step.value === 3) await review(false)
    if (alive) await goTo(Math.min(5, step.value + 1))
  } catch (error: unknown) {
    if (
      isAxiosError<{ code?: string }>(error) &&
      error.response?.status === 409 &&
      error.response.data.code === 'ONBOARDING_CATALOG_CHANGED'
    ) {
      await loadConfig()
      try {
        await review(true)
        await goTo(3)
      } catch {
        preview.value = null
        await goTo(2)
      }
      message.value = 'O catálogo mudou. Revise os módulos e preços atualizados antes de continuar.'
    } else
      message.value =
        'Não foi possível revisar os módulos. Seus dados foram mantidos. Tente novamente.'
  } finally {
    busy.value = false
  }
}
function payload(): CreateConta {
  const form = store.form
  return {
    nome: `${form.firstName.trim()} ${form.lastName.trim()}`,
    cpfCnpj: form.cnpj,
    conta: form.storeName.trim(),
    telefone: form.phone,
    dicasNovidades: form.newsletter,
    email: form.email.trim(),
    senha: form.password,
    funcionarios: Number(form.employees),
    tipo: form.segment,
    indicacao: form.indicacao.trim() || undefined,
    onboarding: {
      version: 1,
      catalogVersion: preview.value?.catalogVersion || config.value?.catalogVersion,
      respostas: { ...answers.value },
      modulosSelecionados: [...selectedModules.value],
      menusSelecionados: [...selectedMenus.value],
      temaPersonalizado: normalizeThemeCustomization(theme.value),
    },
  }
}
async function submit() {
  if (step.value !== 5) return next()
  if (busy.value || !preview.value || !validate(5)) return
  busy.value = true
  message.value = ''
  try {
    await ContaRepository.create(payload())
    store.form.password = ''
    toast.success('Conta criada! Faça login para continuar.')
    await router.push('/login')
  } catch (error: unknown) {
    if (
      isAxiosError<{
        code?: string
        message?: string
        fieldErrors?: Record<string, string | string[]>
      }>(error)
    ) {
      if (
        error.response?.status === 409 &&
        error.response.data.code === 'ONBOARDING_CATALOG_CHANGED'
      ) {
        await loadConfig()
        try {
          await review(true)
        } catch {
          preview.value = null
        }
        await goTo(preview.value ? 3 : 2)
        message.value =
          'O catálogo mudou. Revise os módulos e preços atualizados antes de confirmar.'
      } else {
        message.value =
          error.response?.data.message ||
          'Não foi possível criar a conta. Confira os dados e tente novamente.'
        const fields = error.response?.data.fieldErrors
        if (fields) {
          const aliases: Record<string, string> = {
            nome: 'firstName',
            senha: 'password',
            telefone: 'phone',
            conta: 'storeName',
            tipo: 'segment',
            funcionarios: 'employees',
            cpfCnpj: 'cnpj',
          }
          errors.value = Object.fromEntries(
            Object.entries(fields).map(([key, value]) => [
              aliases[key] || key,
              Array.isArray(value) ? value.join(' ') : value,
            ]),
          )
          const first = Object.keys(errors.value)[0]
          if (first) {
            busy.value = false
            await goTo(['storeName', 'segment', 'employees', 'cnpj'].includes(first) ? 2 : 1)
            await focusError()
          }
        }
      }
    } else
      message.value = 'Não foi possível criar a conta. Seus dados foram mantidos. Tente novamente.'
  } finally {
    busy.value = false
  }
}
onMounted(() => {
  if (typeof route.query.ref === 'string')
    store.form.indicacao = route.query.ref.trim().toUpperCase()
  void loadConfig()
})
onUnmounted(() => {
  alive = false
  store.form.password = ''
})
</script>

<template>
  <main
    class="registration min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[minmax(20rem,.75fr)_minmax(0,1.25fr)]"
  >
    <aside
      class="relative flex flex-col justify-between overflow-hidden bg-[#122b29] p-6 text-white sm:p-10 lg:sticky lg:top-0 lg:h-screen lg:p-12"
    >
      <RouterLink to="/site" class="flex w-fit items-center gap-3 font-semibold"
        ><img src="/imgs/logo.png" alt="" class="h-9 w-9 rounded-lg" />Gestão Fácil</RouterLink
      >
      <div class="relative mb-0 mt-4 max-w-lg lg:my-16">
        <p
          class="mb-4 hidden text-xs font-semibold uppercase tracking-[.2em] text-[#b8e7bc] lg:block"
        >
          Um começo com direção
        </p>
        <h1 class="text-2xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Seu negócio tem um jeito.<br /><span class="text-[#b8e7bc]">Seu sistema também.</span>
        </h1>
        <p class="mt-5 hidden leading-relaxed text-white/70 lg:block">
          Conte como você trabalha. Organize seus módulos e escolha uma identidade para o seu
          painel.
        </p>
        <ol class="mt-8 hidden space-y-5 lg:block">
          <li
            v-for="(label, index) in steps"
            :key="label"
            class="flex items-center gap-3"
            :class="step === index + 1 ? 'text-white' : 'text-white/50'"
          >
            <span
              class="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/30 text-xs"
              ><Check v-if="step > index + 1" class="h-4 w-4" aria-hidden="true" /><template
                v-else
                >{{ index + 1 }}</template
              ></span
            >{{ label }}
          </li>
        </ol>
      </div>
      <p class="hidden text-sm text-white/60 lg:block">
        Você poderá ajustar módulos e aparência depois, nas configurações e na App Store.
      </p>
    </aside>
    <section class="mx-auto w-full max-w-4xl px-5 py-8 sm:px-10 lg:py-12">
      <div class="mb-8 flex items-center justify-between gap-4 text-sm">
        <RouterLink to="/site" class="inline-flex items-center gap-2 text-muted-foreground"
          ><ArrowLeft class="h-4 w-4" aria-hidden="true" />Site</RouterLink
        ><RouterLink to="/login" class="font-medium underline underline-offset-4"
          >Já tenho conta</RouterLink
        >
      </div>
      <p
        class="mb-2 text-xs font-semibold uppercase tracking-widest text-primary"
        aria-live="polite"
      >
        Etapa {{ step }} de 5
      </p>
      <h2
        ref="heading"
        tabindex="-1"
        class="text-3xl font-semibold tracking-tight focus:outline-none"
      >
        {{ steps[step - 1] }}
      </h2>
      <div
        class="mb-7 mt-5 flex gap-2"
        role="progressbar"
        :aria-valuenow="step"
        :aria-valuemin="1"
        :aria-valuemax="5"
        :aria-valuetext="steps[step - 1]"
        aria-label="Progresso do cadastro"
      >
        <span
          v-for="n in 5"
          :key="n"
          class="h-1 flex-1 rounded-full"
          :class="n <= step ? 'bg-primary' : 'bg-muted'"
        />
      </div>
      <div
        v-if="message"
        role="alert"
        class="mb-5 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
      >
        {{ message }}
      </div>
      <div v-if="configLoading" role="status" class="py-8">Carregando opções do cadastro…</div>
      <div v-else-if="!config" class="space-y-4">
        <p>Precisamos carregar o catálogo para preparar sua conta.</p>
        <Button @click="loadConfig">Tentar novamente</Button>
      </div>
      <form v-else ref="formElement" novalidate class="space-y-6" @submit.prevent="submit">
        <fieldset :disabled="busy" class="min-w-0 space-y-5">
          <legend class="sr-only">{{ steps[step - 1] }}</legend>
          <div v-if="step === 1" class="space-y-4">
            <p class="text-sm text-muted-foreground">
              Crie o acesso do responsável pelo empreendimento.
            </p>
            <div class="grid gap-4 sm:grid-cols-2">
              <label
                v-for="field in [
                  { key: 'firstName', label: 'Nome', autocomplete: 'given-name' },
                  { key: 'lastName', label: 'Sobrenome', autocomplete: 'family-name' },
                ]"
                :key="field.key"
                class="block space-y-2"
                ><span class="text-sm font-medium">{{ field.label }}</span
                ><Input :placeholder="field.key === 'firstName' ? 'Seu nome' : 'Seu sobrenome'"
                  :id="field.key"
                  v-model="store.form[field.key as 'firstName' | 'lastName']"
                  :autocomplete="field.autocomplete"
                  :aria-invalid="!!errors[field.key]"
                  :aria-describedby="errors[field.key] ? `${field.key}-error` : undefined"
                /><span
                  v-if="errors[field.key]"
                  :id="`${field.key}-error`"
                  class="block text-sm text-destructive"
                  >{{ errors[field.key] }}</span
                ></label
              >
            </div>
            <label class="block space-y-2"
              ><span class="text-sm font-medium">E-mail</span
              ><Input placeholder="nome@email.com"
                id="email"
                v-model="store.form.email"
                type="email"
                autocomplete="email"
                :aria-invalid="!!errors.email"
                aria-describedby="email-error"
              /><span v-if="errors.email" id="email-error" class="block text-sm text-destructive">{{
                errors.email
              }}</span></label
            >
            <label class="block space-y-2"
              ><span class="text-sm font-medium">Telefone / WhatsApp</span
              ><Input inputmode="tel" placeholder="(00) 00000-0000"
                id="phone"
                v-model="store.form.phone"
                v-maska="phoneMaskOptions"
                type="tel"
                autocomplete="tel"
                :aria-invalid="!!errors.phone"
                aria-describedby="phone-error"
              /><span v-if="errors.phone" id="phone-error" class="block text-sm text-destructive">{{
                errors.phone
              }}</span></label
            >
            <label class="block space-y-2"
              ><span class="text-sm font-medium">Senha</span
              ><Input placeholder="Crie sua senha"
                id="password"
                v-model="store.form.password"
                type="password"
                autocomplete="new-password"
                :aria-invalid="!!errors.password"
                aria-describedby="password-help password-error"
              /><span id="password-help" class="block text-xs text-muted-foreground"
                >Use pelo menos 6 caracteres. Combine letras, números e símbolos.</span
              ><span
                v-if="errors.password"
                id="password-error"
                class="block text-sm text-destructive"
                >{{ errors.password }}</span
              ></label
            >
            <label class="block space-y-2"
              ><span class="text-sm font-medium">Código de indicação (opcional)</span
              ><Input placeholder="Código de indicação, se houver" id="indicacao" v-model="store.form.indicacao" class="uppercase"
            /></label>
          </div>
          <div v-else-if="step === 2" class="space-y-5">
            <label class="block space-y-2"
              ><span class="text-sm font-medium">Nome do empreendimento</span
              ><Input placeholder="Nome da sua empresa"
                id="storeName"
                v-model="store.form.storeName"
                autocomplete="organization"
                :aria-invalid="!!errors.storeName"
                aria-describedby="storeName-error"
              /><span
                v-if="errors.storeName"
                id="storeName-error"
                class="block text-sm text-destructive"
                >{{ errors.storeName }}</span
              ></label
            >
            <div class="grid gap-4 sm:grid-cols-2">
              <label class="block space-y-2"
                ><span class="text-sm font-medium">Segmento</span
                ><select
                  id="segment"
                  v-model="store.form.segment"
                  class="registration-select"
                  :aria-invalid="!!errors.segment"
                  aria-describedby="segment-error"
                >
                  <option value="" disabled>Selecione</option>
                  <option value="moda">Moda e vestuário</option>
                  <option value="eletronicos">Eletrônicos</option>
                  <option value="alimentacao">Alimentação</option>
                  <option value="servicos">Serviços</option>
                  <option value="varejo">Varejo</option>
                  <option value="outros">Outros / negócio híbrido</option></select
                ><span
                  v-if="errors.segment"
                  id="segment-error"
                  class="block text-sm text-destructive"
                  >{{ errors.segment }}</span
                ></label
              ><label class="block space-y-2"
                ><span class="text-sm font-medium">Equipe</span
                ><select
                  id="employees"
                  v-model="store.form.employees"
                  class="registration-select"
                  :aria-invalid="!!errors.employees"
                  aria-describedby="employees-error"
                >
                  <option value="" disabled>Selecione</option>
                  <option value="1">Apenas eu</option>
                  <option value="5">2 a 5 pessoas</option>
                  <option value="10">6 a 10 pessoas</option>
                  <option value="20">Mais de 10 pessoas</option></select
                ><span
                  v-if="errors.employees"
                  id="employees-error"
                  class="block text-sm text-destructive"
                  >{{ errors.employees }}</span
                ></label
              >
            </div>
            <label class="block space-y-2"
              ><span class="text-sm font-medium">CPF ou CNPJ (opcional)</span
              ><Input placeholder="00.000.000/0000-00"
                id="cnpj"
                v-model="store.form.cnpj"
                v-maska="cpfCnpjMaskOptions"
                inputmode="numeric"
                :aria-invalid="!!errors.cnpj"
              /><span v-if="errors.cnpj" class="block text-sm text-destructive">{{
                errors.cnpj
              }}</span></label
            >
            <div class="border-t pt-5">
              <h3 class="font-semibold">Como seu negócio funciona?</h3>
              <p class="mb-4 mt-1 text-sm text-muted-foreground">
                Marque as atividades que fazem parte da sua operação. Você pode combinar várias.
              </p>
              <div class="grid gap-2 sm:grid-cols-2">
                <label
                  v-for="question in questions"
                  :key="question.key"
                  class="flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                  ><input
                    v-model="answers[question.key]"
                    type="checkbox"
                    class="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
                  /><span
                    ><span class="text-sm font-medium">{{ question.label }}</span
                    ><small v-if="question.description" class="mt-1 block text-muted-foreground">{{
                      question.description
                    }}</small></span
                  ></label
                >
              </div>
            </div>
          </div>
          <div v-else-if="step === 3" class="space-y-5">
            <p class="text-sm text-muted-foreground">
              Revise nossa sugestão. Os módulos gratuitos elegíveis serão ativados. Apps pagos ficam
              como recomendações e exigem contratação posterior na App Store.
            </p>
            <section>
              <h3 class="mb-3 font-semibold">Organização do painel</h3>
              <div class="flex flex-wrap gap-2">
                <label
                  v-for="menu in menus"
                  :key="menu"
                  class="flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm"
                  ><input
                    type="checkbox"
                    :checked="selectedMenus.includes(menu)"
                    :disabled="config.baseMenuKeys.includes(menu)"
                    @change="selectedMenus = toggle(selectedMenus, menu, checked($event))"
                  />{{ menuLabel(menu)
                  }}<span
                    v-if="config.baseMenuKeys.includes(menu)"
                    class="text-xs text-muted-foreground"
                    >essencial</span
                  ></label
                >
              </div>
            </section>
            <section>
              <h3 class="mb-3 font-semibold">Apps para sua operação</h3>
              <div class="space-y-3">
                <label
                  v-for="module in modules"
                  :key="module.codigo"
                  class="flex cursor-pointer items-start gap-3 rounded-xl border p-4"
                  ><input
                    type="checkbox"
                    class="mt-1 h-4 w-4"
                    :checked="selectedModules.includes(module.codigo)"
                    :disabled="
                      !config.modules.find((item) => item.codigo === module.codigo)?.status
                    "
                    @change="
                      selectedModules = toggle(selectedModules, module.codigo, checked($event))
                    "
                  /><span class="min-w-0 flex-1"
                    ><strong class="block text-sm">{{ module.name }}</strong
                    ><span class="mt-1 block text-sm text-muted-foreground">{{
                      module.motivo
                    }}</span
                    ><span class="mt-2 block text-xs font-medium">{{
                      module.precoMensal > 0
                        ? `${formatMoney(module.precoMensal)}/mês · contratação posterior`
                        : 'Gratuito · sujeito à disponibilidade do catálogo'
                    }}</span></span
                  ></label
                >
              </div>
            </section>
            <ul v-if="preview?.avisos.length" class="space-y-2 rounded-xl bg-muted p-4 text-sm">
              <li v-for="warning in preview.avisos" :key="warning">{{ warning }}</li>
            </ul>
          </div>
          <div v-else-if="step === 4" class="space-y-6">
            <p class="text-sm text-muted-foreground">
              Escolha uma paleta e uma fonte. A prévia não altera a aparência desta página.
            </p>
            <div class="grid gap-3 sm:grid-cols-2">
              <button
                v-for="preset in config.themePresets"
                :key="preset.id"
                type="button"
                class="flex min-h-16 items-center gap-3 rounded-xl border p-3 text-left focus-visible:ring-2 focus-visible:ring-ring"
                :class="selectedPreset === preset.id ? 'border-primary ring-1 ring-primary' : ''"
                :aria-pressed="selectedPreset === preset.id"
                @click="applyPreset(preset)"
              >
                <span class="flex -space-x-1" aria-hidden="true"
                  ><span
                    v-for="color in [
                      preset.tema.primariaLight,
                      preset.tema.sidebarLight,
                      preset.tema.fundoLight,
                    ]"
                    :key="color"
                    class="h-7 w-7 rounded-full border border-white"
                    :style="{ background: color }" /></span
                ><span class="text-sm font-medium">{{ preset.nome }}</span>
              </button>
            </div>
            <label class="block space-y-2"
              ><span class="text-sm font-medium">Fonte do painel</span
              ><select id="font" v-model="theme.fonte" class="registration-select">
                <option v-for="font in fonts" :key="font.value" :value="font.value">
                  {{ font.label }}
                </option>
              </select></label
            >
            <div class="grid gap-4 sm:grid-cols-2">
              <ThemePreview :theme="theme" mode="light" :name="store.form.storeName" /><ThemePreview
                :theme="theme"
                mode="dark"
                :name="store.form.storeName"
              />
            </div>
          </div>
          <div v-else class="space-y-5">
            <p class="text-sm text-muted-foreground">
              Confira antes de criar sua conta. Nenhum app pago será contratado nesta etapa.
            </p>
            <dl class="space-y-3 rounded-xl border bg-card p-5 text-sm">
              <div>
                <dt class="text-muted-foreground">Responsável</dt>
                <dd class="break-words font-medium">
                  {{ store.form.firstName }} {{ store.form.lastName }} · {{ store.form.email }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Empreendimento</dt>
                <dd class="font-medium">{{ store.form.storeName }}</dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Menus</dt>
                <dd>
                  {{
                    selectedMenus
                      .filter((key) => !key.includes(':'))
                      .map(menuLabel)
                      .join(', ')
                  }}
                </dd>
              </div>
              <div>
                <dt class="text-muted-foreground">Aparência</dt>
                <dd>
                  {{ config.themePresets.find((preset) => preset.id === selectedPreset)?.nome }} ·
                  {{ theme.fonte }}
                </dd>
              </div>
            </dl>
            <ul class="space-y-2 text-sm">
              <li v-for="module in selectedSummary" :key="module.codigo">
                <strong>{{ module.name }}</strong> —
                {{
                  module.acao === 'ATIVAR_GRATUITO'
                    ? 'ativação gratuita'
                    : `recomendado, ${formatMoney(module.precoMensal)}/mês; não contratado`
                }}
              </li>
            </ul>
            <p class="rounded-xl bg-muted p-4 text-sm">
              Teste inicial de 7 dias. O plano e os apps adicionais seguem suas condições
              comerciais. Você poderá revisar sua assinatura dentro do sistema.
            </p>
            <label class="flex items-start gap-3 text-sm"
              ><input
                id="terms"
                v-model="store.form.terms"
                type="checkbox"
                class="mt-1 h-4 w-4"
                :aria-invalid="!!errors.terms"
                aria-describedby="terms-error"
              /><span
                >Li e aceito os
                <RouterLink
                  to="/site/termos-politica"
                  target="_blank"
                  class="underline underline-offset-4"
                  >Termos de Uso e a Política de Privacidade</RouterLink
                >.</span
              ></label
            >
            <p v-if="errors.terms" id="terms-error" class="text-sm text-destructive">
              {{ errors.terms }}
            </p>
            <label class="flex items-start gap-3 text-sm"
              ><input v-model="store.form.newsletter" type="checkbox" class="mt-1 h-4 w-4" /><span
                >Quero receber dicas e novidades por e-mail (opcional).</span
              ></label
            >
          </div>
          <div class="flex flex-wrap justify-between gap-3 border-t pt-5">
            <Button
              v-if="step > 1"
              type="button"
              variant="outline"
              class="min-h-11"
              @click="goTo(step - 1)"
              ><ArrowLeft class="h-4 w-4" aria-hidden="true" />Voltar</Button
            ><Button type="submit" class="ml-auto min-h-11"
              ><Loader2 v-if="busy" class="h-4 w-4 animate-spin" aria-hidden="true" />{{
                busy ? 'Aguarde…' : step === 5 ? 'Criar minha conta' : 'Continuar'
              }}<ArrowRight v-if="!busy && step < 5" class="h-4 w-4" aria-hidden="true"
            /></Button>
          </div>
        </fieldset>
      </form>
    </section>
  </main>
</template>

<style scoped>
.registration {
  --app-font: 'Site Inter';
  font-family: 'Site Inter', sans-serif;
}
.registration h1,
.registration h2 {
  --app-font: 'Site Sora';
  font-family: 'Site Sora', sans-serif;
}
.registration-select {
  @apply flex min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring;
}
</style>
