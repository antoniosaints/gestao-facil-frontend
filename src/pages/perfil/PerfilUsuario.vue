<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import {
  Camera as CameraIcon,
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  MapPin,
  Menu,
  PenLine,
  Phone,
  ShieldCheck,
  Undo2,
  UserRound,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { UsuarioRepository } from '@/repositories/usuario-repository'
import IndicacaoPanel from '@/components/indicacao/IndicacaoPanel.vue'
import { useUiStore } from '@/stores/ui/uiStore'
import type { Usuarios } from '@/types/schemas'
import { resolveFileUrl } from '@/utils/fileUrl'
import { goBack } from '@/hooks/links'

const storeUi = useUiStore()
const toast = useToast()
const defaultAvatar = '/imgs/logo.png'

const activeTab = ref('pessoal')
const profileLoading = ref(false)
const passwordLoading = ref(false)
const avatarUploading = ref(false)
const avatarPreviewUrl = ref<string | null>(null)
const avatarVersion = ref(0)
const avatarInput = ref<HTMLInputElement | null>(null)

const usuarioProfile = ref<Partial<Usuarios>>({
  ...storeUi.usuarioLogged,
})

const password = reactive({
  current: '',
  next: '',
  confirm: '',
})

const showPassword = reactive({
  current: false,
  next: false,
  confirm: false,
})

watch(
  () => storeUi.usuarioLogged,
  (value) => {
    usuarioProfile.value = { ...value }
  },
  { deep: true },
)

const userInitials = computed(() => {
  const nome = storeUi.usuarioLogged.nome?.trim()
  if (!nome) return 'GF'
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
})

const avatarUrl = computed(() => {
  if (avatarPreviewUrl.value) {
    return avatarPreviewUrl.value
  }

  const source = resolveFileUrl(usuarioProfile.value.profile || storeUi.usuarioLogged.profile, {
    fallback: defaultAvatar,
  })

  if (!avatarVersion.value) {
    return source
  }

  const separator = source.includes('?') ? '&' : '?'
  return `${source}${separator}_t=${avatarVersion.value}`
})

const profileCompletion = computed(() => {
  const fields = [
    usuarioProfile.value.nome,
    usuarioProfile.value.email,
    usuarioProfile.value.telefone,
    usuarioProfile.value.endereco,
    usuarioProfile.value.biografia,
    usuarioProfile.value.profile,
  ]

  const filled = fields.filter((value) => String(value ?? '').trim().length > 0).length
  return Math.round((filled / fields.length) * 100)
})

const biographyLength = computed(() => usuarioProfile.value.biografia?.trim().length ?? 0)

const passwordChecks = computed(() => [
  {
    label: 'Senha atual informada',
    valid: password.current.trim().length > 0,
  },
  {
    label: 'Nova senha com pelo menos 6 caracteres',
    valid: password.next.trim().length >= 6,
  },
  {
    label: 'Nova senha diferente da atual',
    valid: password.next.trim().length > 0 && password.next !== password.current,
  },
  {
    label: 'Confirmação igual à nova senha',
    valid: password.confirm.trim().length > 0 && password.confirm === password.next,
  },
])

const passwordStrength = computed(() => {
  const value = password.next.trim()
  if (!value) {
    return {
      label: 'Aguardando nova senha',
      className: 'text-muted-foreground',
      meterClass: 'w-0 bg-border',
    }
  }

  const score = [value.length >= 6, /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value)].filter(Boolean).length

  if (score <= 1) {
    return {
      label: 'Força baixa',
      className: 'text-rose-600 dark:text-rose-400',
      meterClass: 'w-1/3 bg-rose-500',
    }
  }

  if (score <= 3) {
    return {
      label: 'Força média',
      className: 'text-amber-600 dark:text-amber-400',
      meterClass: 'w-2/3 bg-amber-500',
    }
  }

  return {
    label: 'Força alta',
    className: 'text-emerald-600 dark:text-emerald-400',
    meterClass: 'w-full bg-emerald-500',
  }
})

const canSubmitPassword = computed(() => passwordChecks.value.every((item) => item.valid))

function openAvatarInput() {
  if (avatarUploading.value) return
  avatarInput.value?.click()
}

function resetAvatarPreview() {
  if (avatarPreviewUrl.value?.startsWith('blob:')) {
    URL.revokeObjectURL(avatarPreviewUrl.value)
  }
  avatarPreviewUrl.value = null
}

