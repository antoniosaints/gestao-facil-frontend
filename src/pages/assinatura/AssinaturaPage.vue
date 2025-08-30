<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-vue-next"
import { ref } from "vue"

const planos = ref([
    {
        nome: "Gestão Fácil",
        preco: "R$ 70/mês",
        descricao: "Mais recursos para empresas em crescimento.",
        features: [
            "Usuários ilimitados",
            "Clientes ilimitados",
            "Produtos ilimitados",
            "Controle de estoque",
            "Vendas PDV e Avulsas",
            "Dashboards avancados",
            "integração com Mercado Pago e Asaas",
            "Controle financeiro com Dashboard e DRE",
            "Relatórios avançados",
        ],
        destaque: true,
    }
])

const selecionarPlano = (plano: string) => {
    console.log("Plano escolhido:", plano)
    // Aqui você pode redirecionar para checkout/pagamento
}
</script>

<template>
    <div class="max-w-7xl mx-auto py-6">
        <div class="max-w-xl mx-auto">
            <h2 class="text-2xl md:text-3xl font-bold text-center">Pague mensalmente sem complicações</h2>
            <p class="text-sm md:text-base text-center text-gray-500 mb-10">As cobranças são geradas no momento do
                pagamento, não
                sendo
                necessário cartão
                de
                crédito</p>
        </div>
        <div class="flex justify-center gap-4">
            <Card v-for="plano in planos" :key="plano.nome"
                :class="plano.destaque ? 'border-border border-2 w-96 shadow-xl scale-105' : ''">
                <CardHeader>
                    <CardTitle class="flex justify-between items-center text-2xl">
                        {{ plano.nome }}
                        <span v-if="plano.destaque"
                            class="text-sm bg-primary text-white font-thin px-2 py-1 rounded-md">
                            Mensal
                        </span>
                    </CardTitle>
                    <CardDescription>{{ plano.descricao }}</CardDescription>
                </CardHeader>

                <CardContent>
                    <p class="text-2xl font-bold mb-4">{{ plano.preco }}</p>
                    <ul class="space-y-2">
                        <li v-for="feat in plano.features" :key="feat" class="flex items-center">
                            <Check class="h-4 w-4 text-green-600 mr-2" /> {{ feat }}
                        </li>
                    </ul>
                </CardContent>

                <CardFooter>
                    <Button class="w-full text-white" @click="selecionarPlano(plano.nome)">
                        Assinar {{ plano.nome }}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    </div>
</template>
