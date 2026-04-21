<template>
    <div class="container mx-auto space-y-6">
        <div class="flex items-start justify-between flex-col md:flex-row md:items-center">
            <div>
                <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Cog class="h-6 w-6" :stroke-width="2.5" />
                    Configurações
                </h1>
                <p class="text-muted-foreground">Ajuste preferências operacionais do sistema.</p>
            </div>
        </div>

        <Tabs v-model="tab" class="w-auto">
            <div class="overflow-auto max-w-full">
                <TabsList class="grid w-max grid-cols-4">
                    <TabsTrigger value="empresa"><i class="fa-solid fa-building mr-2"></i> Empresa</TabsTrigger>
                    <TabsTrigger value="notificacoes"><i class="fa-solid fa-bell mr-2"></i> Notificações</TabsTrigger>
                    <TabsTrigger :disabled="storeUi.isMobile" value="impressao"><i class="fa-solid fa-print mr-2"></i>
                        Impressão
                    </TabsTrigger>
                    <TabsTrigger value="financeiro" class="flex items-center">
                        <Banknote class="inline-flex mr-1 w-5 h-5" />
                        Financeiro
                    </TabsTrigger>
                </TabsList>
            </div>

            <TabsContent value="empresa">
                <EmpresaPage />
            </TabsContent>

            <TabsContent value="notificacoes">
                <Card class="rounded-t-none bg-background">
                    <form @submit.prevent="submit(formularioNotificacoes)">
                        <CardHeader>
                            <CardTitle class="font-normal">Notificações</CardTitle>
                            <CardDescription>Configure e-mails e push de eventos.</CardDescription>
                        </CardHeader>
                        <CardContent class="space-y-6">
                            <div class="grid md:grid-cols-2 gap-3">
                                <div class="space-y-2">
                                    <Label for="emailNotif">E-mail para avisos</Label>
                                    <Input id="emailNotif" v-model="(formularioNotificacoes.emailAvisos as string)"
                                        type="email" placeholder="seu@email.com" />
                                </div>
                                <SubscribeNotification />
                            </div>
                            <Separator />
                            <div class="grid gap-6">
                                <div class="space-y-2">
                                    <Label class="text-md">Eventos</Label>
                                    <div class="grid grid-cols-2 gap-3">
                                        <label for="vendaConcluida"
                                            class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                            <span>Venda concluída <p class="text-xs text-muted-foreground">(Quando
                                                    realizar uma venda)</p></span>
                                            <Switch id="vendaConcluida"
                                                v-model="formularioNotificacoes.eventoVendaConcluida" />
                                        </label>
                                        <label for="sangriaEvento"
                                            class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                            <span>Sangria registrada <p class="text-xs text-muted-foreground">(Retiradas
                                                    de valor em caixa PDV)</p></span>
                                            <Switch id="sangriaEvento" v-model="formularioNotificacoes.eventoSangria" />
                                        </label>
                                        <label for="estoqueBaixo"
                                            class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                            <span>Estoque baixo <p class="text-xs text-muted-foreground">(classificado
                                                    em vermelho)</p></span>
                                            <Switch id="estoqueBaixo"
                                                v-model="formularioNotificacoes.eventoEstoqueBaixo" />
                                        </label>
                                        <label for="produtoEditadoReposicao"
                                            class="flex flex-col md:flex-row text-center md:text-left gap-2 md:gap-0 items-center justify-between bg-body/70 p-3 px-4 rounded-lg border cursor-pointer">
                                            <span>Alteração de produto <p class="text-xs text-muted-foreground">
                                                    (reposição, edição)</p></span>
                                            <Switch id="produtoEditadoReposicao" />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter class="justify-end">
                            <Button :disabled="loading" class="ml-2 text-white" type="submit">
                                <CircleCheck v-if="!loading" />
                                <LoaderIcon v-if="loading" class="animate-spin" />
                                {{ loading ? 'Salvando...' : 'Salvar' }}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>

            <TabsContent value="impressao">
                <ImpressaoPage />
            </TabsContent>

            <TabsContent value="financeiro">
                <Card class="rounded-t-none bg-background">
                    <form @submit.prevent="submit(formularioFinanceiro)">
                        <CardHeader>
                            <CardTitle class="font-normal">Financeiro</CardTitle>
                            <CardDescription>Configure apenas os parâmetros financeiros operacionais da sua conta.</CardDescription>
                        </CardHeader>
                        <CardContent class="space-y-6">
                            <div class="grid md:grid-cols-2 gap-3">
                                <div class="space-y-2">
                                    <Label for="chavePixSistema">Chave PIX (Celular, E-mail, CPF ou Aleatória)</Label>
                                    <Input id="chavePixSistema" v-model="(formularioFinanceiro.chavePix as string)"
                                        type="text" placeholder="Sua chave aqui..." />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter class="justify-end">
                            <Button :disabled="loading" class="ml-2 text-white" type="submit">
                                <CircleCheck v-if="!loading" />
                                <LoaderIcon v-if="loading" class="animate-spin" />
                                {{ loading ? 'Salvando...' : 'Salvar' }}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </TabsContent>
        </Tabs>

        <nav v-if="storeUi.isMobile"
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20">
            <button type="button" @click="storeUi.openSidebar = true"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Menu />
                <span class="text-xs">Menu</span>
            </button>
            <button type="button" @click="goBack"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Undo2 />
                <span class="text-xs">Voltar</span>
            </button>
        </nav>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useToast } from 'vue-toastification'
