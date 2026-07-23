<template>
    <div class="space-y-4">
        <!-- Identidade da conta: logo + dados que o assinante não edita aqui -->
        <Card class="rounded-t-none bg-background">
            <CardContent class="p-6">
                <div class="flex flex-col gap-6 md:flex-row md:items-start">
                    <div class="flex flex-col items-center gap-3">
                        <div class="relative">
                            <Avatar class="h-24 w-24 rounded-xl border border-border">
                                <AvatarImage :src="previewFoto || logoAtual" :alt="conta.nome || 'Logo da conta'" />
                                <AvatarFallback class="rounded-xl text-xl">
                                    {{ getLettersName(conta.nome || 'Conta') }}
                                </AvatarFallback>
                            </Avatar>
                            <button v-if="podeAlterarFoto" type="button"
                                class="absolute -bottom-1 -right-1 rounded-full border border-border bg-card p-2 text-primary shadow-sm transition hover:bg-muted"
                                v-tooltip="'Alterar logo'" @click="abrirSeletorArquivo">
                                <Camera class="h-4 w-4" />
                            </button>
                        </div>

                        <input ref="inputFoto" type="file" class="hidden" accept="image/jpeg,image/png,image/webp"
                            @change="onArquivoSelecionado" />

                        <div v-if="podeAlterarFoto" class="flex flex-col items-center gap-1">
                            <div v-if="arquivoFoto" class="flex items-center gap-2">
                                <Button type="button" size="sm" class="text-white" :disabled="enviandoFoto"
                                    @click="enviarFoto">
                                    <LoaderIcon v-if="enviandoFoto" class="h-4 w-4 animate-spin" />
                                    <CircleCheck v-else class="h-4 w-4" />
                                    {{ enviandoFoto ? 'Enviando...' : 'Salvar logo' }}
                                </Button>
                                <Button type="button" size="sm" variant="outline" :disabled="enviandoFoto"
                                    @click="cancelarFoto">
                                    Cancelar
                                </Button>
                            </div>
                            <p v-else class="text-center text-xs text-muted-foreground">
                                JPG, PNG ou WebP · até 2 MB
                            </p>
                        </div>
                    </div>

                    <div class="min-w-0 flex-1 space-y-3">
                        <div class="min-w-0">
                            <h2 class="truncate text-xl font-semibold text-foreground">
                                {{ conta.nomeFantasia || conta.nome || 'Sua empresa' }}
                            </h2>
                            <p class="truncate text-sm text-muted-foreground">
                                {{ conta.nome || '—' }}<span v-if="conta.documento"> · {{ conta.documento }}</span>
                            </p>
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                            <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                                :class="statusInfo.cls">
                                <component :is="statusInfo.icon" class="h-3.5 w-3.5" />
                                {{ statusInfo.label }}
                            </span>
                            <span
                                class="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                                <Phone class="h-3.5 w-3.5" /> Telefone {{ conta.telefone ?? '—' }}
                            </span>
                        </div>

                        <div class="grid gap-3 sm:grid-cols-3">
                            <div class="rounded-lg border border-border bg-body/60 p-3">
                                <p class="text-xs text-muted-foreground">Cliente desde</p>
                                <p class="text-sm font-semibold text-foreground">{{ dataCadastro }}</p>
                            </div>
                            <div class="rounded-lg border border-border bg-body/60 p-3">
                                <p class="text-xs text-muted-foreground">Próximo vencimento</p>
                                <p class="text-sm font-semibold text-foreground">{{ dataVencimento }}</p>
                            </div>
                            <div class="rounded-lg border border-border bg-body/60 p-3">
                                <p class="text-xs text-muted-foreground">Mensalidade</p>
                                <p class="text-sm font-semibold text-foreground">{{ mensalidade }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- Dados cadastrais -->
        <Card class="bg-background">
            <CardHeader>
                <CardTitle class="font-normal flex items-center gap-2">
                    <Building class="w-5 h-5 text-primary" /> Dados da empresa
                </CardTitle>
                <CardDescription>Informações exibidas em notas, recibos e relatórios.</CardDescription>
            </CardHeader>

            <form @submit.prevent="submitForm">
                <CardContent class="space-y-6">
                    <section class="space-y-4">
                        <h3 class="text-sm font-semibold text-foreground">Identificação</h3>
                        <div class="grid md:grid-cols-2 gap-4">
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
                        </div>
                    </section>

                    <Separator />

                    <section class="space-y-4">
                        <h3 class="text-sm font-semibold text-foreground">Contato</h3>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label for="telefone">Telefone</Label>
                                <Input id="telefone" v-maska="phoneMaskOptions" placeholder="(00) 0000-0000"
                                    v-model="form.telefone" />
                            </div>
                            <div class="space-y-2">
                                <Label for="email">E-mail</Label>
                                <Input id="email" disabled placeholder="seu@email.com" type="email"
                                    v-model="form.email" />
                                <p class="text-xs text-muted-foreground">
                                    O e-mail de acesso da conta é alterado pelo suporte.
                                </p>
                            </div>
                        </div>
                    </section>

                    <Separator />

                    <section class="space-y-4">
                        <h3 class="text-sm font-semibold text-foreground">Endereço</h3>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div class="space-y-2">
                                <Label for="endereco">Endereço</Label>
                                <Input id="endereco" placeholder="Endereço completo" v-model="form.endereco" />
                            </div>
                            <div class="space-y-2">
                                <Label for="cep">CEP</Label>
                                <Input id="cep" placeholder="CEP" v-model="form.cep" />
                            </div>
                        </div>
                    </section>
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
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ContaRepository, type UpdateConta } from '@/repositories/conta-repository'
import { useToast } from 'vue-toastification'
import { Building, Camera, CircleCheck, CircleSlash, FileDigit, LoaderIcon, Phone, ShieldCheck, ShieldX } from 'lucide-vue-next'
import { vMaska } from 'maska/vue'
import { cpfCnpjMaskOptions, phoneMaskOptions } from '@/lib/imaska'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUiStore } from '@/stores/ui/uiStore'
import { formatCurrencyBR, formatDateToPtBR, getLettersName } from '@/utils/formatters'
import { resolveFileUrl } from '@/utils/fileUrl'
import type { Contas } from '@/types/schemas'

