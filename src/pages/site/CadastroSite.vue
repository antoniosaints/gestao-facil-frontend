<template>
    <div class="container mx-auto px-4 py-8">
        <div class="max-w-6xl mx-auto">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                <!-- Left Side - Benefits -->
                <div class="space-y-8 hidden sm:block">
                    <div>
                        <h2 class="text-4xl font-bold text-gray-800 dark:text-white mb-4">
                            Comece sua <span class="text-primary">gestão inteligente</span> hoje mesmo
                        </h2>
                        <p class="text-xl text-gray-600 dark:text-gray-300">
                            Junte-se a mais de 100 lojistas que já transformaram sua gestão
                        </p>
                    </div>

                    <!-- Benefits List -->
                    <div class="space-y-6">
                        <div class="flex items-start space-x-4">
                            <div
                                class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-check text-green-600 dark:text-green-400 text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">7 dias grátis</h3>
                                <p class="text-gray-600 dark:text-gray-300">Teste todas as funcionalidades sem
                                    compromisso</p>
                            </div>
                        </div>

                        <div class="flex items-start space-x-4">
                            <div
                                class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-bolt text-blue-600 dark:text-blue-400 text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Configuração rápida
                                </h3>
                                <p class="text-gray-600 dark:text-gray-300">Em 5 minutos você já estará vendendo</p>
                            </div>
                        </div>

                        <div class="flex items-start space-x-4">
                            <div
                                class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-headset text-purple-600 dark:text-purple-400 text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Suporte dedicado
                                </h3>
                                <p class="text-gray-600 dark:text-gray-300">Nossa equipe te ajuda na migração</p>
                            </div>
                        </div>

                        <div class="flex items-start space-x-4">
                            <div
                                class="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-xl flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-shield-alt text-orange-600 dark:text-orange-400 text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Dados seguros</h3>
                                <p class="text-gray-600 dark:text-gray-300">Criptografia e backup automático</p>
                            </div>
                        </div>
                    </div>

                    <!-- Social Proof -->
                    <div
                        class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <div class="flex items-center space-x-4 mb-4">
                            <div class="flex -space-x-2">
                                <div
                                    class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    JS</div>
                                <div
                                    class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    MS</div>
                                <div
                                    class="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    AL</div>
                                <div
                                    class="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                    +2k</div>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-800 dark:text-white">Mais de 100 lojas ativas</p>
                                <div class="flex items-center">
                                    <div class="flex text-yellow-400 mr-2">
                                        <i class="fas fa-star text-sm"></i>
                                        <i class="fas fa-star text-sm"></i>
                                        <i class="fas fa-star text-sm"></i>
                                        <i class="fas fa-star text-sm"></i>
                                        <i class="fas fa-star text-sm"></i>
                                    </div>
                                    <span class="text-sm text-gray-600 dark:text-gray-300">4.9/5 (500+
                                        avaliações)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Side - Form -->
                <div
                    class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
                    <div class="text-center mb-8">
                        <h3 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Criar conta gratuita</h3>
                        <p class="text-gray-600 dark:text-gray-300">Preencha os dados abaixo para começar</p>
                    </div>

                    <form id="signupForm" class="space-y-6">
                        <!-- Step Indicator -->
                        <div class="flex items-center justify-center mb-8">
                            <div class="flex items-center">
                                <!-- Step 1 -->
                                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                                    :class="step >= 1 ? 'bg-orange-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'">
                                    1
                                </div>
                                <div
                                    :class="step > 1 ? 'w-16 h-1 bg-orange-500 mx-2' : 'w-16 h-1 bg-gray-300 dark:bg-gray-600 mx-2'">
                                </div>

                                <!-- Step 2 -->
                                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                                    :class="step >= 2 ? 'bg-orange-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'">
                                    2
                                </div>
                                <div
                                    :class="step > 2 ? 'w-16 h-1 bg-orange-500 mx-2' : 'w-16 h-1 bg-gray-300 dark:bg-gray-600 mx-2'">
                                </div>

                                <!-- Step 3 -->
                                <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                                    :class="step >= 3 ? 'bg-orange-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'">
                                    3
                                </div>
                            </div>
                        </div>


                        <!-- Step 1: Personal Info -->
                        <div v-show="step === 1" id="step1Form" class="space-y-6">
                            {{ step }}
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Nome *
                                    </label>
                                    <input type="text" v-model="form.firstName" required
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                                        placeholder="Seu nome">
                                    <span v-if="errors.firstName" class="text-red-500 text-sm">Campo obrigatório</span>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Sobrenome *
                                    </label>
                                    <input type="text" v-model="form.lastName" required
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                                        placeholder="Seu sobrenome">
                                    <span v-if="errors.lastName" class="text-red-500 text-sm">Campo obrigatório</span>
                                </div>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    E-mail *
                                </label>
                                <input type="email" v-model="form.email" required
                                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                                    placeholder="seu@email.com">
                                <span v-if="errors.email" class="text-red-500 text-sm">E-mail inválido</span>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Telefone *
                                </label>
                                <input type="tel" v-model="form.phone" required
                                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                                    placeholder="(11) 99999-9999">
                                <span v-if="errors.phone" class="text-red-500 text-sm">Campo obrigatório</span>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Senha *
                                </label>
                                <div class="relative">
                                    <input type="password" v-model="form.password" required
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200 pr-12"
                                        placeholder="Mínimo 6 caracteres">
                                    <span v-if="errors.password" class="text-red-500 text-sm">Mínimo 6 caracteres</span>
                                </div>
                                <div class="mt-2">
                                    <div class="flex items-center space-x-2 text-sm">
                                        <div id="passwordStrength" class="flex space-x-1">
                                            <div class="w-6 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                            <div class="w-6 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                            <div class="w-6 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                            <div class="w-6 h-1 bg-gray-300 dark:bg-gray-600 rounded"></div>
                                        </div>
                                        <span id="passwordStrengthText" class="text-gray-500 dark:text-gray-400">Força
                                            da senha</span>
                                    </div>
                                </div>
                            </div>

                            <button type="button" @click="nextStep"
                                class="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg transition-colors duration-200 flex items-center justify-center">
                                Continuar
                                <i class="fas fa-arrow-right ml-2"></i>
                            </button>
                        </div>

                        <!-- Step 2: Store Info -->
                        <div v-show="step === 2" id="step2Form" class="space-y-6">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nome da Loja *
                                </label>
                                <input type="text" v-model="form.storeName" required
                                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                                    placeholder="Ex: Boutique Fashion">
                                <span v-if="errors.storeName" class="text-red-500 text-sm">Campo obrigatório</span>
                            </div>

                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Segmento *
                                </label>
                                <select id="segment" v-model="form.segment" required
                                    class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200">
                                    <option value="">Selecione o segmento</option>
                                    <option value="moda">Moda e Vestuário</option>
                                    <option value="eletronicos">Eletrônicos</option>
                                    <option value="alimentacao">Alimentação</option>
                                    <option value="farmacia">Farmácia</option>
                                    <option value="casa">Casa e Decoração</option>
                                    <option value="beleza">Beleza e Cosméticos</option>
                                    <option value="esportes">Esportes</option>
                                    <option value="outros">Outros</option>
                                </select>
                                <span v-if="errors.segment" class="text-red-500 text-sm">Campo obrigatório</span>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        CPF/CNPJ
                                    </label>
                                    <input type="text" v-model="form.cnpj"
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
                                        placeholder="CPF ou CNPJ">
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Funcionários *
                                    </label>
                                    <select id="employees" v-model="form.employees" required
                                        class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200">
                                        <option value="">Selecione</option>
                                        <option value="1">Apenas eu</option>
                                        <option value="5">2 a 5 funcionários</option>
                                        <option value="10">6 a 10 funcionários</option>
                                        <option value="20">Mais de 10</option>
                                    </select>
                                    <span v-if="errors.employees" class="text-red-500 text-sm">Campo obrigatório</span>
                                </div>
                            </div>

                            <div class="flex space-x-4">
                                <button type="button" @click="prevStep"
                                    class="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center">
                                    <i class="fas fa-arrow-left mr-2"></i>
                                    Voltar
                                </button>
                                <button type="button" @click="nextStep"
                                    class="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center">
                                    Continuar
                                    <i class="fas fa-arrow-right ml-2"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Step 3: Confirmation -->
                        <div v-show="step === 3" id="step3Form" class="space-y-6">
                            <div class="text-center">
                                <div
                                    class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <i class="fas fa-check text-green-600 dark:text-green-400 text-2xl"></i>
                                </div>
                                <h4 class="text-xl font-semibold text-gray-800 dark:text-white mb-2">Quase pronto!</h4>
                                <p class="text-gray-600 dark:text-gray-300">Revise suas informações e confirme o
                                    cadastro</p>
                            </div>

                            <!-- Summary -->
                            <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 space-y-4">
                                <div class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-300">Nome:</span>
                                    <span id="summaryName" class="font-semibold text-gray-800 dark:text-white">
                                        {{ form.firstName }} {{ form.lastName }}
                                    </span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-300">E-mail:</span>
                                    <span id="summaryEmail" class="font-semibold text-gray-800 dark:text-white">
                                        {{ form.email }}
                                    </span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-300">Loja:</span>
                                    <span id="summaryStore" class="font-semibold text-gray-800 dark:text-white">
                                        {{ form.storeName }}
                                    </span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-300">Segmento:</span>
                                    <span id="summarySegment" class="font-semibold text-gray-800 dark:text-white">
                                        {{ form.segment }}
                                    </span>
                                </div>
                            </div>

                            <!-- Terms -->
                            <div class="space-y-4">
                                <label class="flex items-start space-x-3">
                                    <input type="checkbox" v-model="form.terms" required
                                        class="mt-1 w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500">
                                    <span class="text-sm text-gray-600 dark:text-gray-300">
                                        Aceito os <a href="/site/termos-politica" target="_blank"
                                            class="text-blue hover:underline">Termos de Uso</a>
                                        e
                                        <a href="/site/termos-politica#privacidade" target="_blank"
                                            class="text-blue hover:underline">Política de Privacidade</a>
                                    </span>
                                    <span v-if="errors.terms" class="text-red-500 text-sm">Campo obrigatório</span>
                                </label>

                                <label class="flex items-start space-x-3">
                                    <input type="checkbox" id="newsletter"
                                        class="mt-1 w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500">
                                    <span class="text-sm text-gray-600 dark:text-gray-300">
                                        Quero receber dicas e novidades por e-mail
                                    </span>
                                </label>
                            </div>

                            <div class="flex space-x-4">
                                <button type="button" @click="prevStep"
                                    class="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center">
                                    <i class="fas fa-arrow-left mr-2"></i>
                                    Voltar
                                </button>
                                <button type="submit" id="submitForm"
                                    class="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center justify-center">
                                    <i class="fas fa-rocket mr-2"></i>
                                    Criar Conta Grátis
                                </button>
                            </div>
                        </div>
                    </form>

                    <!-- Footer -->
                    <div class="mt-8 text-center">
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Já tem uma conta?
                            <RouterLink to="/login"
                                class="text-blue hover:text-blue-600 font-semibold transition-colors duration-200">
                                Clique aqui para entrar
                            </RouterLink>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();

