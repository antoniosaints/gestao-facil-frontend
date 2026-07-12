<template>
    <div class="min-h-screen grid lg:grid-cols-2">

        <!-- Lado Esquerdo (Marca / Valor) -->
        <div class="hidden lg:flex flex-col justify-between bg-zinc-950 p-12 xl:p-16 text-white relative overflow-hidden">
            <!-- Background decoration -->
            <div class="absolute inset-0 z-0">
                <div
                    class="absolute top-0 right-0 h-[520px] w-[520px] -translate-y-1/3 translate-x-1/3 rounded-full bg-primary/25 blur-[130px] animate-pulse-slow">
                </div>
                <div class="absolute bottom-0 left-0 h-[520px] w-[520px] translate-y-1/3 -translate-x-1/3 rounded-full bg-blue-600/20 blur-[130px] animate-pulse-slow"
                    style="animation-delay: 2s"></div>
                <div
                    class="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:40px_40px]">
                </div>
            </div>

            <!-- Marca -->
            <div class="relative z-10 flex items-center gap-3">
                <img src="/imgs/logo.png" alt="Gestão Fácil" class="h-11 w-11 rounded-xl" />
                <span class="text-lg font-bold tracking-tight">Gestão Fácil</span>
            </div>

            <!-- Headline + features -->
            <div class="relative z-10 max-w-xl space-y-10">
                <div class="space-y-5">
                    <span
                        class="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur-sm">
                        <span class="relative flex h-2 w-2">
                            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75"></span>
                            <span class="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                        </span>
                        7 dias grátis · sem cartão de crédito
                    </span>
                    <h1 class="text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
                        Comece sua jornada<br />para o <span class="text-primary">sucesso</span>.
                    </h1>
                    <p class="max-w-md text-lg text-zinc-400">
                        Crie sua conta e organize vendas, estoque e financeiro em uma única plataforma —
                        do balcão ao caixa.
                    </p>
                </div>

                <!-- Feature grid -->
                <ul class="grid max-w-lg grid-cols-2 gap-3">
                    <li v-for="f in features" :key="f.title"
                        class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-colors hover:border-white/20 hover:bg-white/[0.07]">
                        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                            <component :is="f.icon" class="h-5 w-5" />
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm font-semibold leading-tight">{{ f.title }}</p>
                            <p class="truncate text-xs text-zinc-400">{{ f.desc }}</p>
                        </div>
                    </li>
                </ul>
            </div>

            <!-- Trust row -->
            <div class="relative z-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-6 text-sm text-zinc-400">
                <div v-for="t in trust" :key="t.label" class="flex items-center gap-2">
                    <component :is="t.icon" class="h-4 w-4 text-primary" />
                    <span>{{ t.label }}</span>
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

                        <div class="space-y-2">
                            <Label for="indicacao">Código de indicação <span class="text-muted-foreground">(opcional)</span></Label>
                            <Input id="indicacao" v-model="store.form.indicacao" placeholder="Recebeu um convite? Digite o código"
                                class="uppercase" />
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
                                <Checkbox id="terms" v-model="store.form.terms" />
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
                                <Checkbox id="newsletter" v-model="store.form.newsletter" />
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
import { useRoute, useRouter } from 'vue-router'
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
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
    ArrowRight, Loader2,
    ScanLine, Boxes, Wallet, LineChart,
    ShieldCheck, DatabaseBackup, Headset,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const toast = useToast()
const store = useAccountCreateStore()

const features = [
    { icon: ScanLine, title: 'Vendas e PDV', desc: 'Caixa rápido e cupom' },
    { icon: Boxes, title: 'Estoque', desc: 'Controle em tempo real' },
    { icon: Wallet, title: 'Financeiro', desc: 'Fluxo de caixa e DRE' },
    { icon: LineChart, title: 'Relatórios', desc: 'Decisões com dados' },
]

const trust = [
    { icon: ShieldCheck, label: 'Dados criptografados' },
    { icon: DatabaseBackup, label: 'Backup diário' },
    { icon: Headset, label: 'Suporte dedicado' },
]

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
            tipo: store.form.segment,
            indicacao: store.form.indicacao?.trim() || undefined,
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
    // Captura o código de indicação do link (?ref=CODIGO) automaticamente.
    const ref = route.query.ref
    if (typeof ref === 'string' && ref.trim()) {
        store.form.indicacao = ref.trim().toUpperCase()
    }
})
</script>