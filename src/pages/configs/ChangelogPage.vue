<template>
    <div class="container mx-auto px-4 py-8">
        <h1 class="text-2xl font-bold text-center">Atualizações e Novidades</h1>
        <p class="mb-10">Aqui você encontrará uma lista detalhada das atualizações e novidades do nosso sistema.</p>
        <div class="relative">
            <!-- Linha central -->
            <div class="absolute top-0 left-1/2 transform -translate-x-1/2 w-1 bg-gray-300 dark:bg-gray-700 h-full">
            </div>

            <!-- Itens do changelog -->
            <div v-for="(item, index) in changelog" :key="index" class="relative flex items-center w-full mb-12"
                :class="index % 2 === 0 ? 'justify-start' : 'justify-end'">
                <!-- Ponto central alinhado -->
                <div
                    class="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary rounded-full w-4 h-4 z-10 border-2 border-white">
                </div>

                <!-- Cartão -->
                <div class="w-full md:w-1/2"
                    :class="index % 2 === 0 ? 'pr-10 md:pl-0 text-right md:text-left' : 'pl-10 md:pr-0 text-left md:text-right'">
                    <Card class="shadow-md">
                        <CardHeader>
                            <CardTitle class="flex items-center justify-between">
                                <span>{{ item.version }}</span>
                                <span class="text-sm text-muted-foreground">{{ item.date }}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul class="list-disc pl-5 space-y-1 text-left" v-if="item.changes.length">
                                <li v-for="(change, cIndex) in item.changes" :key="cIndex">
                                    {{ change }}
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ChangelogItem {
    version: string;
    date: string;
    changes: string[];
}

const changelog: ChangelogItem[] = [
    {
        version: "v1.3.0",
        date: "09/10/2025",
        changes: [
            "Melhorado a aparência dos modais",
            "Ajustado a efetivação de vendas",
            "Melhorado o desempenho do sistema"
        ]
    },
    {
        version: "v1.2.0",
        date: "06/10/2025",
        changes: [
            "Adicionada nova tela de relatórios financeiros",
            "Melhorias no desempenho do dashboard",
            "Correção no cálculo de impostos"
        ]
    },
    {
        version: "v1.1.0",
        date: "02/10/2025",
        changes: [
            "Implementado controle de estoque",
            "Adicionado histórico de movimentações",
            "Interface de usuário redesenhada"
        ]
    },
    {
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
