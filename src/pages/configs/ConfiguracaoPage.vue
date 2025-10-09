<template>
    <div class="container mx-auto space-y-6">
        <div class="flex items-start md:items-center justify-between flex-col md:flex-row ">
            <div>
                <h1 class="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <Cog class="h-6 w-6" :stroke-width="2.5" />
                    Configurações
                </h1>
                <p class="text-muted-foreground">Ajuste preferências do sistema e integrações.</p>
            </div>
        </div>

        <Tabs v-model="tab" class="w-auto">
            <div class="overflow-auto max-w-full">
                <TabsList class="grid w-max grid-cols-3">
                    <TabsTrigger value="empresa"><i class="fa-solid fa-building mr-2"></i> Empresa</TabsTrigger>
                    <TabsTrigger value="notificacoes"><i class="fa-solid fa-bell mr-2"></i> Notificações</TabsTrigger>
                    <TabsTrigger value="integracoes"><i class="fa-solid fa-link mr-2"></i> Integrações</TabsTrigger>
                </TabsList>
            </div>

            <!-- EMPRESA -->
            <TabsContent value="empresa">
                <EmpresaPage />
            </TabsContent>

            <!-- NOTIFICAÇÕES -->
            <TabsContent value="notificacoes">
                <Card class="rounded-t-none bg-background">
                    <CardHeader>
                        <CardTitle>Notificações</CardTitle>
                        <CardDescription>Configure e-mails e push de eventos.</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-6">
                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <Label for="emailNotif">E-mail para avisos</Label>
                                <Input id="emailNotif" type="email" placeholder="seu@email.com"
                                    v-model="form.notificacoes.email" />
                            </div>
                            <SubscribeNotification />
                        </div>
                        <Separator />
                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <Label>Eventos</Label>
                                <div class="grid gap-3">
                                    <div class="flex items-center justify-between">
                                        <span>Venda concluída</span>
                                        <Switch v-model:checked="form.notificacoes.eventos.vendaConcluida" />
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span>Sangria registrada</span>
                                        <Switch v-model:checked="form.notificacoes.eventos.sangria" />
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span>Estoque baixo</span>
                                        <Switch v-model:checked="form.notificacoes.eventos.estoqueBaixo" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter class="justify-end">
                        <Button variant="outline" @click="reset('notificacoes')">Cancelar</Button>
                        <Button class="ml-2" @click="save('notificacoes')">Salvar</Button>
                    </CardFooter>
                </Card>
            </TabsContent>

            <!-- INTEGRAÇÕES -->
            <TabsContent value="integracoes">
                <Card class="rounded-t-none bg-background">
                    <CardHeader>
                        <CardTitle>Integrações</CardTitle>
                        <CardDescription>Conecte serviços externos (Mercado Pago, Asaas).</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-3">
                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <Label for="mercadoPagoKey">Mercado Pago API Key</Label>
                                <Input id="mercadoPagoKey" v-model="form.integracoes.mercadoPago.apiKey" type="password"
                                    placeholder="Sua chave de acesso" />
                                <p class="text-sm text-muted-foreground">Usado para cobranças, links de pagamento e
                                    clientes.</p>
                            </div>
                            <div class="space-y-2">
                                <Label for="mercadoPagoEnv">Ambiente</Label>
                                <Select v-model="form.integracoes.mercadoPago.ambiente">
                                    <SelectTrigger id="mercadoPagoEnv">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sandbox">Sandbox</SelectItem>
                                        <SelectItem value="production">Produção</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Separator />
                        <div class="grid md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <Label for="asaasKey">Asaas API Key</Label>
                                <Input id="asaasKey" placeholder="Sua chave de acesso"
                                    v-model="form.integracoes.asaas.apiKey" type="password" />
                                <p class="text-sm text-muted-foreground">Usado para cobranças, links de pagamento e
                                    clientes.</p>
                            </div>
                            <div class="space-y-2">
                                <Label for="asaasAmb">Ambiente</Label>
                                <Select v-model="form.integracoes.asaas.ambiente">
                                    <SelectTrigger id="asaasAmb">
                                        <SelectValue placeholder="Selecione" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sandbox">Sandbox</SelectItem>
                                        <SelectItem value="production">Produção</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter class="justify-end">
                        <Button variant="outline" @click="reset('integracoes')">Cancelar</Button>
                        <Button class="ml-2" @click="save('integracoes')">Salvar</Button>
                    </CardFooter>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { useToast } from 'vue-toastification'
import SubscribeNotification from '@/components/layout/subscribeNotification.vue'
import EmpresaPage from '@/pages/configs/EmpresaPage.vue'
import { Cog } from 'lucide-vue-next'

// Estado
const tab = ref<'empresa' | 'notificacoes' | 'integracoes'>('empresa')
const saving = ref(false)
const toast = useToast()

const defaults = {
    empresa: { razao: '', fantasia: '', cnpj: '', ie: '', endereco: '', telefone: '', email: '' },
    notificacoes: {
        email: '', push: true,
        eventos: { vendaConcluida: true, sangria: true, estoqueBaixo: true }
    },
    integracoes: {
        asaas: { apiKey: '', ambiente: 'sandbox' as 'sandbox' | 'production' },
        mercadoPago: { apiKey: '', ambiente: 'sandbox' as 'sandbox' | 'production' },
    },
}

const form = reactive(structuredClone(defaults))

// Ações
async function save(section?: keyof typeof form) {
    saving.value = true
    try {
        // TODO: chame sua API aqui (axios/fetch). Ex.: await api.save(section, form[section])
        await new Promise((r) => setTimeout(r, 500))
        toast({ title: 'Configurações salvas', description: section ? `Seção “${section}” atualizada.` : 'Todas as seções atualizadas.' })
    } finally {
        saving.value = false
    }
}

function reset(section?: keyof typeof form) {
    if (section) {
        // @ts-ignore
        form[section] = structuredClone(defaults[section])
        return
    }
    Object.assign(form, structuredClone(defaults))
}

</script>

<style scoped>
:root {
    --pad: 0.75rem;
}

.compact :is(input, button, .shadcn-control) {
    padding: calc(var(--pad) * 0.6);
}
</style>