import SubscribeNotification from '@/components/layout/subscribeNotification.vue'
import EmpresaPage from '@/pages/configs/EmpresaPage.vue'
import { Banknote, CircleCheck, Cog, LoaderIcon, Menu, Undo2 } from 'lucide-vue-next'
import type { UpdateParametrosConta } from '@/types/schemas'
import { ContaRepository } from '@/repositories/conta-repository'
import { useUiStore } from '@/stores/ui/uiStore'
import ImpressaoPage from './ImpressaoPage.vue'
import { goBack } from '@/hooks/links'

const tab = ref<'empresa' | 'notificacoes' | 'impressao' | 'financeiro'>('empresa')
const toast = useToast()
const storeUi = useUiStore()
const loading = ref(false)

const formularioNotificacoes = reactive<UpdateParametrosConta>({
    eventoEstoqueBaixo: false,
    eventoVendaConcluida: false,
    eventoSangria: false,
    emailAvisos: '',
})
const formularioFinanceiro = reactive<UpdateParametrosConta>({
    chavePix: '',
})

async function submit(data: UpdateParametrosConta) {
    try {
        loading.value = true
        await ContaRepository.parametros(data)
        toast.success('Configurações salvas com sucesso')
        await getParametros()
    } catch (error) {
        console.error(error)
        toast.error('Erro ao salvar as configurações')
    } finally {
        loading.value = false
    }
}

async function getParametros() {
    try {
        const response = await ContaRepository.getParametros()
        if (response.data != null) {
            Object.assign(formularioNotificacoes, {
                eventoEstoqueBaixo: response.data.eventoEstoqueBaixo,
                eventoVendaConcluida: response.data.eventoVendaConcluida,
                eventoSangria: response.data.eventoSangria,
                emailAvisos: response.data.emailAvisos,
            })
            Object.assign(formularioFinanceiro, {
                chavePix: response.data.chavePix,
            })
        }
    } catch (error) {
        console.error(error)
        toast.error('Erro ao buscar as configurações')
    }
}

onMounted(getParametros)
</script>

<style scoped>
:root {
    --pad: 0.75rem;
}

.compact :is(input, button, .shadcn-control) {
    padding: calc(var(--pad) * 0.6);
}
</style>
