<template>
    <ModalView v-model:open="openAcessarModal" title="Acessar conta do assinante"
        description="Abre uma sessão de suporte temporária dentro da conta." size="md">
        <form class="space-y-4 px-4 pb-4" @submit.prevent="submit">
            <div class="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-950">
                <p class="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
                    <ShieldAlert class="h-4 w-4 shrink-0" />
                    Acesso com poderes totais
                </p>
                <ul class="mt-2 list-disc space-y-1 pl-5 text-amber-800 dark:text-amber-300">
                    <li>Você entra como o usuário root de <strong>{{ selectedConta?.nome }}</strong> e pode ler e alterar
                        os dados dele.</li>
                    <li>A sessão dura 1 hora e não é renovada.</li>
                    <li>Este acesso fica registrado com seu nome e o motivo informado.</li>
                </ul>
            </div>

            <div class="grid gap-1">
                <Label for="acessarMotivo">Motivo do atendimento<span class="text-danger">*</span></Label>
                <Textarea id="acessarMotivo" v-model="form.motivo" rows="3"
                    placeholder="Ex: Chamado #1234 — cliente relata erro ao fechar o caixa" />
                <p class="text-xs text-muted-foreground">Mínimo de 10 caracteres. Fica salvo na auditoria.</p>
            </div>

            <div class="grid gap-1">
                <Label for="acessarSenha">Sua senha<span class="text-danger">*</span></Label>
                <Input id="acessarSenha" v-model="form.senha" type="password" autocomplete="current-password"
                    placeholder="Confirme sua senha para continuar" />
            </div>

            <div class="flex justify-end gap-2">
                <Button type="button" variant="outline" :disabled="loading" @click="openAcessarModal = false">
                    Cancelar
                </Button>
                <Button type="submit" class="text-white" :disabled="loading">
                    <Loader v-if="loading" class="h-4 w-4 animate-spin" />
                    <LogIn v-else class="h-4 w-4" />
                    {{ loading ? 'Abrindo sessão...' : 'Acessar conta' }}
                </Button>
            </div>
        </form>
    </ModalView>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { Loader, LogIn, ShieldAlert } from 'lucide-vue-next'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ContaRepository } from '@/repositories/conta-repository'
import { enterSupport } from '@/utils/supportSession'
import { useAssinantesAdmin } from './useAssinantesAdmin'

const toast = useToast()
const { openAcessarModal, selectedConta } = useAssinantesAdmin()
const loading = ref(false)

const form = reactive({ senha: '', motivo: '' })

watch(openAcessarModal, (open) => {
    if (open) {
        form.senha = ''
        form.motivo = ''
    }
})

async function submit() {
    if (!selectedConta.value) return

    if (form.motivo.trim().length < 10) {
        toast.error('Descreva o motivo do atendimento (mínimo 10 caracteres)')
        return
    }
    if (!form.senha) {
        toast.error('Informe sua senha para continuar')
        return
    }

    try {
        loading.value = true
        const res = await ContaRepository.acessarContaAdmin(selectedConta.value.id, {
            senha: form.senha,
            motivo: form.motivo.trim(),
        })

        enterSupport(res.data.token, {
            sessaoId: res.data.sessaoId,
            expiraEm: res.data.expiraEm,
            conta: res.data.conta,
            usuarioAlvo: res.data.usuarioAlvo,
        })

        // Reload duro: a uiStore está populada com o CEO e precisa ser reconstruída
        // do zero como o root do assinante.
        window.location.href = '/'
    } catch (error: any) {
        console.log(error)
        toast.error(error.response?.data?.message || 'Erro ao acessar a conta')
        loading.value = false
    }
}
</script>
