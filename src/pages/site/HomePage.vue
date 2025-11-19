<template>
    <div class="bg-gray-50 dark:bg-gray-900 transition-colors duration-300 overflow-x-hidden">
        <!-- Header -->
        <header
            class="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm shadow-lg sticky top-0 z-50 transition-all duration-300 animate-fade-in">
            <div class="container mx-auto px-4 py-4 flex justify-between items-center">
                <div class="flex items-center space-x-3">
                    <div
                        class="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-200">
                        <img src="/imgs/logo.png" alt="Logo" class="w-10 h-10 rounded-xl">
                    </div>
                    <h1 class="text-2xl text-gray-800 dark:text-white">Gestão Fácil ERP</h1>
                </div>

                <div class="flex items-center space-x-4">
                    <RouterLink to="/site/cadastro"
                        class="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg transition-all duration-200 transform hover:scale-105 hover:shadow-lg">
                        Começar Agora
                    </RouterLink>
                </div>
            </div>
        </header>

        <!-- Hero Section Enhanced -->
        <section
            class="relative bg-gradient-to-br from-primary via-primary/90 to-primary/70 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 py-24 md:py-32 overflow-hidden">
            <!-- Background decorative elements -->
            <div class="absolute inset-0 overflow-hidden pointer-events-none">
                <div class="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
                <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <div class="container mx-auto px-4 text-center relative z-10">
                <!-- Trust badges -->
                <div class="flex flex-wrap justify-center gap-4 mb-8 animate-fade-in">
                    <span
                        class="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        <i class="fas fa-check-circle"></i>
                        Mais de 100 lojas
                    </span>
                    <span
                        class="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        <i class="fas fa-shield-alt"></i>
                        99.9% Uptime
                    </span>
                    <span
                        class="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                        <i class="fas fa-star"></i>
                        4.9/5 Avaliação
                    </span>
                </div>

                <h2 class="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight animate-slide-up">
                    Gerencie sua loja com<br>
                    <span class="text-yellow-300 inline-block animate-pulse">simplicidade</span> e <span
                        class="text-blue-300">eficiência</span>
                </h2>

                <p class="text-lg md:text-xl text-gray-100 dark:text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed animate-slide-up"
                    style="animation-delay: 0.1s;">
                    Sistema completo de gestão para pequenas e médias lojas. Controle estoque, vendas, financeiro e
                    clientes em uma única plataforma intuitiva e poderosa.
                </p>

                <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16 animate-slide-up"
                    style="animation-delay: 0.2s;">
                    <RouterLink to="/site/cadastro"
                        class="group bg-white text-primary hover:bg-gray-50 px-8 py-4 rounded-lg font-bold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-3xl flex items-center gap-2">
                        <i class="fas fa-rocket group-hover:animate-bounce"></i>
                        Teste Grátis por 7 dias
                    </RouterLink>
                    <a href="#features"
                        class="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 border-2 border-white/30 hover:border-white/50">
                        Ver Funcionalidades
                    </a>
                </div>

                <!-- Dashboard Preview with animation -->
                <div ref="dashboardRef"
                    class="max-w-6xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all duration-700"
                    :class="{ 'opacity-0 translate-y-10': !dashboardVisible, 'opacity-100 translate-y-0': dashboardVisible }">
                    <div class="bg-gray-800 dark:bg-gray-900 p-4 flex items-center space-x-2">
                        <div class="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div class="w-3 h-3 bg-yellow-500 rounded-full animate-pulse" style="animation-delay: 0.1s;">
                        </div>
                        <div class="w-3 h-3 bg-green-500 rounded-full animate-pulse" style="animation-delay: 0.2s;">
                        </div>
                        <span class="text-gray-300 text-sm ml-4">Gestão Fácil ERP - Dashboard</span>
                    </div>
                    <div class="p-8 bg-gradient-to-br from-gray-800 to-gray-900">
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div v-for="(item, i) in dashboard" :key="i"
                                :class="['p-6 rounded-xl text-white transform transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer', item.bg]"
                                :style="{ animationDelay: `${i * 0.1}s` }">
                                <div class="flex items-center justify-between">
                                    <div>
                                        <p :class="['text-sm mb-1', item.textColor]">{{ item.label }}</p>
                                        <p class="text-2xl md:text-3xl font-bold">{{ item.value }}</p>
                                    </div>
                                    <i
                                        :class="[item.icon, 'text-3xl md:text-4xl', item.iconColor, 'transform transition-transform group-hover:scale-110']"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Statistics Section (NEW) -->
        <section class="py-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div class="container mx-auto px-4">
                <div ref="statsContainerRef" class="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div v-for="(stat, index) in statistics" :key="index"
                        class="text-center transform transition-all duration-500"
                        :class="{ 'opacity-0 translate-y-10': !statsVisible[index], 'opacity-100 translate-y-0': statsVisible[index] }">
                        <div class="mb-3">
                            <i :class="[stat.icon, 'text-4xl md:text-5xl', stat.color]"></i>
                        </div>
                        <div ref="el => { if (el) setupCounter(el, stat, index) }"
                            class="text-3xl md:text-5xl font-bold text-gray-800 dark:text-white mb-2">
                            {{ stat.displayValue || stat.value }}
                        </div>
                        <p class="text-gray-600 dark:text-gray-300 text-sm md:text-base font-medium">{{ stat.label }}
                        </p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section Enhanced -->
        <section id="features" class="py-20 bg-gray-50 dark:bg-gray-900">
            <div class="container mx-auto px-4">
                <div class="text-center mb-16 animate-fade-in">
                    <h3 class="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                        Tudo que sua loja precisa em um só lugar
                    </h3>
                    <p class="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                        Funcionalidades completas para otimizar sua gestão e aumentar seus lucros
                    </p>
                </div>

                <div ref="featuresContainerRef" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div v-for="(feature, index) in features" :key="index"
                        class="group bg-white dark:bg-gray-800 p-8 rounded-2xl hover:shadow-2xl transition-all duration-500 border border-gray-200 dark:border-gray-700 transform hover:-translate-y-2"
                        :class="{ 'opacity-0 translate-y-10': !featuresVisible[index], 'opacity-100 translate-y-0': featuresVisible[index] }">
                        <div class="relative mb-6">
                            <div
                                :class="['w-14 h-14 rounded-xl flex items-center justify-center mb-4 transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3', feature.bgColor]">
                                <i :class="[feature.icon, 'text-2xl', feature.iconColor]"></i>
                            </div>
                            <span v-if="feature.badge"
                                class="absolute top-0 right-0 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                                {{ feature.badge }}
                            </span>
                        </div>
                        <h4 class="text-xl font-bold text-gray-800 dark:text-white mb-3">{{ feature.title }}</h4>
                        <p class="text-gray-600 dark:text-gray-300 leading-relaxed">{{ feature.description }}</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- Comparison Section (NEW) -->
        <section class="py-20 bg-white dark:bg-gray-800">
            <div class="container mx-auto px-4">
                <div class="text-center mb-16">
                    <h3 class="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                        Transforme sua gestão
                    </h3>
                    <p class="text-lg md:text-xl text-gray-600 dark:text-gray-300">
                        Veja a diferença que o Gestão Fácil faz no seu dia a dia
                    </p>
                </div>

                <div class="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    <!-- Antes -->
                    <div
                        class="bg-red-50 dark:bg-red-900/20 p-8 rounded-2xl border-2 border-red-200 dark:border-red-800">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                                <i class="fas fa-times text-white text-xl"></i>
                            </div>
                            <h4 class="text-2xl font-bold text-gray-800 dark:text-white">Sem o Sistema</h4>
                        </div>
                        <ul class="space-y-4">
                            <li v-for="item in comparisonBefore" :key="item" class="flex items-start gap-3">
                                <i class="fas fa-times-circle text-red-500 mt-1 flex-shrink-0"></i>
                                <span class="text-gray-700 dark:text-gray-300">{{ item }}</span>
                            </li>
                        </ul>
                    </div>

                    <!-- Depois -->
                    <div
                        class="bg-green-50 dark:bg-green-900/20 p-8 rounded-2xl border-2 border-green-200 dark:border-green-800 transform hover:scale-105 transition-transform duration-300">
                        <div class="flex items-center gap-3 mb-6">
                            <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                                <i class="fas fa-check text-white text-xl"></i>
                            </div>
                            <h4 class="text-2xl font-bold text-gray-800 dark:text-white">Com Gestão Fácil</h4>
                        </div>
                        <ul class="space-y-4">
                            <li v-for="item in comparisonAfter" :key="item" class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-green-500 mt-1 flex-shrink-0"></i>
                                <span class="text-gray-700 dark:text-gray-300">{{ item }}</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <!-- Pricing Section Enhanced -->
        <section class="py-20 bg-gray-50 dark:bg-gray-900">
            <div class="container mx-auto px-4 text-center">
                <h3 class="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                    Plano Simples, Preço Justo
                </h3>
                <p class="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-12">
                    Sem complicações, sem taxas ocultas. Tudo incluído.
                </p>

                <div class="max-w-md mx-auto">
                    <div
                        class="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border-4 border-primary transform hover:scale-105 transition-all duration-300">
                        <!-- Popular badge -->
                        <div class="absolute top-8 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                            <span
                                class="bg-gradient-to-r from-primary to-primary/80 text-white px-8 py-2.5 rounded-full text-sm font-bold shadow-lg animate-pulse">
                                ⭐ POPULAR
                            </span>
                        </div>

                        <div class="p-8 pt-16">
                            <h4 class="text-2xl md:text-3xl font-bold text-gray-800 dark:text-white mb-6">Plano Completo
                            </h4>
                            <div class="mb-8">
                                <div class="flex items-baseline justify-center gap-2">
                                    <span
                                        class="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">R$
                                        70</span>
                                    <span class="text-gray-600 dark:text-gray-300 text-xl">/mês</span>
                                </div>
                                <p class="text-gray-500 dark:text-gray-400 mt-2">Pagamento antecipado mensal</p>
                            </div>

                            <ul class="text-left space-y-4 mb-8">
                                <li v-for="item in pricingFeatures" :key="item" class="flex items-start gap-3">
                                    <i class="fas fa-check-circle text-green-500 mt-1 text-lg flex-shrink-0"></i>
                                    <span class="text-gray-700 dark:text-gray-300">{{ item }}</span>
                                </li>
                            </ul>

                            <RouterLink to="/site/cadastro"
                                class="block w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white py-4 rounded-xl text-lg font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
                                Começar Teste Grátis
                            </RouterLink>

                            <p
                                class="text-sm text-gray-500 dark:text-gray-400 mt-6 flex items-center justify-center gap-2">
                                <i class="fas fa-shield-alt text-green-500"></i>
                                7 dias grátis • Cancele quando quiser
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Testimonials with Carousel -->
        <section class="py-20 bg-white dark:bg-gray-800">
            <div class="container mx-auto px-4">
                <div class="text-center mb-16">
                    <h3 class="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                        O que nossos clientes dizem
                    </h3>
                    <p class="text-lg text-gray-600 dark:text-gray-300">
                        Histórias reais de sucesso
                    </p>
                </div>

                <div class="relative max-w-6xl mx-auto">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div v-for="(testimonial, index) in testimonials" :key="index"
                            class="bg-gray-50 dark:bg-gray-700 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                            <div class="flex items-center mb-4">
                                <div class="flex text-yellow-400 gap-1">
                                    <i v-for="n in 5" :key="n" class="fas fa-star"></i>
                                </div>
                            </div>
                            <p class="text-gray-600 dark:text-gray-300 mb-6 italic leading-relaxed">
                                "{{ testimonial.text }}"
                            </p>
                            <div class="flex items-center gap-4">
                                <div
                                    class="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                    {{ testimonial.initials }}
                                </div>
                                <div>
                                    <p class="font-bold text-gray-800 dark:text-white">{{ testimonial.name }}</p>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ testimonial.business }}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- FAQ Section (NEW) -->
        <section class="py-20 bg-gray-50 dark:bg-gray-900">
            <div class="container mx-auto px-4">
                <div class="text-center mb-16">
                    <h3 class="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-4">
                        Perguntas Frequentes
                    </h3>
                    <p class="text-lg text-gray-600 dark:text-gray-300">
                        Tire suas dúvidas sobre o sistema
                    </p>
                </div>

                <div class="max-w-3xl mx-auto space-y-4">
                    <div v-for="(faq, index) in faqs" :key="index"
                        class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                        <button @click="toggleFaq(index)"
                            class="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                            <div class="flex items-center gap-4">
                                <i :class="[faq.icon, 'text-primary text-xl']"></i>
                                <span class="font-semibold text-gray-800 dark:text-white text-lg">{{ faq.question
                                }}</span>
                            </div>
                            <i
                                :class="['fas fa-chevron-down transition-transform duration-300', { 'rotate-180': faq.open }]"></i>
                        </button>
                        <div v-show="faq.open"
                            class="px-6 pb-5 text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700 pt-4">
                            {{ faq.answer }}
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section Enhanced -->
        <section class="relative py-24 bg-gradient-to-r from-primary via-primary/90 to-primary/80 overflow-hidden">
            <!-- Parallax background -->
            <div class="absolute inset-0 opacity-10">
                <div
                    class="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2">
                </div>
                <div
                    class="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 translate-y-1/2">
                </div>
            </div>

            <div class="container mx-auto px-4 text-center text-white relative z-10">
                <h3 class="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                    Pronto para transformar sua gestão?
                </h3>
                <p class="text-lg md:text-2xl mb-4 opacity-95">
                    Comece seu teste gratuito hoje mesmo e veja a diferença
                </p>
                <p class="text-base md:text-lg mb-10 opacity-90 flex items-center justify-center gap-2">
                    <i class="fas fa-users"></i>
                    Junte-se a mais de 1.000 lojas que já confiam no Gestão Fácil
                </p>

                <div class="flex flex-col sm:flex-row gap-4 justify-center">
                    <RouterLink to="/site/cadastro"
                        class="group bg-white text-primary px-10 py-5 rounded-xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 transform hover:scale-105 shadow-2xl flex items-center justify-center gap-2">
                        <i class="fas fa-rocket group-hover:animate-bounce"></i>
                        Teste Grátis por 7 dias
                    </RouterLink>
                </div>
            </div>
        </section>

        <!-- Footer Enhanced -->
        <footer class="bg-gray-900 dark:bg-black text-white py-16">
            <div class="container mx-auto px-4">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
                    <!-- Brand -->
                    <div>
                        <div class="flex items-center space-x-3 mb-6">
                            <div
                                class="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-lg">
                                <i class="fas fa-chart-bar text-white"></i>
                            </div>
                            <h4 class="text-xl font-bold">Gestão Fácil ERP</h4>
                        </div>
                        <p class="text-gray-400 leading-relaxed mb-4">
                            Sistema completo de gestão para pequenas e médias lojas.
                        </p>
                        <div class="flex gap-4">
                            <a href="#"
                                class="w-10 h-10 bg-gray-800 hover:bg-primary rounded-full flex items-center justify-center transition-colors duration-200">
                                <i class="fab fa-facebook-f"></i>
                            </a>
                            <a href="#"
                                class="w-10 h-10 bg-gray-800 hover:bg-primary rounded-full flex items-center justify-center transition-colors duration-200">
                                <i class="fab fa-instagram"></i>
                            </a>
                            <a href="#"
                                class="w-10 h-10 bg-gray-800 hover:bg-primary rounded-full flex items-center justify-center transition-colors duration-200">
                                <i class="fab fa-linkedin-in"></i>
                            </a>
                        </div>
                    </div>

                    <!-- Produto -->
                    <div>
                        <h5 class="font-bold mb-6 text-lg">Produto</h5>
                        <ul class="space-y-3 text-gray-400">
                            <li><a href="#features"
                                    class="hover:text-white transition-colors duration-200">Funcionalidades</a></li>
                            <li><a href="#" class="hover:text-white transition-colors duration-200">Preços</a></li>
                            <li><a href="#" class="hover:text-white transition-colors duration-200">Atualizações</a>
                            </li>
                            <li><a href="#" class="hover:text-white transition-colors duration-200">Roadmap</a></li>
                        </ul>
                    </div>

                    <!-- Empresa -->
                    <div>
                        <h5 class="font-bold mb-6 text-lg">Empresa</h5>
                        <ul class="space-y-3 text-gray-400">
                            <li><a href="#" class="hover:text-white transition-colors duration-200">Sobre Nós</a></li>
                            <li><a href="#" class="hover:text-white transition-colors duration-200">Blog</a></li>
                            <li><a href="#" class="hover:text-white transition-colors duration-200">Carreiras</a></li>
                            <li><a href="#" class="hover:text-white transition-colors duration-200">Parceiros</a></li>
                        </ul>
                    </div>

                    <!-- Contato -->
                    <div>
                        <h5 class="font-bold mb-6 text-lg">Contato</h5>
                        <ul class="space-y-4 text-gray-400">
                            <li class="flex items-center gap-3">
                                <i class="fas fa-envelope text-primary"></i>
                                <a href="mailto:atendimento@userp.com.br"
                                    class="hover:text-white transition-colors duration-200">
                                    atendimento@userp.com.br
                                </a>
                            </li>
                            <li class="flex items-center gap-3">
                                <i class="fas fa-phone text-primary"></i>
                                <a href="tel:+5599984140666" class="hover:text-white transition-colors duration-200">
                                    (99) 98414-0666
                                </a>
                            </li>
                            <li class="flex items-center gap-3">
                                <i class="fas fa-map-marker-alt text-primary"></i>
                                <span>São Paulo, SP</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p class="text-gray-400 text-sm">
                        © 2025 Gestão Fácil ERP. Todos os direitos reservados.
                    </p>
                    <div class="flex gap-6 text-sm text-gray-400">
                        <a href="#" class="hover:text-white transition-colors duration-200">Termos de Uso</a>
                        <a href="#" class="hover:text-white transition-colors duration-200">Privacidade</a>
                        <a href="#" class="hover:text-white transition-colors duration-200">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useStaggeredReveal } from '@/composables/useScrollReveal'