onBeforeUnmount(() => {
  resetAvatarPreview()
})

function getErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as { response?: { data?: { message?: string } } }
  return axiosError.response?.data?.message || fallback
}

async function onAvatarChange(event: Event) {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  const file = input.files[0]

  if (file.size > 2 * 1024 * 1024) {
    toast.error('A imagem deve ter no máximo 2MB.')
    input.value = ''
    return
  }

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast.error('A imagem deve estar no formato JPEG, PNG ou WebP.')
    input.value = ''
    return
  }

  resetAvatarPreview()
  avatarPreviewUrl.value = URL.createObjectURL(file)
  avatarUploading.value = true

  try {
    await UsuarioRepository.uploadProfileImage(file)
    await storeUi.getDataUsuario()
    usuarioProfile.value = { ...storeUi.usuarioLogged }
    avatarVersion.value = Date.now()
    toast.success('Foto do perfil atualizada com sucesso.')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Erro ao atualizar a foto do perfil.'))
  } finally {
    avatarUploading.value = false
    resetAvatarPreview()
    input.value = ''
  }
}

function resetPasswordForm() {
  password.current = ''
  password.next = ''
  password.confirm = ''
}

async function changePassword() {
  if (!canSubmitPassword.value) {
    toast.warning('Revise os campos da nova senha antes de continuar.')
    return
  }

  passwordLoading.value = true

  try {
    await UsuarioRepository.updatePassword({
      senhaAtual: password.current,
      novaSenha: password.next,
      confirmarSenha: password.confirm,
    })

    resetPasswordForm()
    toast.success('Senha atualizada com sucesso.')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Erro ao atualizar a senha.'))
  } finally {
    passwordLoading.value = false
  }
}

async function saveProfile() {
  profileLoading.value = true

  try {
    await UsuarioRepository.updateProfile({
      nome: usuarioProfile.value.nome,
      telefone: usuarioProfile.value.telefone,
      biografia: usuarioProfile.value.biografia,
      endereco: usuarioProfile.value.endereco,
      profile: usuarioProfile.value.profile,
    })

    await storeUi.getDataUsuario()
    toast.success('Perfil atualizado com sucesso.')
  } catch (error) {
    toast.error(getErrorMessage(error, 'Erro ao atualizar o perfil.'))
  } finally {
    profileLoading.value = false
  }
}
</script>

