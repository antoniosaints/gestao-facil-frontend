<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import {
  Camera as CameraIcon,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  KeyRound,
  LoaderCircle,
  Mail,
  MapPin,
  Menu,
  PenLine,
  Phone,
  Save as SaveIcon,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-vue-next'
import { useToast } from 'vue-toastification'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { UsuarioRepository } from '@/repositories/usuario-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import type { Usuarios } from '@/types/schemas'
import { resolveFileUrl } from '@/utils/fileUrl'

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
  <div class="mx-auto max-w-7xl space-y-6 p-4 pb-20 md:p-8 md:pb-8">
    <section class="relative overflow-hidden rounded-[28px] border border-border/70 bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-6 shadow-sm">
      <div class="absolute -right-10 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
      <div class="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

      <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-col gap-5 md:flex-row md:items-center">
          <div class="relative w-fit">
            <button
              type="button"
              class="group relative rounded-full focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-wait"
              :disabled="avatarUploading"
              @click="openAvatarInput"
            >
              <Avatar class="h-24 w-24 border-4 border-background shadow-lg md:h-28 md:w-28">
                <AvatarImage :src="avatarUrl" alt="Avatar do usuário" />
                <AvatarFallback class="bg-primary/10 text-lg font-semibold text-primary">
                  {{ userInitials }}
                </AvatarFallback>
              </Avatar>
              <div class="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 opacity-0 transition-opacity group-hover:opacity-100 group-disabled:opacity-100">
                <LoaderCircle v-if="avatarUploading" class="h-7 w-7 animate-spin text-white" />
                <CameraIcon v-else class="h-7 w-7 text-white" />
              </div>
            </button>

            <input ref="avatarInput" type="file" accept="image/jpeg,image/png,image/webp" class="hidden" @change="onAvatarChange" />
          </div>

          <div class="space-y-3">
            <div>
              <p class="text-sm font-medium uppercase tracking-[0.24em] text-primary/80">Minha conta</p>
              <h1 class="mt-1 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
                {{ storeUi.usuarioLogged.nome }}
              </h1>
              <p class="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Atualize seus dados pessoais, organize como sua conta aparece no sistema e mantenha a senha sob controle em um fluxo mais claro.
              </p>
            </div>

            <div class="flex flex-wrap gap-2">
              <Badge variant="outline" class="gap-2 rounded-full px-3 py-1 text-xs">
                <ShieldCheck class="h-3.5 w-3.5" />
                {{ storeUi.usuarioLogged.permissao }}
              </Badge>
              <Badge variant="outline" class="gap-2 rounded-full px-3 py-1 text-xs">
                <Mail class="h-3.5 w-3.5" />
                {{ storeUi.usuarioLogged.email }}
              </Badge>
            </div>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-3 lg:w-[420px]">
          <div class="rounded-2xl border bg-background/80 p-4 backdrop-blur-sm">
            <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Perfil</p>
            <p class="mt-2 text-2xl font-semibold text-foreground">{{ profileCompletion }}%</p>
            <p class="mt-1 text-xs text-muted-foreground">Campos principais preenchidos.</p>
          </div>
          <div class="rounded-2xl border bg-background/80 p-4 backdrop-blur-sm">
            <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Senha</p>
            <p class="mt-2 text-sm font-semibold text-foreground">Proteção ativa</p>
            <p class="mt-1 text-xs text-muted-foreground">Atualize quando precisar revogar acessos antigos.</p>
          </div>
          <div class="rounded-2xl border bg-background/80 p-4 backdrop-blur-sm">
            <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Avatar</p>
            <p class="mt-2 text-sm font-semibold text-foreground">Foto opcional</p>
            <p class="mt-1 text-xs text-muted-foreground">Clique na imagem para trocar a prévia.</p>
          </div>
        </div>
      </div>
    </section>

    <div class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="space-y-6">
        <Card class="overflow-hidden border-border/70 shadow-sm">
          <CardHeader class="pb-4">
            <CardTitle class="flex items-center gap-2 text-lg">
              <Sparkles class="h-5 w-5 text-primary" />
              Resumo do perfil
            </CardTitle>
            <CardDescription>
              Um panorama rápido do que já está configurado na sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between text-sm">
                <span class="text-muted-foreground">Preenchimento</span>
                <span class="font-medium text-foreground">{{ profileCompletion }}%</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-muted">
                <div class="h-full rounded-full bg-primary transition-all" :style="{ width: `${profileCompletion}%` }" />
              </div>
            </div>

            <div class="grid gap-3">
              <div class="rounded-2xl border bg-muted/25 p-3">
                <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                  <UserRound class="h-4 w-4 text-primary" />
                  Nome público
                </div>
                <p class="mt-1 text-sm text-muted-foreground">{{ usuarioProfile.nome || 'Não informado' }}</p>
              </div>

              <div class="rounded-2xl border bg-muted/25 p-3">
                <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Phone class="h-4 w-4 text-primary" />
                  Telefone
                </div>
                <p class="mt-1 text-sm text-muted-foreground">{{ usuarioProfile.telefone || 'Adicione um telefone para contato rápido.' }}</p>
              </div>

              <div class="rounded-2xl border bg-muted/25 p-3">
                <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MapPin class="h-4 w-4 text-primary" />
                  Endereço
                </div>
                <p class="mt-1 text-sm text-muted-foreground">{{ usuarioProfile.endereco || 'Nenhum endereço cadastrado.' }}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/70 shadow-sm">
          <CardHeader class="pb-4">
            <CardTitle class="flex items-center gap-2 text-lg">
              <ShieldCheck class="h-5 w-5 text-primary" />
              Segurança rápida
            </CardTitle>
            <CardDescription>
              Verifique o básico antes de trocar sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-3 text-sm">
            <div class="flex items-start gap-3 rounded-2xl border bg-muted/20 p-3">
              <CheckCircle2 class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
              <p class="text-muted-foreground">Use uma senha diferente da atual e evite repetir combinações que você usa em outros sistemas.</p>
            </div>
            <div class="flex items-start gap-3 rounded-2xl border bg-muted/20 p-3">
              <CircleAlert class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p class="text-muted-foreground">Ao concluir a troca, mantenha a nova senha salva no seu gerenciador para não depender de memória.</p>
            </div>
            <Button variant="outline" class="w-full justify-center gap-2" @click="activeTab = 'seguranca'">
              <KeyRound class="h-4 w-4" />
              Abrir painel de senha
            </Button>
          </CardContent>
        </Card>
      </aside>

      <main class="min-w-0">
        <Tabs v-model="activeTab" default-value="pessoal" class="space-y-4">
          <TabsList class="grid h-auto w-full grid-cols-2 rounded-2xl bg-muted/60 p-1">
            <TabsTrigger value="pessoal" class="rounded-xl py-2.5">Dados pessoais</TabsTrigger>
            <TabsTrigger value="seguranca" class="rounded-xl py-2.5">Segurança</TabsTrigger>
          </TabsList>

          <TabsContent value="pessoal" class="space-y-4">
            <Card class="border-border/70 shadow-sm">
              <CardHeader class="gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle class="flex items-center gap-2 text-xl">
                    <PenLine class="h-5 w-5 text-primary" />
                    Informações do perfil
                  </CardTitle>
                  <CardDescription class="mt-1 max-w-2xl">
                    Atualize os dados que aparecem para você e para o time. Os placeholders já indicam o formato esperado em cada campo.
                  </CardDescription>
                </div>
                <Badge variant="outline" class="rounded-full px-3 py-1 text-xs">
                  {{ biographyLength }}/240 caracteres na biografia
                </Badge>
              </CardHeader>

              <CardContent class="grid gap-6">
                <div class="grid gap-4 md:grid-cols-2">
                  <div class="grid gap-2 md:col-span-2">
                    <Label htmlFor="nome">Nome completo</Label>
                    <Input id="nome" v-model="usuarioProfile.nome" placeholder="Ex.: Antonio Silva Ferreira" />
                  </div>

                  <div class="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      :model-value="usuarioProfile.email"
                      type="email"
                      disabled
                      class="bg-muted/70"
                      placeholder="seuemail@empresa.com"
                    />
                  </div>

                  <div class="grid gap-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" v-model="usuarioProfile.telefone" placeholder="Ex.: (11) 99999-1234" />
                  </div>

                  <div class="grid gap-2 md:col-span-2">
                    <Label htmlFor="endereco">Endereço</Label>
                    <Input id="endereco" v-model="usuarioProfile.endereco" placeholder="Ex.: Rua das Flores, 120 • Centro • Belo Horizonte" />
                  </div>
                </div>

                <div class="grid gap-2">
                  <Label htmlFor="biografia">Biografia</Label>
                  <Textarea
                    id="biografia"
                    v-model="usuarioProfile.biografia"
                    rows="5"
                    maxlength="240"
                    placeholder="Ex.: Responsável pelo financeiro, conferência diária de caixa e fechamento do mês."
                  />
                  <p class="text-xs text-muted-foreground">
                    Use a biografia para contextualizar sua função, responsabilidades ou preferências operacionais.
                  </p>
                </div>
              </CardContent>

              <CardFooter class="flex flex-col gap-3 border-t bg-muted/20 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm text-muted-foreground">
                  A foto do perfil é enviada na hora; nome, telefone, endereço e biografia continuam sendo salvos aqui.
                </p>
                <Button class="gap-2" :disabled="profileLoading" @click="saveProfile">
                  <SaveIcon class="h-4 w-4" />
                  {{ profileLoading ? 'Salvando...' : 'Salvar alterações' }}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="seguranca" class="space-y-4">
            <Card class="border-border/70 shadow-sm">
              <CardHeader class="gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle class="flex items-center gap-2 text-xl">
                    <ShieldCheck class="h-5 w-5 text-primary" />
                    Segurança da conta
                  </CardTitle>
                  <CardDescription class="mt-1 max-w-2xl">
                    Informe a senha atual, defina uma nova combinação e confirme antes de salvar. O painel abaixo mostra em tempo real o que ainda falta.
                  </CardDescription>
                </div>
                <div class="min-w-[180px] rounded-2xl border bg-muted/30 p-3">
                  <p class="text-xs uppercase tracking-[0.2em] text-muted-foreground">Força da senha</p>
                  <p class="mt-2 text-sm font-semibold" :class="passwordStrength.className">{{ passwordStrength.label }}</p>
                  <div class="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                    <div class="h-full rounded-full transition-all" :class="passwordStrength.meterClass" />
                  </div>
                </div>
              </CardHeader>

              <CardContent class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                <div class="space-y-4">
                  <div class="grid gap-2">
                    <Label htmlFor="current-password">Senha atual</Label>
                    <div class="relative">
                      <Input
                        id="current-password"
                        v-model="password.current"
                        :type="showPassword.current ? 'text' : 'password'"
                        placeholder="Digite sua senha atual"
                        class="pr-11"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        class="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                        @click="showPassword.current = !showPassword.current"
                      >
                        <Eye v-if="!showPassword.current" class="h-4 w-4" />
                        <EyeOff v-else class="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div class="grid gap-4 md:grid-cols-2">
                    <div class="grid gap-2">
                      <Label htmlFor="new-password">Nova senha</Label>
                      <div class="relative">
                        <Input
                          id="new-password"
                          v-model="password.next"
                          :type="showPassword.next ? 'text' : 'password'"
                          placeholder="Crie uma senha com pelo menos 6 caracteres"
                          class="pr-11"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          class="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                          @click="showPassword.next = !showPassword.next"
                        >
                          <Eye v-if="!showPassword.next" class="h-4 w-4" />
                          <EyeOff v-else class="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div class="grid gap-2">
                      <Label htmlFor="confirm-password">Confirmar nova senha</Label>
                      <div class="relative">
                        <Input
                          id="confirm-password"
                          v-model="password.confirm"
                          :type="showPassword.confirm ? 'text' : 'password'"
                          placeholder="Repita exatamente a nova senha"
                          class="pr-11"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          class="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                          @click="showPassword.confirm = !showPassword.confirm"
                        >
                          <Eye v-if="!showPassword.confirm" class="h-4 w-4" />
                          <EyeOff v-else class="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-2xl border bg-muted/20 p-4 text-sm text-muted-foreground">
                    A sessão atual continua ativa após a troca, mas qualquer senha antiga deixa de ser válida imediatamente.
                  </div>
                </div>

                <div class="rounded-3xl border bg-muted/20 p-4">
                  <p class="text-sm font-semibold text-foreground">Checklist antes de salvar</p>
                  <div class="mt-4 space-y-3">
                    <div
                      v-for="item in passwordChecks"
                      :key="item.label"
                      class="flex items-start gap-3 rounded-2xl border bg-background/70 p-3"
                    >
                      <CheckCircle2 v-if="item.valid" class="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <CircleAlert v-else class="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                      <p :class="item.valid ? 'text-foreground' : 'text-muted-foreground'" class="text-sm">
                        {{ item.label }}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>

              <CardFooter class="flex flex-col gap-3 border-t bg-muted/20 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-sm text-muted-foreground">
                  Quanto mais exclusiva for a nova senha, menor a chance de acesso indevido.
                </p>
                <div class="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button variant="outline" @click="resetPasswordForm">Limpar campos</Button>
                  <Button class="gap-2" :disabled="passwordLoading || !canSubmitPassword" @click="changePassword">
                    <KeyRound class="h-4 w-4" />
                    {{ passwordLoading ? 'Atualizando...' : 'Atualizar senha' }}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>

    <nav
      v-if="storeUi.isMobile"
      class="fixed bottom-0 left-0 z-20 flex h-20 w-full justify-around border-t border-border bg-card pt-4 shadow-lg dark:border-border-dark dark:bg-card-dark md:hidden"
    >
      <button
        type="button"
        class="flex flex-col items-center text-gray-700 transition hover:text-primary dark:text-gray-300"
        @click="storeUi.openSidebar = true"
      >
        <Menu class="h-5 w-5" />
        <span class="text-xs">Menu</span>
      </button>
    </nav>
  </div>
</template>
