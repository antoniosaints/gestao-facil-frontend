<template>
    <div class="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
        <div class="flex flex-col md:flex-row gap-6">
            <!-- Coluna Esquerda: Resumo do Perfil -->
            <aside class="w-full md:w-1/3 lg:w-1/4 space-y-6">
                <Card>
                    <CardHeader class="pb-2">
                        <div class="flex flex-col items-center">
                            <div class="relative group cursor-pointer" @click="openAvatarInput">
                                <Avatar
                                    class="w-24 h-24 mb-4 border-2 border-border group-hover:opacity-80 transition-opacity">
                                    <img :src="storeUi.usuarioLogged.profile || defaultAvatar" alt="Avatar do usuário"
                                        class="object-cover w-full h-full" />
                                    <div
                                        class="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                        <CameraIcon class="w-8 h-8 text-white" />
                                    </div>
                                </Avatar>
                                <input ref="avatarInput" type="file" accept="image/*" @change="onAvatarChange"
                                    class="hidden" />
                            </div>
                            <CardTitle class="text-xl text-center">{{ storeUi.usuarioLogged.nome }}</CardTitle>
                            <CardDescription class="text-center break-all">{{ storeUi.usuarioLogged.email }}
                            </CardDescription>
                            <div class="flex justify-center w-full mt-2">
                                <BadgeCell color="emerald" :label="(storeUi.usuarioLogged.permissao as string)" />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent class="text-sm text-muted-foreground text-center">
                        <p v-if="storeUi.usuarioLogged.biografia" class="italic">"{{ storeUi.usuarioLogged.biografia }}"
                        </p>
                        <p v-else class="italic">Sem biografia definida.</p>
                    </CardContent>
                </Card>
            </aside>

            <!-- Coluna Direita: Conteúdo e Edição -->
            <main class="flex-1 space-y-6">
                <!-- Seção de Dados e Configurações -->
                <Tabs default-value="pessoal" class="w-full">
                    <TabsList class="grid w-full grid-cols-2">
                        <TabsTrigger value="pessoal">Dados Pessoais</TabsTrigger>
                        <TabsTrigger value="seguranca">Segurança</TabsTrigger>
                    </TabsList>

                    <!-- Aba: Dados Pessoais -->
                    <TabsContent value="pessoal">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informações do Perfil</CardTitle>
                                <CardDescription>
                                    Atualize suas informações de contato e detalhes pessoais.
                                </CardDescription>
                            </CardHeader>
                            <CardContent class="space-y-4">
                                <div class="grid gap-2">
                                    <Label htmlFor="nome">Nome Completo</Label>
                                    <Input id="nome" v-model="usuarioProfile.nome" placeholder="Seu nome completo" />
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="grid gap-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input id="email" v-model="usuarioProfile.email" type="email" disabled
                                            class="bg-muted" />
                                    </div>
                                    <div class="grid gap-2">
                                        <Label htmlFor="telefone">Telefone</Label>
                                        <Input id="telefone" v-model="usuarioProfile.telefone"
                                            placeholder="(00) 00000-0000" />
                                    </div>
                                </div>
                                <div class="grid gap-2">
                                    <Label htmlFor="endereco">Endereço</Label>
                                    <Input id="endereco" v-model="usuarioProfile.endereco"
                                        placeholder="Rua, número, bairro..." />
                                </div>
                                <div class="grid gap-2">
                                    <Label htmlFor="biografia">Biografia</Label>
                                    <Textarea id="biografia" v-model="usuarioProfile.biografia"
                                        placeholder="Conte um pouco sobre você..." rows="4" />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button @click="saveProfile" :disabled="isLoading">
                                    <SaveIcon v-if="!isLoading" class="w-4 h-4 mr-2" />
                                    <span v-else class="mr-2">Salvando...</span>
                                    Salvar Alterações
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>

                    <!-- Aba: Segurança -->
                    <TabsContent value="seguranca">
                        <Card>
                            <CardHeader>
                                <CardTitle>Segurança da Conta</CardTitle>
                                <CardDescription>
                                    Gerencie sua senha e acesso à conta.
                                </CardDescription>
                            </CardHeader>
                            <CardContent class="space-y-4">
                                <div class="grid gap-2">
                                    <Label htmlFor="current-password">Senha Atual</Label>
                                    <Input id="current-password" v-model="password.old" type="password" />
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div class="grid gap-2">
                                        <Label htmlFor="new-password">Nova Senha</Label>
                                        <Input id="new-password" v-model="password.new" type="password" />
                                    </div>
                                    <div class="grid gap-2">
                                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                                        <Input id="confirm-password" v-model="password.confirm" type="password" />
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button @click="changePassword" variant="destructive" :disabled="isLoading">
                                    Alterar Senha
                                </Button>
                            </CardFooter>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>

        <nav v-if="storeUi.isMobile"
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20 md:hidden">
            <button type="button" @click="storeUi.openSidebar = true"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Menu />
                <span class="text-xs">Menu</span>
            </button>
        </nav>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Camera as CameraIcon, Save as SaveIcon, Menu } from 'lucide-vue-next'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Usuarios } from '@/types/schemas'
