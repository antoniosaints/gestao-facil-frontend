<script setup lang="ts">
import ModalView from '@/components/formulario/ModalView.vue';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { UsuarioRepository } from '@/repositories/usuario-repository';
import { useUiStore } from '@/stores/ui/uiStore';
import { useUsuarioStore } from '@/stores/usuarios/useUsuarios';
import { useToast } from 'vue-toastification';

const toast = useToast()
const store = useUsuarioStore()
const uiStore = useUiStore()

async function submit() {
    try {
        await UsuarioRepository.save({
            ...store.form
        })
        if (uiStore.usuarioLogged.id === store.form.id) {
            await uiStore.getDataUsuario()
        }
        toast.success("Registro salvo com sucesso!")
        store.updateTable()
        store.reset()
        store.openModal = false
    } catch (e: any) {
        console.log(e)
        toast.error("Erro ao salvar o usuário, verifique sua conexão e tente novamente.")
    }
}
</script>

<template>
    <ModalView v-model:open="store.openModal" description="Preencha dos dados do usuário" title="Formulário de usuários"
        size="2xl">
        <form @submit.prevent="submit" class="flex flex-col px-4">
            <div class="bg-background dark:bg-background-dark rounded-md w-full h-full grid grid-cols-2 gap-4">
                <div class="w-full gap-2 flex flex-col col-span-2">
                    <Label for="nome">Nome</Label>
                    <Input id="nome" required v-model="store.form.nome" placeholder="Nome" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="email">E-mail</Label>
                    <Input id="email" required type="email" v-model="store.form.email" placeholder="E-mail" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="senha">Senha</Label>
                    <Input id="senha" required type="password" v-model="store.form.senha"
                        placeholder="Senha de acesso" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="telefone">Telefone</Label>
                    <Input id="telefone" v-model="store.form.telefone" placeholder="Telefone" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="endereco">Endereço</Label>
                    <Input id="endereco" v-model="store.form.endereco" placeholder="Endereço" />
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="permissao">Permissão</Label>
                    <Select id="permissao" v-model="store.form.permissao" :disabled="store.form.permissao == 'root'">
                        <SelectTrigger class="w-full bg-card">
                            <SelectValue placeholder="Selecione a permissão" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="root" disabled v-show="store.form.permissao == 'root'">Root</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="gerente">Gerente</SelectItem>
                            <SelectItem value="vendedor">Vendedor</SelectItem>
                            <SelectItem value="tecnico">Técnico</SelectItem>
                            <SelectItem value="usuario">Usuário</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <Label for="status">Status</Label>
                    <Select id="status" v-model="store.form.status">
                        <SelectTrigger class="w-full bg-card">
                            <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ATIVO">Ativo</SelectItem>
                            <SelectItem value="INATIVO">Inativo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <label for="entrada" class="block text-sm font-medium mb-0 md:col-span-12">
                        Notificações
                    </label>
                    <div class="grid grid-cols-12 md:space-x-2 gap-2 items-center md:col-span-12">
                        <div class="col-span-12 md:col-span-6">
                            <div class="border bg-card border-border px-3 py-[8px] rounded-lg">
                                <div class="flex items-center">
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <Switch v-model:model-value="store.form.emailReceiver" />
                                        <span
                                            class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">E-mails</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <div class="border bg-card border-border px-3 py-[8px] rounded-lg">
                                <div class="flex items-center">
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <Switch v-model:model-value="store.form.pushReceiver" />
                                        <span
                                            class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Push</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="w-full gap-2 flex flex-col">
                    <label for="entrada" class="block text-sm font-medium mb-0 md:col-span-12">
                        Autorização
                    </label>
                    <div class="grid grid-cols-12 md:space-x-2 gap-2 items-center md:col-span-12">
                        <div class="col-span-12 md:col-span-6">
                            <div class="border bg-card border-border px-3 py-[8px] rounded-lg">
                                <div class="flex items-center">
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <Switch v-model:model-value="store.form.superAdmin" />
                                        <span
                                            class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">SAdmin</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <div class="border bg-card border-border px-3 py-[8px] rounded-lg">
                                <div class="flex items-center">
                                    <label class="relative inline-flex items-center cursor-pointer">
                                        <Switch v-model:model-value="store.form.gerencialMode" />
                                        <span
                                            class="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">Gerencial</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="w-full gap-2 flex flex-col col-span-2">
                    <Label for="biografia">Biografia</Label>
                    <Textarea id="biografia" v-model="store.form.biografia" placeholder="Biografia"></Textarea>
                </div>
            </div>
            <div class="flex justify-end gap-2 mt-4">
                <Button type="button" variant="secondary" @click="store.openModal = false">
                    Fechar
                </Button>
                <Button class="text-white" type="submit">
                    Registrar
                </Button>
            </div>
        </form>
    </ModalView>
</template>