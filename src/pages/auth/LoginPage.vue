<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { useAuthStore } from '@/stores/login/useAuthStore';
import {
    Loader2, LogIn, Mail, Lock, Eye, EyeOff,
    ScanLine, Boxes, Wallet, LineChart,
    ShieldCheck, DatabaseBackup, Headset, ArrowRight, TriangleAlert,
} from 'lucide-vue-next';

// Shadcn Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

const store = useAuthStore();

const login = ref({
    email: '',
    password: ''
});

const showPassword = ref(false);
const loading = ref(false);
const showForgotPasswordDialog = ref(false);
const saveDataLogin = ref<boolean>(localStorage.getItem('gestao_facil:credentials_login') == 'true' || false);

// Bloqueio por excesso de tentativas (429 do rate limiter). Enquanto > 0,
// mostramos um aviso visual com contagem regressiva e travamos o botão.
const rateLimitSeconds = ref(0);
const rateLimitMessage = ref('');
let rateLimitTimer: ReturnType<typeof setInterval> | null = null;

function startRateLimitCountdown(seconds: number, message?: string) {
    if (rateLimitTimer) clearInterval(rateLimitTimer);
    rateLimitSeconds.value = Math.max(1, Math.ceil(seconds));
    rateLimitMessage.value = message || 'Muitas tentativas de login.';
    rateLimitTimer = setInterval(() => {
        rateLimitSeconds.value -= 1;
        if (rateLimitSeconds.value <= 0 && rateLimitTimer) {
            clearInterval(rateLimitTimer);
            rateLimitTimer = null;
        }
    }, 1000);
}

onUnmounted(() => {
    if (rateLimitTimer) clearInterval(rateLimitTimer);
});

const features = [
    { icon: ScanLine, title: 'Vendas e PDV', desc: 'Caixa rápido e cupom' },
    { icon: Boxes, title: 'Estoque', desc: 'Controle em tempo real' },
    { icon: Wallet, title: 'Financeiro', desc: 'Fluxo de caixa e DRE' },
    { icon: LineChart, title: 'Relatórios', desc: 'Decisões com dados' },
];

const trust = [
    { icon: ShieldCheck, label: 'Dados criptografados' },
    { icon: DatabaseBackup, label: 'Backup diário' },
    { icon: Headset, label: 'Suporte dedicado' },
];

async function loginUsuario() {
    if (rateLimitSeconds.value > 0) return;
    loading.value = true;
    try {
        localStorage.setItem('gestao_facil:credentials_login', saveDataLogin.value.toString());
        const result = await store.login(login.value.email, login.value.password);
        if (result?.rateLimited) {
            startRateLimitCountdown(result.retryAfter ?? 60, result.message);
        }
    } catch (error) {
        console.error("Login falhou", error);
    } finally {
        loading.value = false;
    }
}

function togglePasswordVisibility() {
    showPassword.value = !showPassword.value;
}
</script>

