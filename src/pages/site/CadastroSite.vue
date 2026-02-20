<template>
    <div class="min-h-screen grid lg:grid-cols-2">

        <!-- Lado Esquerdo (Imagem/Benefícios) -->
        <div class="hidden lg:flex flex-col justify-between bg-zinc-900 p-12 text-white relative overflow-hidden">
            <!-- Background Decoration -->
            <div class="absolute inset-0 z-0">
                <div
                    class="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2">
                </div>
                <div
                    class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2">
                </div>
            </div>

            <div class="relative z-10">
                <div class="flex items-center gap-2 mb-12">
                    <div
                        class="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-white border border-white/20">
                        G</div>
                    <span class="font-bold text-xl tracking-tight">Gestão Fácil</span>
                </div>

                <h1 class="text-5xl font-extrabold tracking-tight mb-8 leading-tight">
                    Comece sua jornada <br />
                    para o <span class="text-primary">sucesso</span>.
                </h1>

                <p class="text-xl text-zinc-400 max-w-md mb-12">
                    Junte-se a milhares de empreendedores que transformaram a gestão de seus negócios.
                </p>

                <div class="space-y-6">
                    <div class="flex items-start gap-4">
                        <div
                            class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <Rocket class="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 class="font-bold text-lg">Comece em minutos</h3>
                            <p class="text-zinc-400">Cadastro simplificado para você não perder tempo.</p>
                        </div>
                    </div>
                    <div class="flex items-start gap-4">
                        <div
                            class="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck class="w-6 h-6 text-green-500" />
                        </div>
                        <div>
                            <h3 class="font-bold text-lg">7 dias grátis</h3>
                            <p class="text-zinc-400">Teste todas as funcionalidades sem compromisso.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="relative z-10 mt-12 bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-sm">
                <div class="flex gap-1 text-yellow-500 mb-2">
                    <Star v-for="n in 5" :key="n" class="w-4 h-4 fill-current" />
                </div>
                <p class="text-lg italic mb-4">"Mudou completamente a forma como gerencio minha loja. Indispensável!"
                </p>
                <div class="flex items-center gap-3">
                    <Avatar>
                        <AvatarFallback>RC</AvatarFallback>
                    </Avatar>
                    <div>
                        <p class="font-bold text-sm">Ricardo Costa</p>
                        <p class="text-xs text-zinc-400">Loja de Informática</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Lado Direito (Formulário) -->
        <div class="bg-background flex flex-col justify-center p-6 lg:p-12 overflow-y-auto">
            <div class="max-w-md mx-auto w-full">
                <div class="lg:hidden mb-8">
                    <div class="flex items-center gap-2">
                        <div
                            class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                            G</div>
                        <span class="font-bold text-xl text-foreground">Gestão Fácil</span>
                    </div>
                </div>

                <div class="mb-8">
                    <h2 class="text-2xl font-bold mb-2">Crie sua conta</h2>
                    <p class="text-muted-foreground">Preencha os dados abaixo para começar seu teste gratuito.</p>
                </div>

                <!-- Stepper Visual -->
                <div class="flex items-center gap-2 mb-8">
                    <div v-for="s in 3" :key="s" class="h-2 flex-1 rounded-full transition-colors duration-300"
                        :class="step >= s ? 'bg-primary' : 'bg-muted'"></div>
                </div>

                <form @submit.prevent="submitForm" class="space-y-6">

                    <!-- Passo 1: Informações Pessoais -->
                    <div v-show="step === 1" class="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label for="firstName">Nome</Label>
                                <Input id="firstName" v-model="store.form.firstName" placeholder="Seu nome"
                                    :class="{ 'border-red-500': errors.firstName }" />
                                <span v-if="errors.firstName" class="text-xs text-red-500">Obrigatório</span>
                            </div>
                            <div class="space-y-2">
                                <Label for="lastName">Sobrenome</Label>
                                <Input id="lastName" v-model="store.form.lastName" placeholder="Seu sobrenome"
                                    :class="{ 'border-red-500': errors.lastName }" />
                                <span v-if="errors.lastName" class="text-xs text-red-500">Obrigatório</span>
                            </div>
                        </div>

                        <div class="space-y-2">
                            <Label for="email">E-mail</Label>
                            <Input id="email" type="email" v-model="store.form.email" placeholder="seu@email.com"
                                :class="{ 'border-red-500': errors.email }" />
                            <span v-if="errors.email" class="text-xs text-red-500">E-mail inválido</span>
                        </div>

                        <div class="space-y-2">
                            <Label for="phone">Telefone / WhatsApp</Label>
                            <Input id="phone" v-model="store.form.phone" v-maska="phoneMaskOptions"
                                placeholder="(00) 00000-0000" :class="{ 'border-red-500': errors.phone }" />
                            <span v-if="errors.phone" class="text-xs text-red-500">Obrigatório</span>
                        </div>

                        <div class="space-y-2">
                            <Label for="password">Senha</Label>
                            <Input id="password" type="password" v-model="store.form.password"
                                placeholder="Mínimo 6 caracteres" :class="{ 'border-red-500': errors.password }" />

                            <!-- Password Strength Bar -->
                            <div class="h-1.5 w-full bg-muted rounded-full overflow-hidden mt-2">
                                <div class="h-full transition-all duration-300" :class="strengthColor"
                                    :style="{ width: `${strength * 25}%` }"></div>
                            </div>
                            <p class="text-xs text-muted-foreground text-right">{{ strengthText }}</p>
                        </div>

                        <Button type="button" class="w-full" @click="nextStep">Continuar
                            <ArrowRight class="ml-2 w-4 h-4" />
                        </Button>
                    </div>

                    <!-- Passo 2: Dados da Empresa -->
                    <div v-show="step === 2" class="space-y-4 animate-in fade-in slide-in-from-right-8 duration-300">
                        <div class="space-y-2">
                            <Label for="storeName">Nome da Loja</Label>
                            <Input id="storeName" v-model="store.form.storeName" placeholder="Ex: Minha Loja Top"
                                :class="{ 'border-red-500': errors.storeName }" />
                            <span v-if="errors.storeName" class="text-xs text-red-500">Obrigatório</span>
                        </div>

                        <div class="space-y-2">
                            <Label for="segment">Segmento</Label>
                            <Select v-model="store.form.segment">
                                <SelectTrigger :class="{ 'border-red-500': errors.segment }">
                                    <SelectValue placeholder="Selecione o segmento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="moda">Moda e Vestuário</SelectItem>
                                    <SelectItem value="eletronicos">Eletrônicos e Informática</SelectItem>
                                    <SelectItem value="alimentacao">Alimentação e Bebidas</SelectItem>
                                    <SelectItem value="servicos">Prestação de Serviços</SelectItem>
                                    <SelectItem value="varejo">Varejo em Geral</SelectItem>
                                    <SelectItem value="outros">Outros</SelectItem>
                                </SelectContent>
                            </Select>
                            <span v-if="errors.segment" class="text-xs text-red-500">Obrigatório</span>
                        </div>

                        <div class="space-y-2">
                            <Label for="cnpj">CPF ou CNPJ (Opcional)</Label>
                            <Input id="cnpj" v-model="store.form.cnpj" v-maska="cpfCnpjMaskOptions"
                                placeholder="Apenas números" />
                        </div>

                        <div class="space-y-2">
                            <Label for="employees">Tamanho da Equipe</Label>
                            <Select v-model="store.form.employees">
                                <SelectTrigger :class="{ 'border-red-500': errors.employees }">
                                    <SelectValue placeholder="Quantas pessoas?" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">Apenas eu</SelectItem>
                                    <SelectItem value="5">2 a 5 pessoas</SelectItem>
                                    <SelectItem value="10">6 a 10 pessoas</SelectItem>
                                    <SelectItem value="20">Mais de 10</SelectItem>
                                </SelectContent>
                            </Select>
                            <span v-if="errors.employees" class="text-xs text-red-500">Obrigatório</span>
                        </div>

                        <div class="flex gap-3">
                            <Button type="button" variant="outline" class="flex-1" @click="prevStep">Voltar</Button>
                            <Button type="button" class="flex-1" @click="nextStep">Continuar</Button>
                        </div>
                    </div>

                    <!-- Passo 3: Confirmação -->
                    <div v-show="step === 3" class="space-y-6 animate-in fade-in slide-in-from-right-8 duration-300">
                        <div class="bg-muted/50 p-6 rounded-xl border space-y-3">
                            <h3 class="font-bold border-b pb-2 mb-2">Resumo</h3>
                            <div class="grid grid-cols-[100px_1fr] gap-2 text-sm">
                                <span class="text-muted-foreground">Nome:</span>
                                <span class="font-medium truncate">{{ store.form.firstName }} {{ store.form.lastName
                                    }}</span>

                                <span class="text-muted-foreground">Loja:</span>
                                <span class="font-medium truncate">{{ store.form.storeName }}</span>

                                <span class="text-muted-foreground">Email:</span>
                                <span class="font-medium truncate">{{ store.form.email }}</span>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div class="flex items-start gap-2">
                                <Checkbox id="terms" v-model:checked="store.form.terms" />
                                <label for="terms"
                                    class="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Aceito os <RouterLink to="/site/termos-politica" target="_blank"
                                        class="text-primary hover:underline">Termos de Uso</RouterLink> e <RouterLink
                                        to="/site/termos-politica" target="_blank" class="text-primary hover:underline">
                                        Política de Privacidade</RouterLink>.
                                </label>
                            </div>
                            <span v-if="errors.terms" class="text-xs text-red-500 block mt-1">Você precisa aceitar os
                                termos</span>

                            <div class="flex items-center gap-2">
                                <Checkbox id="newsletter" v-model:checked="store.form.newsletter" />
                                <Label for="newsletter" class="font-normal">Quero receber dicas e novidades.</Label>
                            </div>
                        </div>

                        <div class="flex gap-3">
                            <Button type="button" variant="outline" class="flex-1" @click="prevStep">Voltar</Button>
                            <Button type="submit" class="flex-1" :disabled="loading">
                                <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                                <span v-else>Finalizar Cadastro</span>
                            </Button>
                        </div>
                    </div>

                </form>

                <p class="text-center text-sm text-muted-foreground mt-8">
                    Já tem uma conta?
                    <RouterLink to="/login" class="text-primary hover:underline font-medium">Fazer Login</RouterLink>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { vMaska } from 'maska/vue'