// Dashboard data
const dashboard = [
    { label: 'Clientes', value: '1.247', bg: 'bg-purple-600', textColor: 'text-purple-200', icon: 'fas fa-users', iconColor: 'text-purple-300' },
    { label: 'Produtos', value: '856', bg: 'bg-blue-600', textColor: 'text-blue-200', icon: 'fas fa-box', iconColor: 'text-blue-300' },
    { label: 'Estoque Baixo', value: '23', bg: 'bg-red-600', textColor: 'text-red-200', icon: 'fas fa-exclamation-triangle', iconColor: 'text-red-300' },
    { label: 'Vendas Hoje', value: 'R$ 4.890', bg: 'bg-green-600', textColor: 'text-green-200', icon: 'fas fa-dollar-sign', iconColor: 'text-green-300' },
]

// Statistics data
const statistics = ref([
    { label: 'Lojas Ativas', value: '1.000+', icon: 'fas fa-store', color: 'text-blue-600', displayValue: '' },
    { label: 'Vendas Processadas', value: '500K+', icon: 'fas fa-shopping-cart', color: 'text-green-600', displayValue: '' },
    { label: 'Economia Média', value: '30%', icon: 'fas fa-chart-line', color: 'text-purple-600', displayValue: '' },
    { label: 'Satisfação', value: '4.9/5', icon: 'fas fa-star', color: 'text-yellow-500', displayValue: '' }
])

