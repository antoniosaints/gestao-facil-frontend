<template>
    <Card>
        <CardHeader>
            <CardTitle>Dados da empresa</CardTitle>
            <CardDescription>Informações exibidas em notas, recibos e relatórios.</CardDescription>
        </CardHeader>
        <CardContent>
            <form class="grid md:grid-cols-2 gap-6">
                <div class="space-y-2">
                    <Label for="razao">Razão Social</Label>
                    <Input id="razao" placeholder="Empresa LTDA" v-model="form.razao" />
                </div>
                <div class="space-y-2">
                    <Label for="fantasia">Nome Fantasia</Label>
                    <Input id="fantasia" placeholder="Nome fantasia" v-model="form.fantasia" />
                </div>
                <div class="space-y-2">
                    <Label for="cnpj">CNPJ</Label>
                    <Input id="cnpj" v-model="form.cnpj" placeholder="00.000.000/0001-00" />
                </div>
                <div class="space-y-2">
                    <Label for="ie">Inscrição Estadual</Label>
                    <Input id="ie" placeholder="Inscrição estadual" v-model="form.ie" />
                </div>
                <div class="space-y-2 md:col-span-2">
                    <Label for="endereco">Endereço</Label>
                    <Input id="endereco" placeholder="Endereço completo" v-model="form.endereco" />
                </div>
                <div class="space-y-2">
                    <Label for="telefone">Telefone</Label>
                    <Input id="telefone" placeholder="(00) 0000-0000" v-model="form.telefone" />
                </div>
                <div class="space-y-2">
                    <Label for="email">E-mail</Label>
                    <Input id="email" placeholder="seu@email.com" type="email" v-model="form.email" />
                </div>
            </form>
        </CardContent>
        <CardFooter class="justify-end">
            <Button type="button" variant="outline" @click="reset">Cancelar</Button>
            <Button type="submit" class="ml-2">Salvar</Button>
        </CardFooter>
    </Card>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ref } from 'vue'

const form = ref({
    razao: "",
    fantasia: "",
    cnpj: "",
    ie: "",
    endereco: "",
    telefone: "",
    email: "",
})

const reset = () => {
    Object.assign(form.value = {
        razao: "",
        fantasia: "",
        cnpj: "",
        ie: "",
        endereco: "",
        telefone: "",
        email: "",
    })
    window.scrollTo(0, 0)
}
</script>