import { cpfCnpjMaskOptions, phoneMaskOptions } from '@/lib/imaska'
import { useAccountCreateStore } from '@/stores/login/useCreateAccount'
import { ContaRepository } from '@/repositories/conta-repository'

// UI Components
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Rocket, ShieldCheck, ArrowRight, Star, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const toast = useToast()
const store = useAccountCreateStore()

const step = ref(1)
const loading = ref(false)

const errors = ref({
    firstName: false,
    lastName: false,
    email: false,
    phone: false,
    password: false,
    storeName: false,
    segment: false,
    employees: false,
    terms: false
})

const strength = computed(() => {
    let score = 0
    const pwd = store.form.password || ''
    if (pwd.length >= 6) score++
    if (/[A-Z]/.test(pwd)) score++
    if (/[0-9]/.test(pwd)) score++
    if (/[^A-Za-z0-9]/.test(pwd)) score++
    return score
})

const strengthText = computed(() => {
    if (!store.form.password) return ''
    if (strength.value <= 1) return 'Senha Fraca'
    if (strength.value === 2) return 'Senha Média'
    if (strength.value >= 3) return 'Senha Forte'
    return ''
})

const strengthColor = computed(() => {
    if (strength.value <= 1) return 'bg-red-500'
    if (strength.value === 2) return 'bg-yellow-500'
    return 'bg-green-500'
})