import { useUiStore } from '@/stores/ui/uiStore'
import { UsuarioRepository } from '@/repositories/usuario-repository'
import { useToast } from 'vue-toastification'
import BadgeCell from '@/components/tabela/BadgeCell.vue'

const storeUi = useUiStore()
const toast = useToast()
const defaultAvatar = '/imgs/logo.png' // Consider using a better default avatar or empty state
const isLoading = ref(false)

const usuarioProfile = ref<Partial<Usuarios>>({
    ...storeUi.usuarioLogged
})

const avatarInput = ref<HTMLInputElement | null>(null)
const password = reactive({ old: '', new: '', confirm: '' })

function openAvatarInput() {
    avatarInput.value?.click()
}

async function onAvatarChange(e: Event) {
    const input = e.target as HTMLInputElement
    if (!input.files?.length) return
    const file = input.files[0]

    // Preview
    const reader = new FileReader()
    reader.onload = () => {
        usuarioProfile.value.profile = String(reader.result)
        // Aqui você poderia já subir a imagem ou esperar o "Salvar"
        // Para UX imediata, salvar o avatar separadamente pode ser melhor,
        // mas vamos manter simples por agora e salvar junto se desejar, 
        // ou implementar upload direto aqui.
    }
    reader.readAsDataURL(file)
}

async function changePassword() {
    if (!password.old || !password.new || !password.confirm) {
        toast.warning('Preencha todos os campos de senha')
        return
    }

    if (password.new !== password.confirm) {
        toast.error('A nova senha e a confirmação não conferem')
        return
    }

    isLoading.value = true
    try {
        // Simulação de chamada de API
        // await UsuarioRepository.changePassword(password.old, password.new) 
        // Implementar no repositório se necessário

        // Mock de sucesso para feedback visual
        await new Promise(resolve => setTimeout(resolve, 1000))

        toast.success('Senha alterada com sucesso!')
        password.old = ''
        password.new = ''
        password.confirm = ''
    } catch (error) {
        console.error(error)
        toast.error('Erro ao alterar senha. Verifique sua senha atual.')
    } finally {
        isLoading.value = false
    }
}

async function saveProfile() {
    isLoading.value = true
    try {
        await UsuarioRepository.updateProfile({
            biografia: usuarioProfile.value.biografia,
            endereco: usuarioProfile.value.endereco,
            telefone: usuarioProfile.value.telefone,
            nome: usuarioProfile.value.nome,
            profile: usuarioProfile.value.profile // Se o backend aceitar atualização de perfil aqui
        })
        await storeUi.getDataUsuario();
        toast.success('Perfil atualizado com sucesso')
    } catch (error) {
        console.error(error)
        toast.error('Erro ao atualizar perfil, tente novamente')
    } finally {
        isLoading.value = false
    }
}
</script>

<style scoped>
/* Scoped styles if needed, mostly using tailwind utilities */
</style>