// Features data
const features = [
    {
        title: 'Controle de Estoque',
        description: 'Monitore seus produtos em tempo real, receba alertas de estoque baixo e gerencie fornecedores com facilidade.',
        icon: 'fas fa-boxes',
        bgColor: 'bg-blue-100 dark:bg-blue-900',
        iconColor: 'text-blue-600 dark:text-blue-400',
        badge: 'Popular'
    },
    {
        title: 'PDV Integrado',
        description: 'Sistema de vendas completo com emissão de cupons não fiscais e controle de caixa em tempo real.',
        icon: 'fas fa-cash-register',
        bgColor: 'bg-green-100 dark:bg-green-900',
        iconColor: 'text-green-600 dark:text-green-400',
        badge: ''
    },
    {
        title: 'Financeiro',
        description: 'Controle completo de contas a pagar e receber, fluxo de caixa e relatórios financeiros detalhados.',
        icon: 'fas fa-chart-line',
        bgColor: 'bg-purple-100 dark:bg-purple-900',
        iconColor: 'text-purple-600 dark:text-purple-400',
        badge: ''
    },
    {
        title: 'Gestão de Clientes',
        description: 'Cadastro completo de clientes, histórico de compras e programa de fidelidade integrado.',
        icon: 'fas fa-users',
        bgColor: 'bg-pink-100 dark:bg-pink-900',
        iconColor: 'text-pink-600 dark:text-pink-400',
        badge: ''
    },
    {
        title: 'Acesso Mobile',
        description: 'Gerencie sua loja de qualquer lugar com nosso aplicativo mobile responsivo e intuitivo.',
        icon: 'fas fa-mobile-alt',
        bgColor: 'bg-indigo-100 dark:bg-indigo-900',
        iconColor: 'text-indigo-600 dark:text-indigo-400',
        badge: 'Novo'
    },
    {
        title: 'Relatórios Avançados',
        description: 'Relatórios detalhados de vendas, estoque, financeiro e muito mais para tomada de decisões.',
        icon: 'fas fa-file-alt',
        bgColor: 'bg-orange-100 dark:bg-orange-900',
        iconColor: 'text-orange-600 dark:text-orange-400',
        badge: ''
    }
]

