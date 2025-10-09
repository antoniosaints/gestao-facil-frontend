<template>
    <div class="max-w-5xl mx-auto my-10 px-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
            <div class="flex items-center gap-2">
                <span class="text-2xl font-semibold">Gestão Fácil ERP</span>
            </div>
            <RouterLink to="/site/cadastro">
                <Button class="bg-orange-500 hover:bg-orange-600 text-white rounded-md">Voltar ao Site</Button>
            </RouterLink>
        </div>

        <!-- Tabs -->
        <Tabs default-value="termos" class="w-full">
            <TabsList class="grid grid-cols-2 w-full border-b mb-4 bg-white dark:bg-gray-900 rounded-t-md">
                <TabsTrigger value="termos"
                    class="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-500 rounded-none py-3">
                    TERMOS DE USO
                </TabsTrigger>
                <TabsTrigger value="privacidade"
                    class="data-[state=active]:border-b-2 data-[state=active]:border-orange-500 data-[state=active]:text-orange-500 rounded-none py-3">
                    POLÍTICA DE PRIVACIDADE
                </TabsTrigger>
            </TabsList>

            <!-- Termos de Uso -->
            <TabsContent value="termos">
                <Card class="shadow-sm border border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle class="text-2xl">Termos de Uso</CardTitle>
                        <CardDescription>Última atualização: 29 de julho de 2025</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
                        <section>
                            <h2 class="font-semibold text-lg flex items-center gap-2">
                                <span class="text-orange-500">🛈</span> 1. Aceitação dos Termos
                            </h2>
                            <p>
                                Ao acessar e utilizar o sistema Gestão Fácil ERP, você concorda com os presentes Termos
                                de Uso. Se não concordar com qualquer parte destes termos, não deve utilizar nosso
                                serviço.
                            </p>
                        </section>

                        <section>
                            <h2 class="font-semibold text-lg flex items-center gap-2">
                                <span class="text-orange-500">💻</span> 2. Descrição do Serviço
                            </h2>
                            <ul class="list-disc pl-6 space-y-1">
                                <li>Controle de estoque e produtos</li>
                                <li>Gestão financeira</li>
                                <li>PDV com débito automático de estoque</li>
                                <li>Controle de ordens de serviço</li>
                                <li>Gestão de clientes e usuários</li>
                            </ul>
                        </section>

                        <div
                            class="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-md border border-yellow-200 dark:border-yellow-800">
                            <strong class="text-yellow-700 dark:text-yellow-200">⚠ IMPORTANTE - Limitações
                                Fiscais</strong>
                            <p class="mt-1">
                                O sistema NÃO possui integração com certificados digitais para emissão de documentos
                                fiscais. Emite apenas cupons não fiscais para controle interno. O usuário compreende e
                                aceita esta limitação.
                            </p>
                        </div>

                        <section>
                            <h2 class="font-semibold text-lg flex items-center gap-2">
                                <span class="text-orange-500">💳</span> 3. Pagamento e Cancelamento
                            </h2>
                            <p>
                                O sistema funciona em regime pré-pago. Cada licença mensal custa R$ 70,00. Não há
                                estorno em caso de cancelamento antecipado.
                            </p>
                        </section>

                        <section>
                            <h2 class="font-semibold text-lg flex items-center gap-2">
                                <span class="text-orange-500">🧾</span> 4. Emissão de Documentos
                            </h2>
                            <p>
                                Atualmente, o sistema emite apenas cupons não fiscais. No futuro, poderá ser adicionada
                                emissão de notas fiscais.
                            </p>
                        </section>

                        <section>
                            <h2 class="font-semibold text-lg flex items-center gap-2">
                                <span class="text-orange-500">⚖</span> 5. Limitação de Responsabilidade
                            </h2>
                            <p>
                                Não nos responsabilizamos por prejuízos decorrentes de mau uso, falhas técnicas ou
                                indisponibilidades temporárias. O usuário é responsável pelos seus dados e operações
                                realizadas.
                            </p>
                        </section>

                        <section>
                            <h2 class="font-semibold text-lg flex items-center gap-2">
                                <span class="text-orange-500">🔁</span> 6. Atualizações
                            </h2>
                            <p>
                                Reservamo-nos o direito de alterar estes termos a qualquer momento, mediante publicação
                                atualizada nesta página.
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </TabsContent>

            <!-- Política de Privacidade -->
            <TabsContent value="privacidade">
                <Card class="shadow-sm border border-gray-200 dark:border-gray-800">
                    <CardHeader>
                        <CardTitle class="text-2xl">Política de Privacidade</CardTitle>
                        <CardDescription>Última atualização: 29 de julho de 2025</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-6 text-gray-700 dark:text-gray-300 leading-relaxed">
                        <section>
                            <h2 class="font-semibold text-lg flex items-center gap-2">
                                <span class="text-orange-500">📥</span> 1. Coleta de Informações
                            </h2>
                            <p>
                                Coletamos apenas dados necessários para identificação do usuário, acesso à plataforma e
                                emissão de relatórios internos. Nenhum dado sensível é coletado sem consentimento
                                explícito.
                            </p>
                        </section>

                        <section>
                            <h2 class="font-semibold text-lg flex items-center gap-2">
                                <span class="text-orange-500">📊</span> 2. Uso das Informações
                            </h2>
                            <p>
                                Os dados são utilizados exclusivamente para o funcionamento do sistema e não são
                                compartilhados com terceiros, exceto em casos exigidos por lei.
                            </p>
                            <ul class="list-disc pl-6 space-y-1">
                                <li>Autenticação de acesso</li>
                                <li>Controle de permissões</li>
                                <li>Geração de relatórios internos</li>
                            </ul>
                        </section>

                        <section>
                            <h2 class="font-semibold text-lg flex items-center gap-2">
                                <span class="text-orange-500">🔒</span> 3. Segurança dos Dados
                            </h2>
                            <div
                                class="bg-blue-50 dark:bg-blue-900 p-4 rounded-md border border-blue-200 dark:border-blue-800">
                                <p>
                                    Adotamos medidas técnicas e administrativas para proteger seus dados contra acessos
                                    não autorizados, perdas ou vazamentos. Apesar disso, nenhum sistema é 100% seguro e
                                    o usuário reconhece esse risco inerente.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 class="font-semibold text-lg flex items-center gap-2">
                                <span class="text-orange-500">🧍</span> 4. Direitos do Usuário
                            </h2>
                            <p>
                                O usuário tem direito de solicitar a exclusão de seus dados a qualquer momento. Isso
                                resultará na perda total de acesso à plataforma.
                            </p>
                        </section>

                        <section>
                            <h2 class="font-semibold text-lg flex items-center gap-2">
                                <span class="text-orange-500">🔁</span> 5. Alterações na Política
                            </h2>
                            <p>
                                Esta política pode ser alterada a qualquer momento, sendo responsabilidade do usuário
                                manter-se informado sobre atualizações. O uso contínuo implica concordância com as novas
                                condições.
                            </p>
                        </section>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
</script>

<style scoped>
h2 {
    @apply mb-1;
}
</style>