const TAMANHO_MAXIMO_FOTO = 2 * 1024 * 1024
const TIPOS_FOTO_ACEITOS = ['image/jpeg', 'image/png', 'image/webp']

const toast = useToast()
const storeUi = useUiStore()
const loading = ref(false)
const conta = ref<Partial<Contas>>({})
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

// ---- Logo da conta ----
const inputFoto = ref<HTMLInputElement | null>(null)
const arquivoFoto = ref<File | null>(null)
const previewFoto = ref<string | null>(null)
const enviandoFoto = ref(false)

const podeAlterarFoto = computed(() => storeUi.permissoes.admin)
const logoAtual = computed(() => resolveFileUrl(conta.value.profile || storeUi.contaInfo.profile, { bustCache: true }))

const statusInfo = computed(() => {
    const status = String(conta.value.status || storeUi.contaInfo.status || '').toUpperCase()
    if (status === 'ATIVO') return { label: 'Conta ativa', cls: 'text-emerald-600 bg-emerald-500/10', icon: ShieldCheck }
    if (status === 'BLOQUEADO') return { label: 'Conta bloqueada', cls: 'text-rose-600 bg-rose-500/10', icon: ShieldX }
    return { label: 'Conta inativa', cls: 'text-amber-600 bg-amber-500/10', icon: CircleSlash }
})

const dataCadastro = computed(() => {
    const data = conta.value.createdAt || conta.value.data
    return data ? formatDateToPtBR(data) : '—'
})

const dataVencimento = computed(() =>
    conta.value.vencimento ? formatDateToPtBR(conta.value.vencimento) : '—',
)

const mensalidade = computed(() =>
    conta.value.valor == null ? '—' : formatCurrencyBR(conta.value.valor),
)

function abrirSeletorArquivo() {
    inputFoto.value?.click()
}

function limparSelecao() {
    if (previewFoto.value) URL.revokeObjectURL(previewFoto.value)
    previewFoto.value = null
    arquivoFoto.value = null
    if (inputFoto.value) inputFoto.value.value = ''
}

function onArquivoSelecionado(event: Event) {
    const arquivo = (event.target as HTMLInputElement).files?.[0]
    if (!arquivo) return

    if (!TIPOS_FOTO_ACEITOS.includes(arquivo.type)) {
        toast.error('A imagem deve ser no formato JPEG, PNG ou WebP')
        limparSelecao()
        return
    }

    if (arquivo.size > TAMANHO_MAXIMO_FOTO) {
        toast.error('A imagem deve ter no máximo 2MB')
        limparSelecao()
        return
    }

    if (previewFoto.value) URL.revokeObjectURL(previewFoto.value)
    arquivoFoto.value = arquivo
    previewFoto.value = URL.createObjectURL(arquivo)
}

function cancelarFoto() {
    limparSelecao()
}

async function enviarFoto() {
    if (!arquivoFoto.value) return

    try {
        enviandoFoto.value = true
        await ContaRepository.uploadPerfil(arquivoFoto.value)
        await storeUi.getDataUsuario()
        // A sidebar lê o logo do store, então o cache-bust aqui atualiza o avatar sem reload.
        storeUi.setLogoProfile(resolveFileUrl(storeUi.contaInfo?.profile, { bustCache: true }))
        await getDataConta()
        limparSelecao()
        toast.success('Logo da conta atualizada')
    } catch (error) {
        console.error(error)
        toast.error('Erro ao atualizar a logo da conta')
    } finally {
        enviandoFoto.value = false
    }
}

onBeforeUnmount(limparSelecao)

const submitForm = async () => {
    try {
        loading.value = true
        await ContaRepository.update(form.value)
        await storeUi.getDataUsuario()
        await getDataConta()
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
        conta.value = response
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