<template>
  <div class="container mx-auto space-y-6 pb-24 md:pb-6">
    <div class="flex items-start justify-between flex-col md:flex-row md:items-center">
      <div>
        <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UserRound class="h-6 w-6" :stroke-width="2.5" />
          Meu perfil
        </h1>
        <p class="text-muted-foreground">Seus dados pessoais, foto e senha de acesso.</p>
      </div>
    </div>

    <!-- Identidade do usuário -->
    <Card class="bg-background">
      <CardContent class="p-6">
        <div class="flex flex-col gap-6 md:flex-row md:items-start">
          <div class="flex flex-col items-center gap-3">
            <div class="relative">
              <Avatar class="h-24 w-24 rounded-xl border border-border">
                <AvatarImage :src="avatarUrl" alt="Foto do usuário" />
                <AvatarFallback class="rounded-xl text-xl">{{ userInitials }}</AvatarFallback>
              </Avatar>
              <button type="button"
                class="absolute -bottom-1 -right-1 rounded-full border border-border bg-card p-2 text-primary shadow-sm transition hover:bg-muted disabled:cursor-wait"
                :disabled="avatarUploading" v-tooltip="'Alterar foto'" @click="openAvatarInput">
                <LoaderCircle v-if="avatarUploading" class="h-4 w-4 animate-spin" />
                <CameraIcon v-else class="h-4 w-4" />
              </button>
            </div>

            <input ref="avatarInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden"
              @change="onAvatarChange" />

            <p class="text-center text-xs text-muted-foreground">JPG, PNG ou WebP · até 2 MB</p>
          </div>

          <div class="min-w-0 flex-1 space-y-3">
            <div class="min-w-0">
              <h2 class="truncate text-xl font-semibold text-foreground">
                {{ storeUi.usuarioLogged.nome || 'Usuário' }}
              </h2>
              <p class="truncate text-sm text-muted-foreground">{{ storeUi.contaInfo.nome || '—' }}</p>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <ShieldCheck class="h-3.5 w-3.5" /> {{ storeUi.usuarioLogged.permissao || '—' }}
              </span>
              <span
                class="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                <Mail class="h-3.5 w-3.5" /> {{ storeUi.usuarioLogged.email || '—' }}
              </span>
            </div>

            <div class="grid gap-3 sm:grid-cols-3">
              <div class="rounded-lg border border-border bg-body/60 p-3">
                <p class="text-xs text-muted-foreground">Perfil preenchido</p>
                <p class="text-sm font-semibold text-foreground">{{ profileCompletion }}%</p>
                <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div class="h-full rounded-full bg-primary transition-all"
                    :style="{ width: `${profileCompletion}%` }" />
                </div>
              </div>
              <div class="rounded-lg border border-border bg-body/60 p-3">
                <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Phone class="h-3.5 w-3.5" /> Telefone
                </p>
                <p class="truncate text-sm font-semibold text-foreground">
                  {{ usuarioProfile.telefone || 'Não informado' }}
                </p>
              </div>
              <div class="rounded-lg border border-border bg-body/60 p-3">
                <p class="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin class="h-3.5 w-3.5" /> Endereço
                </p>
                <p class="truncate text-sm font-semibold text-foreground">
                  {{ usuarioProfile.endereco || 'Não informado' }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <IndicacaoPanel />

    <Tabs v-model="activeTab" class="w-auto">
      <div class="overflow-auto max-w-full">
        <TabsList class="grid w-max grid-cols-2 border">
          <TabsTrigger value="pessoal" class="flex items-center">
            <UserRound class="inline-flex mr-1 h-5 w-5" /> Dados pessoais
          </TabsTrigger>
          <TabsTrigger value="seguranca" class="flex items-center">
            <ShieldCheck class="inline-flex mr-1 h-5 w-5" /> Segurança
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="pessoal">
        <Card class="rounded-t-none bg-background">
          <CardHeader>
            <CardTitle class="font-normal flex items-center gap-2">
              <PenLine class="w-5 h-5 text-primary" /> Informações do perfil
            </CardTitle>
            <CardDescription>Dados que aparecem para você e para o restante do time.</CardDescription>
          </CardHeader>

          <form @submit.prevent="saveProfile">
            <CardContent class="space-y-6">
              <div class="grid md:grid-cols-2 gap-4">
                <div class="space-y-2 md:col-span-2">
                  <Label for="nome">Nome completo</Label>
                  <Input id="nome" v-model="usuarioProfile.nome" placeholder="Ex.: Antonio Silva Ferreira" />
                </div>

                <div class="space-y-2">
                  <Label for="email">E-mail</Label>
                  <Input id="email" :model-value="usuarioProfile.email" type="email" disabled
                    placeholder="seuemail@empresa.com" />
                  <p class="text-xs text-muted-foreground">O e-mail de acesso é alterado pelo administrador da conta.</p>
                </div>

                <div class="space-y-2">
                  <Label for="telefone">Telefone</Label>
                  <Input id="telefone" v-model="usuarioProfile.telefone" placeholder="Ex.: (11) 99999-1234" />
                </div>

                <div class="space-y-2 md:col-span-2">
                  <Label for="endereco">Endereço</Label>
                  <Input id="endereco" v-model="usuarioProfile.endereco"
                    placeholder="Ex.: Rua das Flores, 120 - Centro - Belo Horizonte" />
                </div>
              </div>

              <Separator />

              <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <Label for="biografia">Biografia</Label>
                  <span class="text-xs text-muted-foreground">{{ biographyLength }}/240</span>
                </div>
                <Textarea id="biografia" v-model="usuarioProfile.biografia" rows="5" maxlength="240"
                  placeholder="Ex.: Responsável pelo financeiro, conferência diária de caixa e fechamento do mês." />
                <p class="text-xs text-muted-foreground">
                  Use a biografia para contextualizar sua função, responsabilidades ou preferências operacionais.
                </p>
              </div>
            </CardContent>

            <CardFooter class="justify-end">
              <Button :disabled="profileLoading" type="submit" class="ml-2 text-white">
                <CircleCheck v-if="!profileLoading" />
                <LoaderCircle v-else class="animate-spin" />
                {{ profileLoading ? 'Salvando...' : 'Salvar' }}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      <TabsContent value="seguranca">
        <Card class="rounded-t-none bg-background">
          <CardHeader>
            <CardTitle class="font-normal flex items-center gap-2">
              <ShieldCheck class="w-5 h-5 text-primary" /> Segurança da conta
            </CardTitle>
            <CardDescription>
              Informe a senha atual, defina uma nova combinação e confirme antes de salvar.
            </CardDescription>
          </CardHeader>

          <form @submit.prevent="changePassword">
            <CardContent class="space-y-6">
              <div class="grid gap-4 md:grid-cols-2">
                <div class="space-y-2 md:col-span-2">
                  <Label for="current-password">Senha atual</Label>
                  <div class="relative">
                    <Input id="current-password" v-model="password.current"
                      :type="showPassword.current ? 'text' : 'password'" placeholder="Digite sua senha atual"
                      class="pr-11" />
                    <Button type="button" variant="ghost" size="icon"
                      class="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                      v-tooltip="showPassword.current ? 'Ocultar senha' : 'Mostrar senha'"
                      @click="showPassword.current = !showPassword.current">
                      <Eye v-if="!showPassword.current" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="new-password">Nova senha</Label>
                  <div class="relative">
                    <Input id="new-password" v-model="password.next" :type="showPassword.next ? 'text' : 'password'"
                      placeholder="Pelo menos 6 caracteres" class="pr-11" />
                    <Button type="button" variant="ghost" size="icon"
                      class="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                      v-tooltip="showPassword.next ? 'Ocultar senha' : 'Mostrar senha'"
                      @click="showPassword.next = !showPassword.next">
                      <Eye v-if="!showPassword.next" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div class="space-y-2">
                  <Label for="confirm-password">Confirmar nova senha</Label>
                  <div class="relative">
                    <Input id="confirm-password" v-model="password.confirm"
                      :type="showPassword.confirm ? 'text' : 'password'" placeholder="Repita exatamente a nova senha"
                      class="pr-11" />
                    <Button type="button" variant="ghost" size="icon"
                      class="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                      v-tooltip="showPassword.confirm ? 'Ocultar senha' : 'Mostrar senha'"
                      @click="showPassword.confirm = !showPassword.confirm">
                      <Eye v-if="!showPassword.confirm" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div class="grid gap-4 md:grid-cols-2">
                <div class="rounded-lg border bg-body/70 p-3 px-4">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-medium">Força da senha</span>
                    <span class="text-sm font-semibold" :class="passwordStrength.className">
                      {{ passwordStrength.label }}
                    </span>
                  </div>
                  <div class="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div class="h-full rounded-full transition-all" :class="passwordStrength.meterClass" />
                  </div>
                  <p class="mt-3 text-xs text-muted-foreground">
                    A sessão atual continua ativa após a troca, mas qualquer senha antiga deixa de valer imediatamente.
                  </p>
                </div>

                <div class="rounded-lg border bg-body/70 p-3 px-4">
                  <p class="text-sm font-medium">Checklist antes de salvar</p>
                  <ul class="mt-3 space-y-2">
                    <li v-for="item in passwordChecks" :key="item.label" class="flex items-start gap-2 text-sm">
                      <CheckCircle2 v-if="item.valid" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <CircleAlert v-else class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <span :class="item.valid ? 'text-foreground' : 'text-muted-foreground'">{{ item.label }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>

            <CardFooter class="justify-end">
              <Button type="button" variant="outline" @click="resetPasswordForm">Limpar campos</Button>
              <Button type="submit" class="ml-2 text-white" :disabled="passwordLoading || !canSubmitPassword">
                <KeyRound v-if="!passwordLoading" class="h-4 w-4" />
                <LoaderCircle v-else class="animate-spin" />
                {{ passwordLoading ? 'Atualizando...' : 'Atualizar senha' }}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>

    <nav v-if="storeUi.isMobile"
      class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20">
      <button type="button" @click="storeUi.openSidebar = true"
        class="flex flex-col items-center text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
        <Menu />
        <span class="text-xs">Menu</span>
      </button>
      <button type="button" @click="goBack"
        class="flex flex-col items-center text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
        <Undo2 />
        <span class="text-xs">Voltar</span>
      </button>
    </nav>
  </div>
</template>
