<template>
    <div class="min-h-screen bg-background font-sans text-foreground overflow-x-hidden selection:bg-primary/20">

        <!-- Navbar Flutuante -->
        <header
            class="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40 transition-all duration-300"
            :class="{ 'shadow-sm': isScrolled }">
            <div class="container mx-auto px-4 h-16 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div
                        class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                        G
                    </div>
                    <span class="font-bold text-xl tracking-tight">Gestão Fácil</span>
                </div>

                <nav class="hidden md:flex items-center gap-8">
                    <RouterLink :to="{ path: '/site', hash: '#features' }"
                        class="text-sm font-medium hover:text-primary transition-colors">Funcionalidades</RouterLink>
                    <RouterLink :to="{ path: '/site', hash: '#depoimentos' }"
                        class="text-sm font-medium hover:text-primary transition-colors">Depoimentos</RouterLink>
                    <RouterLink :to="{ path: '/site', hash: '#precos' }"
                        class="text-sm font-medium hover:text-primary transition-colors">Preços</RouterLink>
                    <RouterLink :to="{ path: '/site', hash: '#faq' }"
                        class="text-sm font-medium hover:text-primary transition-colors">FAQ</RouterLink>
                </nav>

                <div class="flex items-center gap-4">
                    <RouterLink to="/login">
                        <Button variant="ghost" class="hidden sm:flex">Entrar</Button>
                    </RouterLink>
                    <RouterLink to="/site/cadastro">
                        <Button class="text-white dark:text-white font-bold">Começar Grátis</Button>
                    </RouterLink>
                </div>
            </div>
        </header>

        <!-- Hero Section -->
        <section
            class="relative pt-32 flex flex-col justify-center items-center pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
            <!-- Background Gradients -->
            <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
                <div
                    class="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-[100px] animate-pulse-slow">
                </div>
                <div class="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow"
                    style="animation-delay: 2s"></div>
            </div>

            <div class="container relative z-10 px-4 text-center">
                <div
                    class="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground mb-8 animate-fade-in-up">
                    <span class="relative flex h-2 w-2">
                        <span
                            class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    Sistema de Gestão 100% Online
                </div>

                <h1 class="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in-up"
                    style="animation-delay: 100ms">
                    Simplifique a gestão da sua <br class="hidden md:block" />
                    <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-600">Loja ou
                        Empresa</span>
                </h1>

                <p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in-up"
                    style="animation-delay: 200ms">
                    Controle estoque, financeiro, vendas e emissão de notas fiscais em uma única plataforma intuitiva.
                    Experimente grátis e transforme seu negócio hoje.
                </p>

                <div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up"
                    style="animation-delay: 300ms">
                    <RouterLink to="/site/cadastro">
                        <Button size="lg"
                            class="h-14 px-8 text-lg shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all rounded-full text-white dark:text-white font-bold">
                            Criar Conta Grátis
                            <ArrowRight class="ml-2 h-5 w-5" />
                        </Button>
                    </RouterLink>
                    <a href="#video-demo">
                        <Button variant="outline" size="lg" class="h-14 px-8 text-lg rounded-full">
                            <PlayCircle class="mr-2 h-5 w-5" />
                            Ver Demonstração
                        </Button>
                    </a>
                </div>

                <!-- Dashboard Preview -->
                <div class="mt-16 md:mt-24 relative max-w-5xl mx-auto animate-fade-in-up"
                    style="animation-delay: 500ms">
                    <div class="rounded-xl border bg-card/50 backdrop-blur-sm shadow-2xl p-2 md:p-4">
                        <img src="/imgs/dashboard.png" alt="Dashboard Preview"
                            class="rounded-lg w-full h-auto shadow-sm border" loading="lazy" />
                        <!-- Fallback if image missing, uses a div -->
                        <div v-if="imgError"
                            class="absolute inset-0 flex items-center justify-center bg-muted rounded-lg text-muted-foreground">
                            <span class="text-sm">Preview do Sistema (Imagem não encontrada)</span>
                        </div>
                    </div>
                    <!-- Floating Cards -->
                    <div
                        class="absolute -right-4 md:-right-12 top-1/4 bg-card p-4 rounded-xl shadow-xl border animate-float hidden md:block">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <TrendingUp class="w-5 h-5" />
                            </div>
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Vendas Hoje</p>
                                <p class="text-lg font-bold">R$ 4.250,00</p>
                            </div>
                        </div>
                    </div>
                    <div
                        class="absolute -left-4 md:-left-12 bottom-1/4 bg-card p-4 rounded-xl shadow-xl border animate-float-delayed hidden md:block">
                        <div class="flex items-center gap-3">
                            <div
                                class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <Users class="w-5 h-5" />
                            </div>
                            <div>
                                <p class="text-sm font-medium text-muted-foreground">Novos Clientes</p>
                                <p class="text-lg font-bold">+128</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section id="features" class="py-20 bg-muted/30">
            <div class="container mx-auto px-4">
                <div class="text-center max-w-3xl mx-auto mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold mb-4">Tudo que você precisa para crescer</h2>
                    <p class="text-muted-foreground text-lg">Uma suíte completa de ferramentas projetadas para
                        simplificar cada aspecto do seu negócio.</p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Card v-for="(feature, index) in features" :key="index"
                        class="border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                        <CardHeader>
                            <div
                                class="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                <component :is="feature.icon" class="w-6 h-6" />
                            </div>
                            <CardTitle class="text-xl">{{ feature.title }}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-muted-foreground">{{ feature.description }}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <!-- Solução para Variados Nichos -->
        <section class="py-20 relative overflow-hidden">
            <div class="container mx-auto px-4">
                <div class="grid lg:grid-cols-2 gap-12 items-center">
                    <div class="order-2 lg:order-1 relative">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-4 mt-8">
                                <div class="bg-card p-6 rounded-2xl shadow-lg border">
                                    <Smartphone class="w-8 h-8 text-purple-500 mb-3" />
                                    <h3 class="font-bold mb-1">Eletrônicos</h3>
                                    <p class="text-xs text-muted-foreground">Controle de serial e garantia</p>
                                </div>
                                <div class="bg-card p-6 rounded-2xl shadow-lg border">
                                    <Shirt class="w-8 h-8 text-pink-500 mb-3" />
                                    <h3 class="font-bold mb-1">Vestuário</h3>
                                    <p class="text-xs text-muted-foreground">Grade de cor e tamanho</p>
                                </div>
                            </div>
                            <div class="space-y-4">
                                <div class="bg-card p-6 rounded-2xl shadow-lg border">
                                    <Hammer class="w-8 h-8 text-orange-500 mb-3" />
                                    <h3 class="font-bold mb-1">Serviços</h3>
                                    <p class="text-xs text-muted-foreground">Ordem de serviço completa</p>
                                </div>
                                <div class="bg-card p-6 rounded-2xl shadow-lg border">
                                    <ShoppingBasket class="w-8 h-8 text-green-500 mb-3" />
                                    <h3 class="font-bold mb-1">Varejo</h3>
                                    <p class="text-xs text-muted-foreground">PDV rápido e eficiente</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="order-1 lg:order-2">
                        <h2 class="text-3xl md:text-4xl font-bold mb-6">Adaptável ao seu modelo de negócio</h2>
                        <p class="text-lg text-muted-foreground mb-6">
                            Não importa o tamanho ou o segmento da sua empresa, o Gestão Fácil se adapta às suas
                            necessidades específicas com configurações flexíveis e modulares.
                        </p>
                        <ul class="space-y-3">
                            <li v-for="item in benefits" :key="item" class="flex items-center gap-3">
                                <CheckCircle2 class="w-5 h-5 text-primary flex-shrink-0" />
                                <span>{{ item }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- Pricing Section -->
        <section id="precos" class="py-20 bg-muted/30">
            <div class="container mx-auto px-4">
                <div class="text-center max-w-2xl mx-auto mb-16">
                    <h2 class="text-3xl md:text-4xl font-bold mb-4">Investimento que se paga</h2>
                    <p class="text-muted-foreground text-lg">Escolha o plano ideal para sua empresa. Sem taxas
                        escondidas.</p>
                </div>

                <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                    <!-- Plano Inicial -->
                    <Card class="border-2 hover:border-border transition-colors">
                        <CardHeader>
                            <CardTitle class="text-2xl">Básico</CardTitle>
                            <CardDescription>Para quem está começando</CardDescription>
                            <div class="mt-4">
                                <span class="text-4xl font-bold">R$ 49</span>
                                <span class="text-muted-foreground">/mês</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <RouterLink to="/site/cadastro">
                                <Button variant="outline" class="w-full mb-6">Começar Agora</Button>
                            </RouterLink>
                            <ul class="space-y-3 text-sm">
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> 1 Usuário
                                </li>
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> Até 100 Vendas/mês
                                </li>
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> Controle de Estoque Básico
                                </li>
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> Suporte por Email
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <!-- Plano Recomendado -->
                    <Card class="border-2 border-primary relative shadow-2xl scale-105 z-10">
                        <div
                            class="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold shadow-sm">
                            MAIS POPULAR
                        </div>
                        <CardHeader>
                            <CardTitle class="text-2xl text-primary">Profissional</CardTitle>
                            <CardDescription>Para empresas em crescimento</CardDescription>
                            <div class="mt-4">
                                <span class="text-4xl font-bold">R$ 99</span>
                                <span class="text-muted-foreground">/mês</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <RouterLink to="/site/cadastro">
                                <Button class="w-full mb-6 text-lg h-12 text-white dark:text-white font-bold">Teste
                                    Grátis</Button>
                            </RouterLink>
                            <ul class="space-y-3 font-medium">
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> 5 Usuários
                                </li>
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> Vendas Ilimitadas
                                </li>
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> Financeiro Completo
                                </li>
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> Emissão de Boletos
                                </li>
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> Suporte WhatsApp Prioritário
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <!-- Plano Enterprise -->
                    <Card class="border-2 hover:border-border transition-colors">
                        <CardHeader>
                            <CardTitle class="text-2xl">Premium</CardTitle>
                            <CardDescription>Para grandes operações</CardDescription>
                            <div class="mt-4">
                                <span class="text-4xl font-bold">R$ 199</span>
                                <span class="text-muted-foreground">/mês</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <RouterLink to="/site/cadastro">
                                <Button variant="outline" class="w-full mb-6">Falar com Consultor</Button>
                            </RouterLink>
                            <ul class="space-y-3 text-sm">
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> Usuários Ilimitados
                                </li>
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> Multi-lojas (Filiais)
                                </li>
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> API de Integração
                                </li>
                                <li class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500" /> Gerente de Conta Dedicado
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <!-- Depoimentos -->
        <section id="depoimentos" class="py-20">
            <div class="container mx-auto px-4">
                <h2 class="text-3xl font-bold text-center mb-12">O que dizem nossos parceiros</h2>
                <div class="grid md:grid-cols-3 gap-6">
                    <div v-for="(t, i) in testimonials" :key="i" class="bg-card p-6 rounded-xl border shadow-sm">
                        <div class="flex gap-1 text-yellow-500 mb-4">
                            <Star v-for="n in 5" :key="n" class="w-4 h-4 fill-current" />
                        </div>
                        <p class="text-muted-foreground mb-6">"{{ t.text }}"</p>
                        <div class="flex items-center gap-3">
                            <Avatar class="h-10 w-10">
                                <AvatarFallback>{{ t.initials }}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p class="font-bold text-sm">{{ t.name }}</p>
                                <p class="text-xs text-muted-foreground">{{ t.company }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-zinc-950 text-zinc-300 dark:bg-black py-16 border-t border-white/10 dark:border-border">
            <div class="container mx-auto px-4">
                <div class="grid md:grid-cols-4 gap-8 mb-12">
                    <div class="col-span-1 md:col-span-2">
                        <div class="flex items-center gap-2 mb-4">
                            <div
                                class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                                G</div>
                            <span class="font-bold text-xl tracking-tight text-white dark:text-foreground">Gestão
                                Fácil</span>
                        </div>
                        <p class="text-zinc-400 max-w-sm">Sistema completo para impulsionar suas vendas e
                            organizar sua empresa. Simples, rápido e eficiente.</p>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4 text-white dark:text-foreground">Produto</h4>
                        <ul class="space-y-2 text-sm text-zinc-400">
                            <li>
                                <RouterLink :to="{ path: '/site', hash: '#features' }"
                                    class="hover:text-primary transition-colors">Funcionalidades</RouterLink>
                            </li>
                            <li>
                                <RouterLink :to="{ path: '/site', hash: '#precos' }"
                                    class="hover:text-primary transition-colors">Preços</RouterLink>
                            </li>
                            <li>
                                <RouterLink :to="{ path: '/site', hash: '#features' }"
                                    class="hover:text-primary transition-colors">Atualizações</RouterLink>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4 text-white dark:text-foreground">Legal</h4>
                        <ul class="space-y-2 text-sm text-zinc-400">
                            <li>
                                <RouterLink to="/site/termos-politica" class="hover:text-primary transition-colors">
                                    Termos
                                    de Uso</RouterLink>
                            </li>
                            <li>
                                <RouterLink to="/site/termos-politica" class="hover:text-primary transition-colors">
                                    Privacidade</RouterLink>
                            </li>
                            <li><a href="#" class="hover:text-primary transition-colors">Contato</a></li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-white/10 pt-8 text-center text-sm text-zinc-500">
                    &copy; {{ new Date().getFullYear() }} Gestão Fácil ERP. Todos os direitos reservados.
                </div>
            </div>
        </footer>

    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    ArrowRight, PlayCircle, TrendingUp, Users, Smartphone, Shirt, Hammer,
    ShoppingBasket, CheckCircle2, Check, Star,
    Box, Wallet, FileBarChart, Layers
} from 'lucide-vue-next'

const isScrolled = ref(false)
const imgError = ref(false)

const handleScroll = () => {
    isScrolled.value = window.scrollY > 20
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
})