// Comparison data
const comparisonBefore = [
    'Controle manual em planilhas desorganizadas',
    'Perda de vendas por falta de estoque',
    'Dificuldade em acompanhar o financeiro',
    'Relatórios demorados e imprecisos',
    'Sem visão clara do negócio'
]

const comparisonAfter = [
    'Tudo automatizado e centralizado',
    'Alertas inteligentes de reposição',
    'Controle financeiro em tempo real',
    'Relatórios instantâneos e precisos',
    'Dashboard completo do seu negócio'
]

// Pricing features
const pricingFeatures = [
    'Usuários ilimitados',
    'Produtos ilimitados',
    'PDV completo e integrado',
    'Relatórios avançados',
    'Dashboards completas',
    'Backup automático diário',
    'Suporte prioritário',
    'Atualizações gratuitas'
]

// Testimonials data
const testimonials = [
    {
        name: 'Maria Silva',
        business: 'Boutique Fashion',
        initials: 'MS',
        text: 'Revolucionou a gestão da minha loja. Agora tenho controle total do estoque e vendas em tempo real. Recomendo!'
    },
    {
        name: 'João Santos',
        business: 'Eletrônicos Tech',
        initials: 'JS',
        text: 'Interface muito intuitiva e suporte excelente. Recomendo para qualquer pequena loja que quer crescer.'
    },
    {
        name: 'Ana Lima',
        business: 'Farmácia Central',
        initials: 'AL',
        text: 'Preço justo e funcionalidades completas. Minha produtividade aumentou 300% desde que comecei a usar.'
    }
]

