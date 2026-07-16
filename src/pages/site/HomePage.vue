<template>
    <div class="min-h-screen bg-background font-sans text-foreground overflow-x-hidden selection:bg-primary/20">

        <!-- Navbar -->
        <header class="fixed top-0 w-full z-50 transition-all duration-300"
            :class="isScrolled ? 'bg-background/80 backdrop-blur-md border-b border-border/60 shadow-sm' : 'bg-transparent'">
            <div class="container mx-auto px-4 h-16 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <img src="/imgs/logo.png" alt="Gestão Fácil" class="w-8 h-8 rounded-lg object-contain"
                        @error="logoError = true" v-if="!logoError" />
                    <div v-else
                        class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                        G
                    </div>
                    <span class="font-bold text-xl tracking-tight">Gestão Fácil</span>
                </div>

                <nav class="hidden md:flex items-center gap-8">
                    <RouterLink :to="{ path: '/site', hash: '#features' }"
                        class="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Funcionalidades</RouterLink>
                    <RouterLink :to="{ path: '/site', hash: '#apps' }"
                        class="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Apps</RouterLink>
                    <RouterLink :to="{ path: '/site', hash: '#precos' }"
                        class="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Preços</RouterLink>
                    <RouterLink :to="{ path: '/site', hash: '#faq' }"
                        class="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</RouterLink>
                </nav>

                <div class="flex items-center gap-3">
                    <RouterLink to="/login">
                        <Button variant="ghost" class="hidden sm:flex">Entrar</Button>
                    </RouterLink>
                    <RouterLink to="/site/cadastro">
                        <Button class="text-white dark:text-white font-semibold rounded-full">Começar grátis</Button>
                    </RouterLink>
                </div>
            </div>
        </header>

        <!-- Hero -->
        <section class="relative pt-28 lg:pt-36 pb-16 lg:pb-24 overflow-hidden">
            <div class="absolute inset-0 -z-10 pointer-events-none">
                <div class="absolute top-10 left-1/4 w-[28rem] h-[28rem] bg-primary/15 rounded-full blur-[130px]"></div>
                <div class="absolute -bottom-10 right-1/4 w-[26rem] h-[26rem] bg-blue-400/10 rounded-full blur-[130px]"></div>
            </div>

            <div class="container mx-auto px-4 text-center">
                <div
                    class="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground mb-8 animate-fade-in-up">
                    <span class="relative flex h-2 w-2">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    {{ hero.badge }}
                </div>

                <h1 class="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6 animate-fade-in-up"
                    style="animation-delay: 100ms">
                    {{ heroTitlePrefix }} <br v-if="showHeroBreak" class="hidden md:block" />
                    <span v-if="heroHighlight" class="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">{{ heroHighlight }}</span>
                </h1>

                <p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-in-up"
                    style="animation-delay: 200ms">
                    {{ hero.subtitle }}
                </p>

                <div class="flex flex-col sm:flex-row gap-3 justify-center items-center animate-fade-in-up"
                    style="animation-delay: 300ms">
                    <RouterLink to="/site/cadastro">
                        <Button size="lg"
                            class="h-13 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all rounded-full text-white dark:text-white font-semibold">
                            Criar conta grátis
                            <ArrowRight class="ml-2 h-5 w-5" />
                        </Button>
                    </RouterLink>
                    <a href="#features">
                        <Button variant="outline" size="lg" class="h-13 px-8 text-base rounded-full">
                            <PlayCircle class="mr-2 h-5 w-5" />
                            Ver funcionalidades
                        </Button>
                    </a>
                </div>

                <p class="mt-4 text-xs text-muted-foreground animate-fade-in-up" style="animation-delay: 350ms">
                    Cancele quando quiser · Sem taxa de implantação
                </p>

                <!-- Screenshot do sistema em moldura de navegador -->
                <div class="mt-14 md:mt-20 relative max-w-5xl mx-auto animate-fade-in-up" style="animation-delay: 500ms">
                    <div class="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
                        <div class="flex items-center gap-1.5 px-4 h-9 border-b border-border bg-muted/40">
                            <span class="w-3 h-3 rounded-full bg-red-400"></span>
                            <span class="w-3 h-3 rounded-full bg-yellow-400"></span>
                            <span class="w-3 h-3 rounded-full bg-green-400"></span>
                            <span class="ml-3 hidden sm:inline text-xs text-muted-foreground">app.gestaofacil.com</span>
                        </div>
                        <img :src="heroImageSrc" :alt="hero.imageAlt || 'Dashboard do Gestão Fácil'"
                            class="w-full h-auto" loading="lazy" />
                    </div>

                    <div class="absolute -right-4 md:-right-10 top-1/4 bg-card p-4 rounded-xl shadow-xl border border-border animate-float hidden md:block">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center text-green-600">
                                <TrendingUp class="w-5 h-5" />
                            </div>
                            <div class="text-left">
                                <p class="text-xs font-medium text-muted-foreground">Vendas hoje</p>
                                <p class="text-lg font-bold">R$ 4.250,00</p>
                            </div>
                        </div>
                    </div>
                    <div class="absolute -left-4 md:-left-10 bottom-1/4 bg-card p-4 rounded-xl shadow-xl border border-border animate-float-delayed hidden md:block">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600">
                                <Users class="w-5 h-5" />
                            </div>
                            <div class="text-left">
                                <p class="text-xs font-medium text-muted-foreground">Novos clientes</p>
                                <p class="text-lg font-bold">+128</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Métricas -->
                <div class="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                    <div v-for="stat in stats" :key="stat.label">
                        <p class="text-2xl md:text-3xl font-extrabold text-primary">{{ stat.value }}</p>
                        <p class="text-xs md:text-sm text-muted-foreground">{{ stat.label }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features -->
        <section id="features" class="py-20 bg-muted/30 border-y border-border/60">
            <div class="container mx-auto px-4">
                <div class="text-center max-w-2xl mx-auto mb-14">
                    <span class="text-sm font-semibold text-primary uppercase tracking-wider">Funcionalidades</span>
                    <h2 class="text-3xl md:text-4xl font-bold mt-2 mb-4">Tudo incluso no plano base</h2>
                    <p class="text-muted-foreground text-lg">Uma suíte completa para operar seu negócio do balcão ao caixa,
                        sem contratar vários sistemas.</p>
                </div>

                <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Card v-for="(feature, index) in features" :key="index"
                        class="border-border/60 hover:border-primary/40 hover:shadow-lg transition-all duration-300">
                        <CardHeader>
                            <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 text-primary">
                                <component :is="feature.icon" class="w-6 h-6" />
                            </div>
                            <CardTitle class="text-lg">{{ feature.title }}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="text-muted-foreground text-sm leading-relaxed">{{ feature.description }}</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <!-- Product showcase -->
        <section class="py-20">
            <div class="container mx-auto px-4">
                <div class="grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <span class="text-sm font-semibold text-primary uppercase tracking-wider">Visão do negócio</span>
                        <h2 class="text-3xl md:text-4xl font-bold mt-2 mb-6">Decisões baseadas em dados reais</h2>
                        <p class="text-lg text-muted-foreground mb-6">
                            Acompanhe vendas, saldo mensal, ticket médio e produtos mais vendidos em um dashboard claro.
                            Tudo atualizado em tempo real, do computador ou do celular.
                        </p>
                        <ul class="space-y-3">
                            <li v-for="item in benefits" :key="item" class="flex items-center gap-3">
                                <CheckCircle2 class="w-5 h-5 text-primary flex-shrink-0" />
                                <span class="text-sm md:text-base">{{ item }}</span>
                            </li>
                        </ul>
                        <RouterLink to="/site/cadastro">
                            <Button class="mt-8 rounded-full text-white dark:text-white font-semibold">
                                Experimentar grátis <ArrowRight class="ml-2 h-4 w-4" />
                            </Button>
                        </RouterLink>
                    </div>
                    <div class="rounded-xl border border-border bg-card shadow-xl overflow-hidden">
                        <img :src="heroImageSrc" :alt="hero.imageAlt || 'Relatórios e insights do sistema'" class="w-full h-auto" loading="lazy" />
                    </div>
                </div>
            </div>
        </section>

        <!-- Apps modulares -->
        <section id="apps" class="py-20 bg-muted/30 border-y border-border/60">
            <div class="container mx-auto px-4">
                <div class="text-center max-w-2xl mx-auto mb-14">
                    <span class="text-sm font-semibold text-primary uppercase tracking-wider">App Store</span>
                    <h2 class="text-3xl md:text-4xl font-bold mt-2 mb-4">Amplie com apps quando precisar</h2>
                    <p class="text-muted-foreground text-lg">Ative módulos opcionais direto no sistema: IA, WhatsApp,
                        atendimento, loja virtual, recorrência e gateways. Pague só pelo que usar.</p>
                </div>

                <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    <div v-for="app in apps" :key="app.title"
                        class="bg-card p-6 rounded-2xl border border-border/60 hover:shadow-lg transition-all">
                        <div class="flex items-center justify-between mb-4">
                            <div class="w-11 h-11 rounded-xl flex items-center justify-center" :class="app.iconBg">
                                <component :is="app.icon" class="w-6 h-6" :class="app.iconColor" />
                            </div>
                            <span class="text-sm font-bold px-2.5 py-1 rounded-full"
                                :class="app.price === 0 ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400' : 'bg-primary/10 text-primary'">
                                {{ app.price === 0 ? 'Grátis' : `+ ${formatBRL(app.price)}/mês` }}
                            </span>
                        </div>
                        <h3 class="font-bold mb-1">{{ app.title }}</h3>
                        <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{{ app.category }}</p>
                        <p class="text-sm text-muted-foreground leading-relaxed">{{ app.description }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Nichos -->
        <section class="py-20">
            <div class="container mx-auto px-4">
                <div class="grid lg:grid-cols-2 gap-12 items-center">
                    <div class="order-2 lg:order-1">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="space-y-4 mt-8">
                                <div v-for="n in segments.slice(0, 2)" :key="n.title" class="bg-card p-6 rounded-2xl shadow-sm border border-border/60">
                                    <component :is="n.icon" class="w-8 h-8 mb-3" :class="n.color" />
                                    <h3 class="font-bold mb-1">{{ n.title }}</h3>
                                    <p class="text-xs text-muted-foreground">{{ n.desc }}</p>
                                </div>
                            </div>
                            <div class="space-y-4">
                                <div v-for="n in segments.slice(2, 4)" :key="n.title" class="bg-card p-6 rounded-2xl shadow-sm border border-border/60">
                                    <component :is="n.icon" class="w-8 h-8 mb-3" :class="n.color" />
                                    <h3 class="font-bold mb-1">{{ n.title }}</h3>
                                    <p class="text-xs text-muted-foreground">{{ n.desc }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="order-1 lg:order-2">
                        <span class="text-sm font-semibold text-primary uppercase tracking-wider">Flexível</span>
                        <h2 class="text-3xl md:text-4xl font-bold mt-2 mb-6">Adaptável ao seu tipo de negócio</h2>
                        <p class="text-lg text-muted-foreground mb-6">
                            Do varejo aos serviços, o Gestão Fácil se molda à sua operação com configurações flexíveis
                            e módulos que você ativa conforme cresce.
                        </p>
                        <ul class="space-y-3">
                            <li v-for="item in adaptBenefits" :key="item" class="flex items-center gap-3">
                                <CheckCircle2 class="w-5 h-5 text-primary flex-shrink-0" />
                                <span>{{ item }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- Preços -->
        <section id="precos" class="py-20 bg-muted/30 border-y border-border/60">
            <div class="container mx-auto px-4">
                <div class="text-center max-w-2xl mx-auto mb-14">
                    <span class="text-sm font-semibold text-primary uppercase tracking-wider">Preços</span>
                    <h2 class="text-3xl md:text-4xl font-bold mt-2 mb-4">Simples e transparente</h2>
                    <p class="text-muted-foreground text-lg">Um preço só pelo sistema completo. Sem letras miúdas,
                        sem taxas escondidas.</p>
                </div>

                <div class="grid lg:grid-cols-5 gap-6 max-w-5xl mx-auto items-start">
                    <!-- Plano base -->
                    <Card class="lg:col-span-3 border-2 border-primary relative shadow-2xl">
                        <div class="absolute -top-3.5 left-8 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold shadow-sm">
                            {{ trialDaysLabel.toUpperCase() }} GRÁTIS
                        </div>
                        <CardHeader>
                            <CardTitle class="text-2xl">Plano Gestão Fácil</CardTitle>
                            <CardDescription>Tudo que seu negócio precisa para operar</CardDescription>
                            <div class="mt-4 flex items-end gap-2">
                                <span class="text-5xl font-extrabold">{{ monthlyPriceCompact }}</span>
                                <span class="text-muted-foreground mb-1">/mês</span>
                            </div>
                            <p class="text-sm text-muted-foreground">Após os {{ trialDaysLabel }} de teste grátis. Sem cartão para começar.</p>
                        </CardHeader>
                        <CardContent>
                            <RouterLink to="/site/cadastro">
                                <Button class="w-full mb-6 h-12 text-base text-white dark:text-white font-semibold rounded-full">
                                    Começar {{ trialDaysLabel }} grátis
                                </Button>
                            </RouterLink>
                            <ul class="grid sm:grid-cols-2 gap-3 text-sm">
                                <li v-for="inc in included" :key="inc" class="flex items-center gap-2">
                                    <Check class="w-4 h-4 text-green-500 flex-shrink-0" /> {{ inc }}
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <!-- Apps adicionais -->
                    <Card class="lg:col-span-2 border-border/60">
                        <CardHeader>
                            <CardTitle class="text-xl">Apps adicionais</CardTitle>
                            <CardDescription>Opcionais — ative só o que usar</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul class="space-y-3">
                                <li v-for="app in apps" :key="app.title" class="flex items-center justify-between gap-2 text-sm">
                                    <span class="flex items-center gap-2">
                                        <component :is="app.icon" class="w-4 h-4 text-muted-foreground" />
                                        {{ app.title }}
                                    </span>
                                    <span class="font-semibold" :class="app.price === 0 ? 'text-green-600' : 'text-foreground'">
                                        {{ app.price === 0 ? 'Grátis' : `+ ${formatBRL(app.price)}` }}
                                    </span>
                                </li>
                            </ul>
                            <p class="mt-5 text-xs text-muted-foreground border-t border-border/60 pt-4">
                                Ative e desative na App Store dentro do sistema. Apps pagos entram na mensalidade de forma
                                proporcional. Apps com valor zerado são gratuitos.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        <!-- Depoimentos -->
        <section id="depoimentos" class="py-20">
            <div class="container mx-auto px-4">
                <div class="text-center max-w-2xl mx-auto mb-12">
                    <span class="text-sm font-semibold text-primary uppercase tracking-wider">Depoimentos</span>
                    <h2 class="text-3xl md:text-4xl font-bold mt-2">Quem usa, recomenda</h2>
                </div>
                <div class="grid md:grid-cols-3 gap-6">
                    <div v-for="(t, i) in testimonials" :key="i" class="bg-card p-6 rounded-2xl border border-border/60 shadow-sm">
                        <div class="flex gap-1 text-yellow-500 mb-4">
                            <Star v-for="n in 5" :key="n" class="w-4 h-4 fill-current" />
                        </div>
                        <p class="text-muted-foreground mb-6 leading-relaxed">"{{ t.text }}"</p>
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

        <!-- FAQ -->
        <section id="faq" class="py-20 bg-muted/30 border-y border-border/60">
            <div class="container mx-auto px-4 max-w-3xl">
                <div class="text-center mb-12">
                    <span class="text-sm font-semibold text-primary uppercase tracking-wider">Dúvidas</span>
                    <h2 class="text-3xl md:text-4xl font-bold mt-2">Perguntas frequentes</h2>
                </div>
                <div class="space-y-3">
                    <div v-for="(item, i) in faqs" :key="i" class="bg-card border border-border/60 rounded-xl overflow-hidden">
                        <button type="button" @click="openFaq = openFaq === i ? -1 : i"
                            class="w-full flex items-center justify-between gap-4 p-5 text-left font-medium hover:text-primary transition-colors">
                            {{ item.q }}
                            <ChevronDown class="w-5 h-5 flex-shrink-0 transition-transform" :class="{ 'rotate-180': openFaq === i }" />
                        </button>
                        <div v-show="openFaq === i" class="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">
                            {{ item.a }}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA final -->
        <section class="py-20">
            <div class="container mx-auto px-4">
                <div class="relative overflow-hidden rounded-3xl bg-primary px-8 py-14 md:py-20 text-center">
                    <div class="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 opacity-90"></div>
                    <div class="relative">
                        <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">Comece hoje, grátis por {{ trialDaysLabel }}</h2>
                        <p class="text-white/80 max-w-xl mx-auto mb-8">Sem cartão de crédito, sem compromisso.
                            Configure em minutos e veja seu negócio mais organizado.</p>
                        <RouterLink to="/site/cadastro">
                            <Button size="lg" variant="secondary" class="h-13 px-8 text-base font-semibold rounded-full">
                                Criar conta grátis <ArrowRight class="ml-2 h-5 w-5" />
                            </Button>
                        </RouterLink>
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
                            <img src="/imgs/logo.png" alt="Gestão Fácil" class="w-8 h-8 rounded-lg object-contain" v-if="!logoError" />
                            <div v-else class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">G</div>
                            <span class="font-bold text-xl tracking-tight text-white dark:text-foreground">Gestão Fácil</span>
                        </div>
                        <p class="text-zinc-400 max-w-sm">Sistema completo para impulsionar suas vendas e organizar sua
                            empresa. Simples, rápido e eficiente.</p>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4 text-white dark:text-foreground">Produto</h4>
                        <ul class="space-y-2 text-sm text-zinc-400">
                            <li><RouterLink :to="{ path: '/site', hash: '#features' }" class="hover:text-primary transition-colors">Funcionalidades</RouterLink></li>
                            <li><RouterLink :to="{ path: '/site', hash: '#apps' }" class="hover:text-primary transition-colors">Apps</RouterLink></li>
                            <li><RouterLink :to="{ path: '/site', hash: '#precos' }" class="hover:text-primary transition-colors">Preços</RouterLink></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-bold mb-4 text-white dark:text-foreground">Legal</h4>
                        <ul class="space-y-2 text-sm text-zinc-400">
                            <li><RouterLink to="/site/termos-politica" class="hover:text-primary transition-colors">Termos de Uso</RouterLink></li>
                            <li><RouterLink to="/site/termos-politica" class="hover:text-primary transition-colors">Privacidade</RouterLink></li>
                            <li><RouterLink to="/login" class="hover:text-primary transition-colors">Entrar</RouterLink></li>
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
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { SiteRepository } from '@/repositories/site-repository'
import { DEFAULT_SITE_CONFIG, cloneSiteConfig, type SitePublicConfig } from '@/pages/site/siteContent'
import { resolveFileUrl } from '@/utils/fileUrl'
import {
    ArrowRight, PlayCircle, TrendingUp, Users, Smartphone, Shirt, Hammer,
    ShoppingBasket, CheckCircle2, Check, Star, ChevronDown,
    Box, Wallet, FileBarChart, Wrench, ScanLine, UsersRound,
    Bot, MessageCircle, Repeat, CreditCard, Headset, Store
} from 'lucide-vue-next'

const isScrolled = ref(false)
const logoError = ref(false)
const openFaq = ref(0)
const siteConfig = ref<SitePublicConfig>(cloneSiteConfig())

const handleScroll = () => {
    isScrolled.value = window.scrollY > 20
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll)
    loadSiteConfig()
})
onUnmounted(() => window.removeEventListener('scroll', handleScroll))

const formatBRL = (v: number) =>
    v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatBRLCompact = (v: number) => formatBRL(v).replace(',00', '')

const iconMap = {
    ScanLine,
    Box,
    Wallet,
    Repeat,
    UsersRound,
    FileBarChart,
    Wrench,
    Store,
    Bot,
    MessageCircle,
    CreditCard,
    Headset,
} as const

const appVisuals = [
    { iconBg: 'bg-purple-100 dark:bg-purple-950', iconColor: 'text-purple-500' },
    { iconBg: 'bg-green-100 dark:bg-green-950', iconColor: 'text-green-500' },
    { iconBg: 'bg-emerald-100 dark:bg-emerald-950', iconColor: 'text-emerald-500' },
    { iconBg: 'bg-amber-100 dark:bg-amber-950', iconColor: 'text-amber-500' },
    { iconBg: 'bg-blue-100 dark:bg-blue-950', iconColor: 'text-blue-500' },
    { iconBg: 'bg-sky-100 dark:bg-sky-950', iconColor: 'text-sky-500' },
]

const getIcon = (icon?: string) => iconMap[icon as keyof typeof iconMap] || Box

const hero = computed(() => siteConfig.value.hero)
const heroHighlight = computed(() => hero.value.highlight?.trim() || '')
const heroTitlePrefix = computed(() => {
    const title = hero.value.title?.trim() || DEFAULT_SITE_CONFIG.hero.title
    const highlight = heroHighlight.value
    if (!highlight) return title

    const index = title.toLowerCase().lastIndexOf(highlight.toLowerCase())
    return index >= 0 ? title.slice(0, index).trim() : title
})
const showHeroBreak = computed(() => Boolean(heroTitlePrefix.value && heroHighlight.value))
const heroImageSrc = computed(() => resolveFileUrl(hero.value.imageUrl, { fallback: '/imgs/dashboard.png' }))
const monthlyPriceCompact = computed(() => formatBRLCompact(Number(hero.value.monthlyPrice || 0)))
const trialDaysLabel = computed(() => `${Number(hero.value.trialDays || 0)} dias`)

async function loadSiteConfig() {
    try {
        siteConfig.value = cloneSiteConfig(await SiteRepository.getPublicConfig())
    } catch (error) {
        console.error('Erro ao carregar configurações públicas do site', error)
        siteConfig.value = cloneSiteConfig()
    }
}

const stats = computed(() => siteConfig.value.hero.stats?.length ? siteConfig.value.hero.stats : DEFAULT_SITE_CONFIG.hero.stats)

const features = computed(() =>
    (siteConfig.value.features?.length ? siteConfig.value.features : DEFAULT_SITE_CONFIG.features).map((feature) => ({
        ...feature,
        icon: getIcon(feature.icon),
    })),
)

const benefits = computed(() => siteConfig.value.benefits?.length ? siteConfig.value.benefits : DEFAULT_SITE_CONFIG.benefits)

const apps = computed(() =>
    (siteConfig.value.apps?.length ? siteConfig.value.apps : DEFAULT_SITE_CONFIG.apps).map((app, index) => ({
        ...app,
        icon: getIcon(app.icon),
        ...appVisuals[index % appVisuals.length],
    })),
)

const segments = [
    { title: 'Eletrônicos', desc: 'Controle de serial e garantia', icon: Smartphone, color: 'text-purple-500' },
    { title: 'Vestuário', desc: 'Grade de cor e tamanho', icon: Shirt, color: 'text-pink-500' },
    { title: 'Serviços', desc: 'Ordem de serviço completa', icon: Hammer, color: 'text-orange-500' },
    { title: 'Varejo', desc: 'PDV rápido e eficiente', icon: ShoppingBasket, color: 'text-green-500' },
]

const adaptBenefits = computed(() => siteConfig.value.adaptBenefits?.length ? siteConfig.value.adaptBenefits : DEFAULT_SITE_CONFIG.adaptBenefits)

const included = computed(() => siteConfig.value.included?.length ? siteConfig.value.included : DEFAULT_SITE_CONFIG.included)

const testimonials = [
    { text: 'Melhor sistema que já usei na minha loja de roupas. Simples e resolve tudo.', name: 'Carla Dias', company: 'Boutique Elegance', initials: 'CD' },
    { text: 'O controle financeiro salvou minha empresa. Vejo exatamente onde estou gastando.', name: 'Roberto Júnior', company: 'RJ Tech', initials: 'RJ' },
    { text: 'Suporte nota 10! Sempre que preciso, resolvem meu problema em minutos.', name: 'Fernanda Costa', company: 'Mercadinho da Villa', initials: 'FC' },
]

const faqs = computed(() => siteConfig.value.faqs?.length ? siteConfig.value.faqs : DEFAULT_SITE_CONFIG.faqs)
</script>

<style scoped>
.h-13 {
    height: 3.25rem;
}

@keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-18px); }
}

.animate-float {
    animation: float 6s ease-in-out infinite;
}

.animate-float-delayed {
    animation: float 6s ease-in-out infinite;
    animation-delay: 3s;
}

@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in-up {
    animation: fadeInUp 0.7s ease-out forwards;
    opacity: 0;
}
</style>
