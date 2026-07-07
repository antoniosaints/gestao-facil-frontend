<template>
    <ModalView v-model:open="openCreateModal" title="Novo assinante"
        description="Cria a conta e o usuário root do assinante." size="lg">
        <form class="space-y-4 px-4 pb-4" @submit.prevent="submit">
            <div class="grid gap-3 md:grid-cols-2">
                <div class="grid gap-1">
                    <Label for="novoAssinanteConta">Nome da conta<span class="text-danger">*</span></Label>
                    <Input id="novoAssinanteConta" v-model="form.conta" placeholder="Ex: Mercearia do João" />
                </div>
                <div class="grid gap-1">
                    <Label for="novoAssinanteNome">Nome do usuário root<span class="text-danger">*</span></Label>
                    <Input id="novoAssinanteNome" v-model="form.nomeUsuario" placeholder="Nome completo" />
                </div>
                <div class="grid gap-1">
                    <Label for="novoAssinanteEmail">E-mail<span class="text-danger">*</span></Label>
                    <Input id="novoAssinanteEmail" v-model="form.email" type="email" placeholder="email@dominio.com" />
                </div>
                <div class="grid gap-1">
                    <Label for="novoAssinanteSenha">Senha<span class="text-danger">*</span></Label>
                    <Input id="novoAssinanteSenha" v-model="form.senha" type="text" placeholder="Mínimo 6 caracteres" />
                </div>
                <div class="grid gap-1">
                    <Label for="novoAssinanteTelefone">Telefone<span class="text-danger">*</span></Label>
                    <Input id="novoAssinanteTelefone" v-model="form.telefone" placeholder="(00) 00000-0000" />
                </div>
                <div class="grid gap-1">
                    <Label for="novoAssinanteTipo">Tipo</Label>
                    <Input id="novoAssinanteTipo" v-model="form.tipo" placeholder="Categoria do negócio" />
                </div>
                <div class="grid gap-1">
                    <Label for="novoAssinanteFuncionarios">Funcionários</Label>
                    <Input id="novoAssinanteFuncionarios" v-model.number="form.funcionarios" type="number" min="1" />
                </div>
                <div class="grid gap-1">
                    <Label for="novoAssinanteValor">Valor do plano (R$)</Label>
                    <Input id="novoAssinanteValor" v-model.number="form.valorBasePlano" type="number" min="1" step="0.01" />
                </div>
                <div class="grid gap-1">
                    <Label for="novoAssinanteDias">Dias até o 1º vencimento</Label>
                    <Input id="novoAssinanteDias" v-model.number="form.diasTeste" type="number" min="0" max="365" />
                </div>
            </div>

            <div class="flex justify-end gap-2">
                <Button type="button" variant="outline" :disabled="saving" @click="openCreateModal = false">
                    Cancelar
                </Button>
                <Button type="submit" class="text-white" :disabled="saving">
                    <UserPlus class="h-4 w-4" />
                    {{ saving ? 'Criando...' : 'Criar assinante' }}
                </Button>
            </div>
        </form>
    </ModalView>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { UserPlus } from 'lucide-vue-next'
import ModalView from '@/components/formulario/ModalView.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ContaRepository, type CreateAssinanteAdminPayload } from '@/repositories/conta-repository'
import { useAssinantesAdmin } from './useAssinantesAdmin'

const toast = useToast()
const { openCreateModal, triggerRefresh } = useAssinantesAdmin()
const saving = ref(false)

function defaultForm(): CreateAssinanteAdminPayload {
    return {
        conta: '',
        nomeUsuario: '',
        email: '',
        senha: '',
        telefone: '',
        tipo: 'EMPRESA',
        funcionarios: 1,
        valorBasePlano: 70,
        diasTeste: 7,
    }
}

const form = reactive<CreateAssinanteAdminPayload>(defaultForm())

watch(openCreateModal, (open) => {
    if (open) Object.assign(form, defaultForm())
})

async function submit() {
    if (!form.conta.trim() || !form.nomeUsuario.trim() || !form.email.trim() || !form.senha || !form.telefone.trim()) {
        toast.error('Preencha todos os campos obrigatórios')
        return
    }
    if (form.senha.length < 6) {
        toast.error('A senha precisa de ao menos 6 caracteres')
        return
    }

    try {
        saving.value = true
        await ContaRepository.criarAssinanteAdmin({ ...form })
        toast.success('Assinante criado com sucesso')
        openCreateModal.value = false
        triggerRefresh()
    } catch (error: any) {
        console.log(error)
        toast.error(error.response?.data?.message || 'Erro ao criar o assinante')
    } finally {
        saving.value = false
    }
}
</script>