<template>
    <div class="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">

        <!-- Left Side (Brand / Value) -->
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

            <!-- Brand -->
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
                        Sistema de gestão 100% online
                    </span>
                    <h1 class="text-4xl font-extrabold leading-[1.1] tracking-tight xl:text-5xl">
                        Tudo o que sua empresa<br />precisa em <span class="text-primary">um só lugar</span>.
                    </h1>
                    <p class="max-w-md text-lg text-zinc-400">
                        Vendas, estoque, financeiro e ordens de serviço — o controle completo do seu negócio,
                        de onde você estiver.
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

        <!-- Right Side (Form) -->
        <div class="relative flex flex-col justify-center bg-background p-6 lg:p-12">
            <!-- Mobile brand -->
            <div class="mb-8 flex items-center gap-3 lg:hidden">
                <img src="/imgs/logo.png" alt="Gestão Fácil" class="h-10 w-10 rounded-xl" />
                <span class="text-lg font-bold tracking-tight text-foreground">Gestão Fácil</span>
            </div>

            <div class="mx-auto w-full max-w-md space-y-8">
                <div class="space-y-2">
                    <h2 class="text-3xl font-bold tracking-tight text-foreground">Entrar na sua conta</h2>
                    <p class="text-muted-foreground">Bem-vindo de volta. Acesse para continuar gerenciando seu negócio.</p>
                </div>

                <!-- Aviso de bloqueio por excesso de tentativas (rate limit / 429) -->
                <div v-if="rateLimitSeconds > 0" role="alert"
                    class="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                    <TriangleAlert class="mt-0.5 h-5 w-5 shrink-0" />
                    <div class="space-y-0.5 text-sm">
                        <p class="font-semibold">Você excedeu o limite de tentativas de login</p>
                        <p>Por segurança, aguarde
                            <span class="font-bold tabular-nums">{{ rateLimitSeconds }}s</span>
                            e tente novamente.</p>
                    </div>
                </div>

                <form @submit.prevent="loginUsuario" class="space-y-5">
                    <div class="space-y-2">
                        <Label for="email">E-mail</Label>
                        <div class="relative">
                            <Mail class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="email" type="email" v-model="login.email" placeholder="seu@email.com"
                                class="h-11 pl-9" required />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <div class="flex items-center justify-between">
                            <Label for="password">Senha</Label>
                            <span @click="showForgotPasswordDialog = true"
                                class="cursor-pointer text-sm font-medium text-primary hover:text-primary/80">
                                Esqueceu a senha?
                            </span>
                        </div>
                        <div class="relative">
                            <Lock class="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input id="password" :type="showPassword ? 'text' : 'password'" v-model="login.password"
                                placeholder="••••••••" class="h-11 pl-9 pr-9" required />
                            <button type="button" @click="togglePasswordVisibility"
                                class="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
                                <Eye v-if="!showPassword" class="h-4 w-4" />
                                <EyeOff v-else class="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center space-x-2">
                        <Checkbox id="remember" :checked="saveDataLogin"
                            @update:checked="(val: boolean) => saveDataLogin = val" />
                        <label for="remember" class="text-sm font-medium leading-none text-muted-foreground">
                            Manter conectado
                        </label>
                    </div>

                    <Button type="submit" class="h-11 w-full text-base font-bold text-white dark:text-white"
                        :disabled="loading || rateLimitSeconds > 0">
                        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
                        <LogIn v-else class="mr-2 h-4 w-4" />
                        {{ loading ? 'Entrando...' : (rateLimitSeconds > 0 ? `Aguarde ${rateLimitSeconds}s` : 'Entrar') }}
                    </Button>
                </form>

                <!-- <div class="flex items-center gap-4">
                    <span class="h-px flex-1 bg-border"></span>
                    <span class="text-xs uppercase tracking-wide text-muted-foreground">Novo por aqui?</span>
                    <span class="h-px flex-1 bg-border"></span>
                </div>

                <RouterLink to="/site/cadastro"
                    class="group flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-card text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary">
                    Criar conta grátis
                    <ArrowRight class="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </RouterLink> -->

                <p class="text-center text-xs text-muted-foreground">
                    Ao continuar, você concorda com os
                    <RouterLink to="/site/termos-politica" class="underline underline-offset-2 hover:text-foreground">Termos</RouterLink>
                    e a
                    <RouterLink to="/site/termos-politica" class="underline underline-offset-2 hover:text-foreground">Política de Privacidade</RouterLink>.
                </p>
            </div>
        </div>

        <!-- Dialog: Recuperar Senha -->
        <Dialog v-model:open="showForgotPasswordDialog">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Recuperar Senha</DialogTitle>
                    <DialogDescription>
                        Digite o e-mail associado à sua conta para receber as instruções de recuperação.
                    </DialogDescription>
                </DialogHeader>
                <div class="grid gap-4 py-4">
                    <div class="grid gap-2">
                        <Label for="reset-email">E-mail</Label>
                        <Input id="reset-email" placeholder="seu@email.com" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" @click="showForgotPasswordDialog = false">Cancelar</Button>
                    <Button type="submit" class="font-bold text-white dark:text-white">Enviar Instruções</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
</template>

<style scoped>
.animate-pulse-slow {
    animation: pulse 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