const features = [
    {
        title: 'Gestão de Estoque',
        description: 'Acompanhe entradas e saídas em tempo real, defina alertas de estoque mínimo e evite perdas.',
        icon: Box
    },
    {
        title: 'Controle Financeiro',
        description: 'Fluxo de caixa, contas a pagar e receber, DRE gerencial e relatórios detalhados.',
        icon: Wallet
    },
    {
        title: 'Relatórios Inteligentes',
        description: 'Tome decisões baseadas em dados com dashboards intuitivos e exportáveis.',
        icon: FileBarChart
    },
    {
        title: 'Multi-plataforma',
        description: 'Acesse de qualquer lugar, seja no computador, tablet ou celular.',
        icon: Layers
    },
    {
        title: 'PDV Frente de Caixa',
        description: 'Venda rápida integrada com leitor de código de barras e emissão de comprovantes.',
        icon: ShoppingBasket
    },
    {
        title: 'Nota Fiscal',
        description: 'Emissão descomplicada de NFC-e e NF-e integrada ao seu estoque e financeiro.',
        icon: CheckCircle2
    }
]

const benefits = [
    'Sem custo de implementação',
    'Suporte técnico especializado',
    'Backup automático diário',
    'Atualizações gratuitas constantes'
]

const testimonials = [
    {
        text: "Melhor sistema que já usei na minha loja de roupas. Simples e resolve tudo.",
        name: "Carla Dias",
        company: "Boutique Elegance",
        initials: "CD"
    },
    {
        text: "O controle financeiro salvou minha empresa. Consigo ver exatamente onde estou gastando.",
        name: "Roberto Júnior",
        company: "RJ Tech",
        initials: "RJ"
    },
    {
        text: "Suporte nota 10! Sempre que preciso, resolvem meu problema em minutos.",
        name: "Fernanda Costa",
        company: "Mercadinho da Villa",
        initials: "FC"
    }
]
</script>

<style scoped>
.animate-pulse-slow {
    animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-20px);
    }
}

.animate-float {
    animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
    animation: float 6s ease-in-out infinite;
    animation-delay: 3s;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
    opacity: 0;
}
</style>