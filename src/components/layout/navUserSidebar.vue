<script setup lang="ts">
import {
  ChevronsUpDown,
  Cog,
  Crown,
  Image,
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
import ModalUploadPerfil from '@/pages/configs/ModalUploadPerfil.vue'
import { useAuthStore } from '@/stores/login/useAuthStore'
import { useToast } from 'vue-toastification'
import { getLettersName } from '@/utils/formatters'
import { resolveFileUrl } from '@/utils/fileUrl'

const uiStore = useUiStore()
const store = useAuthStore()
const toast = useToast()

onMounted(() => {
  uiStore.setLogoProfile(resolveFileUrl(uiStore.contaInfo.profile, { bustCache: true }))
})

const openModal = () => {
  if (uiStore.permissoes.admin) {
    uiStore.openModalProfile = true
  }
}

function logOut() {
  store.logout()
  toast.info('Logout efetuado com sucesso!')
}

const colorTheme = computed(() => {
  return 'bg-black/10 text-sidebar-foreground'
})
</script>

<template>
  <div>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <div size="lg" class="text-white cursor-pointer flex gap-2 items-center px-3 py-3 rounded-lg"
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
      <DropdownMenuContent class="min-w-56 rounded-lg border-white/10 bg-sidebar text-sidebar-foreground"
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
        <DropdownMenuSeparator class="bg-white/15" />
        <DropdownMenuGroup>
          <RouterLink to="/assinatura/resumo">
            <DropdownMenuItem>
              <Sparkles />
              Assinatura
            </DropdownMenuItem>
          </RouterLink>
        </DropdownMenuGroup>
        <DropdownMenuSeparator class="bg-white/15" />
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
          <DropdownMenuItem @click="openModal">
            <Image />
            Foto do perfil
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator class="bg-white/15" />
        <DropdownMenuItem @click="logOut">
          <LogOut />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <ModalUploadPerfil />
  </div>
</template>
