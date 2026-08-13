<script setup lang="ts">
import {
  ChevronsUpDown,
  Cog,
  Crown,
  LogOut,
  Sparkles,
} from 'lucide-vue-next'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUiStore } from '@/stores/ui/uiStore'
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/login/useAuthStore'
import { useToast } from 'vue-toastification'
import { getLettersName } from '@/utils/formatters'
import { resolveFileUrl } from '@/utils/fileUrl'

const props = withDefaults(defineProps<{ variant?: 'sidebar' | 'header' | 'icon' | 'sidev2' }>(), {
  variant: 'sidebar',
})
const uiStore = useUiStore()
const store = useAuthStore()
const toast = useToast()

onMounted(() => {
  uiStore.setLogoProfile(resolveFileUrl(uiStore.contaInfo.profile, { bustCache: true }))
})

function logOut() {
  store.logout()
  toast.info('Logout efetuado com sucesso!')
}

const colorTheme = computed(() => {
  return props.variant === 'header' || props.variant === 'icon'
    ? 'border border-border bg-muted/75 text-foreground dark:text-foreground shadow-sm hover:bg-muted'
    : props.variant === 'sidev2'
    ? 'text-foreground dark:text-foreground'
    : 'text-dark:text-foreground dark:text-foreground'
})

const dropdownTheme = computed(() =>
  props.variant === 'header' || props.variant === 'icon'
    ? 'border-border bg-popover text-popover-foreground'
    : 'border-white/10 bg-sidebar text-sidebar-foreground',
)

const separatorTheme = computed(() =>
  props.variant === 'sidebar' ? 'bg-white/15' : 'bg-border',
)
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <button
          v-if="props.variant === 'icon'"
          type="button"
          class="grid h-10 w-10 cursor-pointer place-items-center rounded-lg"
          :class="colorTheme"
          aria-label="Abrir menu da conta"
        >
          <Avatar class="h-8 w-8 rounded-lg">
            <AvatarImage :src="uiStore.logoProfile" :alt="uiStore.contaInfo.nome" />
            <AvatarFallback class="rounded-lg">
              {{ getLettersName(uiStore.contaInfo.nome) }}
            </AvatarFallback>
          </Avatar>
        </button>
        <div v-else size="lg" class="cursor-pointer flex gap-2 items-center px-3 py-3 rounded-lg"
          :class="colorTheme">
          <Avatar class="h-8 w-8 rounded-lg">
            <AvatarImage :src="uiStore.logoProfile" :alt="uiStore.contaInfo.nome" />
            <AvatarFallback class="rounded-lg">
              {{ getLettersName(uiStore.contaInfo.nome) }}
            </AvatarFallback>
          </Avatar>
          <div class="grid flex-1 text-left text-sm leading-tight">
            <span class="truncate font-medium">{{ uiStore.contaInfo.nome }}</span>
            <span class="truncate text-xs">{{ uiStore.usuarioLogged.email }}</span>
          </div>
          <ChevronsUpDown class="ml-auto size-4" />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent :class="['min-w-56 rounded-lg', dropdownTheme]"
        :side="uiStore.isMobile ? 'bottom' : 'right'">
        <DropdownMenuLabel class="p-0 font-normal">
          <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage :src="uiStore.logoProfile" :alt="uiStore.contaInfo.nome" />
              <AvatarFallback class="rounded-lg">
                {{ getLettersName(uiStore.usuarioLogged.nome) }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">{{ uiStore.usuarioLogged.nome }}</span>
              <span class="truncate text-xs">Permissão: {{ uiStore.usuarioLogged.permissao }}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator :class="separatorTheme" />
        <DropdownMenuGroup>
          <RouterLink to="/assinatura/resumo">
            <DropdownMenuItem>
              <Sparkles />
              Assinatura
            </DropdownMenuItem>
          </RouterLink>
        </DropdownMenuGroup>
        <DropdownMenuSeparator :class="separatorTheme" />
        <DropdownMenuGroup>
          <RouterLink v-if="uiStore.permissoes.superadmin" to="/admin">
            <DropdownMenuItem>
              <Crown />
              Modo CEO
            </DropdownMenuItem>
          </RouterLink>
          <RouterLink to="/configuracoes">
            <DropdownMenuItem>
              <Cog />
              Configurações
            </DropdownMenuItem>
          </RouterLink>
        </DropdownMenuGroup>
        <DropdownMenuSeparator :class="separatorTheme" />
        <DropdownMenuItem @click="logOut">
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>
</template>
