<template>
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-2xl font-bold text-center">
            <Binoculars class="h-6 w-6 inline-flex" /> Atualizações e Novidades
        </h1>
        <p class="mb-10 max-w-lg mx-auto text-center text-gray-600 dark:text-gray-400">Aqui você encontrará uma lista
            detalhada das atualizações e
            novidades do
            nosso
            sistema.</p>
        <div class="relative">
            <!-- Linha central -->
            <div
                class="absolute rounded-full top-0 left-1/2 transform -translate-x-1/2 w-0.5 bg-gray-300 dark:bg-gray-700 h-full">
            </div>

            <!-- Itens do changelog -->
            <div v-for="(item, index) in changelog" :key="index" class="relative flex items-center w-full mb-12"
                :class="index % 2 === 0 ? 'justify-start' : 'justify-end'">
                <!-- Ponto central alinhado -->
                <div
                    class="absolute left-1/2 top-1/2 hidden md:block transform -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full w-4 h-4 z-10 border-2 border-white">
                </div>

                <!-- Cartão -->
                <div class="w-full md:w-1/2"
                    :class="index % 2 === 0 ? 'pr-10 md:pl-0 text-right md:text-left' : 'pl-10 md:pr-0 text-left md:text-right'">
                    <Card class="shadow-md rounded-sm">
                        <CardHeader>
                            <CardTitle class="flex items-center justify-between">
                                <BadgeCell color="emerald" :label="item.version" class="text-sm" />
                                <BadgeCell color="gray" :label="item.date" class="text-xs" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <h2 class="text-md mb-2 text-left">
                                <Milestone class="w-4 h-4 inline-flex" /> {{ item.title }}
                            </h2>
                            <ul class="list-disc pl-5 space-y-1 text-left text-gray-600 dark:text-gray-400 text-sm"
                                v-if="item.changes.length">
                                <li v-for="(change, cIndex) in item.changes" :key="cIndex">
                                    {{ change }}
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
        <nav v-if="uiStore.isMobile"
            class="fixed bottom-0 left-0 w-full bg-card dark:bg-card-dark border-t border-border dark:border-border-dark flex justify-around pt-4 h-20 shadow-lg z-20">
            <button type="button" @click="uiStore.openSidebar = true"
                class="flex flex-col items-center disabled:text-gray-300 disabled:dark:text-gray-600 text-gray-700 dark:text-gray-300 cursor-pointer hover:text-primary transition">
                <Menu />
                <span class="text-xs">Menu</span>
            </button>
        </nav>
    </div>
</template>

<script setup lang="ts">
import BadgeCell from "@/components/tabela/BadgeCell.vue";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useUiStore } from "@/stores/ui/uiStore";
import { Binoculars, Menu, Milestone } from "lucide-vue-next";

const uiStore = useUiStore();
interface ChangelogItem {
    title: string;
    version: string;
    date: string;
    changes: string[];
}

const changelog: ChangelogItem[] = [
    {
        title: "Melhorias e Novidades",
        version: "v1.6.0",
        date: "16/10/2025",
        changes: [
            "Adicionado acompanhamento mensal de pagamentos",
            "Acesse rapidamente a parcela vigente",
            "Efetive e Estorne pagamentos",
            "Adicionado criação de Categorias e Contas",
            "Melhorado a interface de acompanhamento",
        ]
    },
    {
        title: "Melhorias e Novidades",
        version: "v1.5.0",
        date: "10/10/2025",
        changes: [
            "Adicionado geração de cobranças",
            "Gere Links, Pix e Boletos sem precisar acessar seu banco",
            "Conecte seu banco Mercado Pago",
            "Melhorado a interface de configurações",
            "Redirecionamentos de links melhorados",
            "Adicionado atualização de tela em tempo real",
        ]
    },
    {
        title: "Melhorias e Correções",
        version: "v1.4.0",
        date: "10/10/2025",
        changes: [
            "Adicionado excluir em lote para lançamentos",
            "Corrigido pagamento de mensalidade ",
            "Adicionado novas funções em configurações",
            "Melhorado o visual das tabelas"
        ]
    },
    {
        title: "Melhorias e Correções",
        version: "v1.3.0",
        date: "09/10/2025",
        changes: [
            "Melhorado a aparência dos modais",
            "Ajustado a efetivação de vendas",
            "Melhorado o desempenho do sistema"
        ]
    },
    {
        title: "Melhorias e Correções",
        version: "v1.2.0",
        date: "06/10/2025",
        changes: [
            "Adicionada nova tela de relatórios financeiros",
            "Melhorias no desempenho do dashboard",
            "Correção no cálculo de impostos"
        ]
    },
    {
        title: "Melhorias e Correções",
        version: "v1.1.0",
        date: "02/10/2025",
        changes: [
            "Implementado controle de estoque",
            "Adicionado histórico de movimentações",
            "Interface de usuário redesenhada"
        ]
    },
    {
        title: "Lançamento Inicial",
        version: "v1.0.0",
        date: "15/09/2025",
        changes: [
            "Lançamento inicial do sistema",
            "Cadastro de clientes e produtos",
            "Módulo de vendas básico"
        ]
    }
];
</script>

<style scoped>
.container {
    max-width: 800px;
}
</style>