// FAQ data
const faqs = ref([
    {
        question: 'Como funciona o período de teste gratuito?',
        answer: 'Você tem 7 dias completos para testar todas as funcionalidades do sistema sem nenhum custo. Não é necessário cartão de crédito para começar.',
        icon: 'fas fa-question-circle',
        open: false
    },
    {
        question: 'Posso cancelar a qualquer momento?',
        answer: 'Sim! Você pode cancelar sua assinatura a qualquer momento sem multas ou taxas adicionais. Seu acesso continuará até o final do período pago.',
        icon: 'fas fa-times-circle',
        open: false
    },
    {
        question: 'Quantos usuários posso cadastrar?',
        answer: 'Nosso plano permite usuários ilimitados. Você pode adicionar quantos colaboradores precisar sem custo adicional.',
        icon: 'fas fa-users',
        open: false
    },
    {
        question: 'Os dados ficam seguros?',
        answer: 'Sim! Utilizamos criptografia de ponta a ponta e fazemos backup automático diário de todos os seus dados. Seus dados estão 100% seguros.',
        icon: 'fas fa-shield-alt',
        open: false
    },
    {
        question: 'Preciso instalar algum software?',
        answer: 'Não! O Gestão Fácil é 100% online. Basta acessar pelo navegador de qualquer dispositivo com internet.',
        icon: 'fas fa-cloud',
        open: false
    },
    {
        question: 'Vocês oferecem suporte?',
        answer: 'Sim! Oferecemos suporte prioritário por email, chat e telefone em horário comercial. Nossa equipe está sempre pronta para ajudar.',
        icon: 'fas fa-headset',
        open: false
    }
])

