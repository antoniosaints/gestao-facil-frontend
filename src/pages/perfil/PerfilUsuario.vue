<template>
    <div class="max-w-7xl mx-auto">
        <Card class="bg-background">
            <div class="flex items-center space-x-6 p-6">
                <Avatar class="w-16 h-16">
                    <img :src="user.avatar || defaultAvatar" alt="avatar" />
                </Avatar>
                <div class="flex-1">
                    <h2 class="text-2xl font-semibold">{{ user.name }}</h2>
                    <p class="text-sm text-muted-foreground">{{ user.email }} — {{ user.company }}</p>
                </div>
                <div class="space-x-2">
                    <Button variant="outline" size="sm" @click="openAvatarInput">
                        <UserIcon class="w-4 h-4 mr-2" /> Alterar
                    </Button>
                    <input ref="avatarInput" type="file" accept="image/*" @change="onAvatarChange" class="hidden" />
                </div>
            </div>
            <CardContent>
                <form @submit.prevent="saveProfile" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <Label>Nome</Label>
                        <Input v-model="user.name" required class="bg-card" />
                    </div>

                    <div>
                        <Label>Email</Label>
                        <div class="relative">
                            <Input v-model="user.email" type="email" required class="bg-card" />
                            <MailIcon class="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>

                    <div>
                        <Label>Empresa</Label>
                        <Input v-model="user.company" class="bg-card" />
                    </div>

                    <div>
                        <Label>Telefone</Label>
                        <Input v-model="user.fone" placeholder="Ex: (99) 99999-9999" class="bg-card" />
                    </div>

                    <div class="md:col-span-2">
                        <Label>Biografia</Label>
                        <Textarea v-model="user.bio" rows="4" class="bg-card" placeholder="Adicione uma biografia" />
                    </div>

                    <div class="md:col-span-2 flex items-center justify-end space-x-2">
                        <Button variant="outline" @click.prevent="openChangePassword">Alterar senha</Button>
                        <Button type="submit" class="text-white">
                            <SaveIcon class="w-4 h-4 mr-2" /> Salvar
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>

        <!-- Modal simples para alteração de senha -->
        <Dialog v-model:open="passwordModal">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Alterar senha</DialogTitle>
                </DialogHeader>
                <div class="space-y-3">
                    <Input v-model="password.old" type="password" placeholder="Senha atual" />
                    <Input v-model="password.new" type="password" placeholder="Nova senha" />
                    <Input v-model="password.confirm" type="password" placeholder="Confirme a nova senha" />
                    <div class="flex justify-end gap-2">
                        <Button variant="outline" @click="passwordModal = false">Cancelar</Button>
                        <Button @click="changePassword">Confirmar</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { User as UserIcon, Mail as MailIcon, Save as SaveIcon } from 'lucide-vue-next'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

const defaultAvatar = '/imgs/logo.png'

const user = reactive({
    id: 1,
    name: 'Antônio Costa',
    email: 'antonio@example.com',
    company: 'Minha Empresa',
    fone: '(99) 99999-9999',
    bio: '',
    avatar: ''
})

const avatarInput = ref<HTMLInputElement | null>(null)
const passwordModal = ref(false)
const password = reactive({ old: '', new: '', confirm: '' })

function openAvatarInput() {
    avatarInput.value?.click()
}

async function onAvatarChange(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return
    const file = input.files[0]
    // simples preview antes do upload
    const reader = new FileReader()
    reader.onload = () => {
        user.avatar = String(reader.result)
    }
    reader.readAsDataURL(file)
    // TODO: enviar para o backend
}

function openChangePassword() {
    passwordModal.value = true
}

async function changePassword() {
    if (password.new !== password.confirm) {
        alert('Confirmação de senha não confere')
        return
    }
    // TODO: chamada ao backend para trocar senha
    passwordModal.value = false
    password.old = ''
    password.new = ''
    password.confirm = ''
}

async function saveProfile() {
    // validações importantes
    if (!user.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(user.email)) {
        alert('Email inválido')
        return
    }
    // TODO: chamada ao backend (fetch/axios)
    alert('Perfil salvo')
}
</script>

<style scoped>
/* ajustes rápidos para avatar */
.avatar img {
    border-radius: 9999px;
}
</style>
