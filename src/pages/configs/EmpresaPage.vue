<template>
    <Card class="rounded-t-none bg-background">
        <CardHeader>
            <CardTitle class="font-normal">Dados da empresa</CardTitle>
            <CardDescription>Informações exibidas em notas, recibos e relatórios.</CardDescription>
        </CardHeader>

        <form @submit.prevent="submitForm">
            <CardContent class="grid md:grid-cols-2 gap-4">
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
                    <Input id="cnpj" v-maska="cpfCnpjMaskOptions" v-model="form.documento" required
                        placeholder="00.000.000/0001-00" />
                </div>
                <div class="space-y-2">
                    <Label for="categoria">Categoria</Label>
                    <Select v-model="form.tipo" required>
                        <SelectTrigger class="w-full">
                            <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value="moda">Moda e Vestuário</SelectItem>
                                <SelectItem value="assistencia">Assistência Técnica</SelectItem>
                                <SelectItem value="eletronicos">Eletrônicos</SelectItem>
                                <SelectItem value="alimentacao">Alimentação</SelectItem>
                                <SelectItem value="joias">Joias e Acessórios</SelectItem>
                                <SelectItem value="farmacia">Farmácia</SelectItem>
                                <SelectItem value="casa">Casa e Decoração</SelectItem>
                                <SelectItem value="beleza">Beleza e Cosméticos</SelectItem>
                                <SelectItem value="esportes">Esportes</SelectItem>
                                <SelectItem value="telecom">Telecomunicações</SelectItem>
                                <SelectItem value="outros">Outros</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <!-- <div class="space-y-2">
                    <Label for="linkColor">Cor do link</Label>
                    <Select required>
                        <SelectTrigger class="w-full">
                            <SelectValue placeholder="Selecione uma cor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem v-for="cor in DEFAULT_COLORS" :key="cor.hex" :value="cor.hex">
                                    <div class="flex items-center gap-2">
                                        <div class="w-5 h-5 rounded border" :style="{ backgroundColor: cor.hex }" />
                                        <div class="flex-1 text-sm">{{ cor.name }}</div>
                                        <div class="text-xs text-muted-foreground">{{ cor.hex }}</div>
                                    </div>
                                </SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div> -->
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
                    <Input id="telefone" v-maska="phoneMaskOptions" placeholder="(00) 0000-0000"
                        v-model="form.telefone" />
                </div>
                <div class="space-y-2">
                    <Label for="email">E-mail</Label>
                    <Input id="email" disabled placeholder="seu@email.com" type="email" v-model="form.email" />
                </div>
            </CardContent>

            <CardFooter class="justify-end">
                <Button :disabled="loading" type="submit" class="ml-2 text-white">
                    <CircleCheck v-if="!loading" />
                    <LoaderIcon v-if="loading" class="animate-spin" />
                    {{ loading ? 'Salvando...' : 'Salvar' }}
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
import { CircleCheck, LoaderIcon } from 'lucide-vue-next'
import { vMaska } from 'maska/vue'
import { cpfCnpjMaskOptions, phoneMaskOptions } from '@/lib/imaska'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUiStore } from '@/stores/ui/uiStore'
const toast = useToast()
const storeUi = useUiStore()
const loading = ref(false)
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

type ColorItem = { name: string; hex: string };

const DEFAULT_COLORS: ColorItem[] = [
    { name: "Black", hex: "#000000" },
    { name: "White", hex: "#FFFFFF" },
    { name: "Gray", hex: "#6B7280" },
    { name: "Red", hex: "#EF4444" },
    { name: "Orange", hex: "#F97316" },
    { name: "Amber", hex: "#F59E0B" },
    { name: "Yellow", hex: "#EAB308" },
    { name: "Lime", hex: "#84CC16" },
    { name: "Green", hex: "#22C55E" },
    { name: "Emerald", hex: "#10B981" },
    { name: "Teal", hex: "#14B8A6" },
    { name: "Cyan", hex: "#06B6D4" },
    { name: "Sky", hex: "#0EA5E9" },
    { name: "Blue", hex: "#3B82F6" },
    { name: "Indigo", hex: "#6366F1" },
    { name: "Violet", hex: "#8B5CF6" },
    { name: "Purple", hex: "#A78BFA" },
    { name: "Pink", hex: "#EC4899" },
    { name: "Rose", hex: "#F43F5E" },
];


const submitForm = async () => {
    try {
        loading.value = true
        await ContaRepository.update(form.value)
        await storeUi.getDataUsuario()
        toast.success("Dados atualizados com sucesso")
    } catch (error) {
        console.error(error)
        toast.error("Erro ao atualizar os dados")
    } finally {
        loading.value = false
    }
}

async function getDataConta() {
    try {
        loading.value = true
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
    } finally {
        loading.value = false
    }
}

onMounted(getDataConta)
</script>