// Animation refs
const dashboardRef = ref<HTMLElement | null>(null)
const dashboardVisible = ref(false)
const statsContainerRef = ref<HTMLElement | null>(null)
const statsVisible = ref<boolean[]>([false, false, false, false])
const featuresContainerRef = ref<HTMLElement | null>(null)
const featuresVisible = ref<boolean[]>(new Array(features.length).fill(false))

// Counter setup
const setupCounter = (el: HTMLElement, stat: any, index: number) => {
    // Simple animation for display values
    if (statsVisible.value[index]) {
        stat.displayValue = stat.value
    }
}

// Toggle FAQ
const toggleFaq = (index: number) => {
    faqs.value[index].open = !faqs.value[index].open
}

// Intersection Observers
let dashboardObserver: IntersectionObserver | null = null
let statsObserver: IntersectionObserver | null = null
let featuresObserver: IntersectionObserver | null = null

onMounted(() => {
    // Dashboard animation
    if (dashboardRef.value) {
        dashboardObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        dashboardVisible.value = true
                        dashboardObserver?.unobserve(entry.target)
                    }
                })
            },
            { threshold: 0.2 }
        )
        dashboardObserver.observe(dashboardRef.value)
    }

    // Stats animation
    if (statsContainerRef.value) {
        statsObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        statistics.value.forEach((_, index) => {
                            setTimeout(() => {
                                statsVisible.value[index] = true
                            }, index * 150)
                        })
                        statsObserver?.unobserve(entry.target)
                    }
                })
            },
            { threshold: 0.3 }
        )
        statsObserver.observe(statsContainerRef.value)
    }

    // Features animation
    if (featuresContainerRef.value) {
        featuresObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        features.forEach((_, index) => {
                            setTimeout(() => {
                                featuresVisible.value[index] = true
                            }, index * 100)
                        })
                        featuresObserver?.unobserve(entry.target)
                    }
                })
            },
            { threshold: 0.1 }
        )
        featuresObserver.observe(featuresContainerRef.value)
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault()
            const href = anchor.getAttribute('href')
            if (href && href !== '#') {
                const element = document.querySelector(href)
                element?.scrollIntoView({ behavior: 'smooth' })
            }
        })
    })
})

onUnmounted(() => {
    dashboardObserver?.disconnect()
    statsObserver?.disconnect()
    featuresObserver?.disconnect()
})
</script>

<style scoped>
@keyframes slide-up {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-slide-up {
    animation: slide-up 0.6s ease-out forwards;
}

@keyframes fade-in {
    from {
        opacity: 0;
    }

    to {
        opacity: 1;
    }
}

.animate-fade-in {
    animation: fade-in 0.8s ease-out forwards;
}

/* Smooth scroll */
html {
    scroll-behavior: smooth;
}
</style>