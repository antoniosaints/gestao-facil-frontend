<template>
    <div class="min-h-screen bg-muted/20">
        <!-- Minimal Header -->
        <header class="bg-background border-b py-4">
            <div class="container mx-auto px-4 flex justify-between items-center">
                <div class="flex items-center gap-2">
                    <div
                        class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                        G</div>
                    <span class="font-bold text-xl tracking-tight">Gestão Fácil</span>
                </div>
                <RouterLink to="/site">
                    <Button variant="ghost">Voltar para o Site</Button>
                </RouterLink>
            </div>
        </header>

        <div class="container mx-auto px-4 py-8 max-w-4xl">
            <h1 class="text-3xl font-bold mb-2">Legal e Privacidade</h1>
            <p class="text-muted-foreground mb-8">Informações transparentes sobre como operamos e protegemos seus dados.
            </p>

            <Tabs default-value="termos" class="w-full">
                <TabsList class="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="termos">Termos de Uso</TabsTrigger>
                    <TabsTrigger value="privacidade">Política de Privacidade</TabsTrigger>
                </TabsList>

                <!-- Termos de Uso -->
                <TabsContent value="termos">
                    <Card>
                        <CardHeader>
                            <CardTitle>Termos de Uso</CardTitle>
                            <CardDescription>Última atualização: 19 de Fevereiro de 2026</CardDescription>
                        </CardHeader>
                        <CardContent class="prose dark:prose-invert max-w-none space-y-4">
                            <div>
                                <h3 class="font-bold text-lg mb-2">1. Aceitação dos Termos</h3>
                                <p class="text-muted-foreground">
                                    Ao acessar e utilizar o sistema Gestão Fácil ERP, você concorda total e
                                    irrestritamente com os presentes Termos de Uso.
                                    Se discordar de qualquer condição aqui estabelecida, por favor, não utilize a
                                    plataforma.
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <h3 class="font-bold text-lg mb-2">2. Descrição do Serviço</h3>
                                <p class="text-muted-foreground">O Gestão Fácil ERP é uma plataforma SaaS (Software as a
                                    Service) que oferece:</p>
                                <ul class="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
                                    <li>Gestão de estoque e inventário</li>
                                    <li>Controle financeiro (contas a pagar e receber)</li>
                                    <li>Frente de caixa (PDV)</li>
                                    <li>Gestão de clientes e fornecedores</li>
                                </ul>
                            </div>

                            <Alert variant="destructive"
                                class="bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-400 my-4">
                                <AlertCircle class="h-4 w-4" />
                                <AlertTitle>Aviso Importante</AlertTitle>
                                <AlertDescription>
                                    Este sistema não substitui sua contabilidade fiscal. A emissão de cupom não fiscal
                                    não possui validade jurídica para fins de tributação.
                                    Consulte seu contador sobre a obrigatoriedade de emissão de NF-e/NFC-e.
                                </AlertDescription>
                            </Alert>

                            <div>
                                <h3 class="font-bold text-lg mb-2">3. Assinatura e Pagamentos</h3>
                                <p class="text-muted-foreground">
                                    Nossos planos funcionam no modelo pré-pago mensal. O acesso é liberado mediante
                                    confirmação do pagamento.
                                    O não pagamento da mensalidade implicará na suspensão temporária do acesso até a
                                    regularização.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <!-- Política de Privacidade -->
                <TabsContent value="privacidade">
                    <Card>
                        <CardHeader>
                            <CardTitle>Política de Privacidade</CardTitle>
                            <CardDescription>Compromisso com a proteção dos seus dados (LGPD)</CardDescription>
                        </CardHeader>
                        <CardContent class="prose dark:prose-invert max-w-none space-y-4">
                            <div>
                                <h3 class="font-bold text-lg mb-2">1. Coleta de Dados</h3>
                                <p class="text-muted-foreground">
                                    Coletamos apenas os dados estritamente necessários para o funcionamento do sistema e
                                    a prestação do serviço contratado, incluindo:
                                </p>
                                <ul class="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
                                    <li>Dados cadastrais (Nome, Email, Telefone, CNPJ/CPF)</li>
                                    <li>Dados da empresa (Nome Fantasia, Endereço, Segmento)</li>
                                    <li>Logs de acesso para segurança e auditoria</li>
                                </ul>
                            </div>

                            <Separator />

                            <div>
                                <h3 class="font-bold text-lg mb-2">2. Utilização dos Dados</h3>
                                <p class="text-muted-foreground">
                                    Os dados coletados são utilizados exclusivamente para:
                                </p>
                                <ul class="list-disc pl-5 text-muted-foreground mt-2 space-y-1">
                                    <li>Autenticação e segurança do usuário</li>
                                    <li>Comunicação sobre atualizações e suporte técnico</li>
                                    <li>Geração de relatórios gerenciais internos do próprio usuário</li>
                                </ul>
                                <p class="text-muted-foreground mt-2 font-medium">
                                    Não vendemos, alugamos ou compartilhamos seus dados com terceiros para fins
                                    publicitários.
                                </p>
                            </div>

                            <div>
                                <h3 class="font-bold text-lg mb-2">3. Segurança</h3>
                                <div
                                    class="bg-blue-500/10 p-4 rounded-lg flex gap-3 text-blue-700 dark:text-blue-400 items-start">
                                    <ShieldCheck class="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p class="font-bold text-sm">Criptografia de Ponta a Ponta</p>
                                        <p class="text-sm">Todo tráfego de dados é criptografado via SSL/TLS. As senhas
                                            são armazenadas com hash irreversível.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, ShieldCheck } from 'lucide-vue-next'
</script>