const validateStep1 = () => {
    errors.value.firstName = !store.form.firstName
    errors.value.lastName = !store.form.lastName
    errors.value.email = !store.form.email || !/^\S+@\S+\.\S+$/.test(store.form.email)
    errors.value.phone = !store.form.phone
    errors.value.password = !store.form.password || store.form.password.length < 6

    return !errors.value.firstName && !errors.value.lastName && !errors.value.email && !errors.value.phone && !errors.value.password
}

const validateStep2 = () => {
    errors.value.storeName = !store.form.storeName
    errors.value.segment = !store.form.segment
    errors.value.employees = !store.form.employees

    return !errors.value.storeName && !errors.value.segment && !errors.value.employees
}

const validateStep3 = () => {
    errors.value.terms = !store.form.terms
    return !errors.value.terms
}

const nextStep = () => {
    if (step.value === 1 && validateStep1()) step.value++
    else if (step.value === 2 && validateStep2()) step.value++
}

const prevStep = () => {
    if (step.value > 1) step.value--
}

const submitForm = async () => {
    if (!validateStep3()) return

    loading.value = true
    try {
        await ContaRepository.create({
            nome: `${store.form.firstName} ${store.form.lastName}`,
            cpfCnpj: store.form.cnpj,
            conta: store.form.storeName,
            telefone: store.form.phone,
            dicasNovidades: store.form.newsletter,
            email: store.form.email,
            senha: store.form.password,
            funcionarios: Number(store.form.employees),
            tipo: store.form.segment
        })
        toast.success("Conta criada com sucesso! Faça login para continuar.")
        router.push("/login")
    } catch (error) {
        console.error(error)
        toast.error("Erro ao criar conta. Verifique os dados e tente novamente.")
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    // Reset or init logic if needed
})
</script>