// Step atual
const step = ref(1);

// Campos do formulário
const form = ref({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    storeName: '',
    segment: '',
    cnpj: '',
    employees: '',
    terms: false,
    newsletter: false
});

// Validação simples
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
});

const validateStep1 = () => {
    errors.value.firstName = !form.value.firstName;
    errors.value.lastName = !form.value.lastName;
    errors.value.email = !form.value.email || !/^\S+@\S+\.\S+$/.test(form.value.email);
    errors.value.phone = !form.value.phone;
    errors.value.password = !form.value.password || form.value.password.length < 6;

    return !Object.values(errors.value).some((e, idx) => idx < 5 && e);
};

const validateStep2 = () => {
    errors.value.storeName = !form.value.storeName;
    errors.value.segment = !form.value.segment;
    errors.value.employees = !form.value.employees;

    return !errors.value.storeName && !errors.value.segment && !errors.value.employees;
};

const validateStep3 = () => {
    errors.value.terms = !form.value.terms;
    return !errors.value.terms;
};

// Navegação entre steps
const nextStep = () => {
    if (step.value === 1 && validateStep1()) step.value++;
    else if (step.value === 2 && validateStep2()) step.value++;
};

const prevStep = () => {
    if (step.value > 1) step.value--;
};

const submitForm = () => {
    if (validateStep3()) {
        alert('Formulário enviado com sucesso!');
        // router.push('/login') // redirecionar se necessário
    }
};

// Summary para Step 3
const summary = computed(() => ({
    name: `${form.value.firstName} ${form.value.lastName}`,
    email: form.value.email,
    store: form.value.storeName,
    segment: form.value.segment
}));
</script>