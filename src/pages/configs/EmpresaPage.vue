<template>
    <Card class="rounded-t-none bg-background">
        <CardHeader>
            <CardTitle>Dados da empresa</CardTitle>
            <CardDescription>Informações exibidas em notas, recibos e relatórios.</CardDescription>
        </CardHeader>

        <form @submit.prevent="submitForm">
            <CardContent class="grid md:grid-cols-2 gap-6">
                <div class="space-y-2">
                    <Label for="razao">Razão Social *</Label>
                    <Input id="razao" placeholder="Empresa LTDA" required v-model="form.nome" />
                </div>
                <div class="space-y-2">
                    <Label for="fantasia">Nome Fantasia</Label>
                    <Input id="fantasia" placeholder="Nome fantasia" v-model="form.nomeFantasia" />
                </div>
                <div class="space-y-2">
                    <Label for="cnpj">CNPJ/CPF *</Label>
                    <Input id="cnpj" v-model="form.documento" required placeholder="00.000.000/0001-00" />
                </div>
                <div class="space-y-2">
                    <Label for="categoria">Categoria</Label>
                    <Input id="categoria" placeholder="Categoria de atividade" v-model="form.tipo" />
                </div>
                <div class="space-y-2">
                    <Label for="endereco">Endereço</Label>
                    <Input id="endereco" placeholder="Endereço completo" v-model="form.endereco" />
                </div>
                <div class="space-y-2">
                    <Label for="cep">CEP</Label>
                    <Input id="cep" placeholder="CEP" v-model="form.cep" />
                </div>
                <div class="space-y-2">
                    <Label for="telefone">Telefone</Label>
                    <Input id="telefone" placeholder="(00) 0000-0000" v-model="form.telefone" />
                </div>
                <div class="space-y-2">
                    <Label for="email">E-mail</Label>
                    <Input id="email" disabled placeholder="seu@email.com" type="email" v-model="form.email" />
                </div>
            </CardContent>

            <CardFooter class="justify-end">
                <Button type="submit" class="ml-2">
                    <CircleCheck /> Salvar
                </Button>
            </CardFooter>
        </form>
    </Card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContaRepository, type UpdateConta } from '@/repositories/conta-repository'
import { useToast } from 'vue-toastification'
import { CircleCheck } from 'lucide-vue-next'
const toast = useToast()

const form = ref<Partial<UpdateConta & { email: string, cep: string }>>({
    documento: "",
    endereco: "",
    nome: "",
    nomeFantasia: "",
    telefone: "",
    tipo: "",
    cep: "",
    email: "",
})

const submitForm = async () => {
    try {
        await ContaRepository.update(form.value)
        toast.success("Dados atualizados com sucesso")
    } catch (error) {
        console.error(error)
        toast.error("Erro ao atualizar os dados")
    }
}

async function getDataConta() {
    try {
        const response = await ContaRepository.detalhes()
        Object.assign(form.value, {
            nome: response.nome,
            documento: response.documento,
            nomeFantasia: response.nomeFantasia,
            telefone: response.telefone,
            endereco: response.endereco,
            tipo: response.tipo,
            cep: response.cep,
            email: response.email
        })
    } catch (error) {
        console.error(error)
    }
}

onMounted(getDataConta)
</script>
