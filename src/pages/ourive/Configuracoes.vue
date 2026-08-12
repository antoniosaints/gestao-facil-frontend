<template>
  <section class="space-y-6"><div class="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-transparent p-6"><p class="text-xs font-semibold tracking-[0.18em] text-amber-700 dark:text-amber-300">ATELIÊ</p><h1 class="mt-1 text-3xl font-bold">Configurações</h1><p class="mt-1 text-sm text-muted-foreground">Defina as contas e categorias que serão usadas na entrega e nas comissões.</p></div><Card><CardHeader><CardTitle>Financeiro automático</CardTitle><CardDescription>A seleção usa os cadastros financeiros da conta, sem digitação de IDs.</CardDescription></CardHeader><CardContent class="grid gap-5 md:grid-cols-2"><label class="grid gap-2 text-sm font-medium">Categoria da receita <Select2Ajax v-model="form.receitaCategoriaId" url="/lancamentos/categorias/select2" placeholder="Selecione a categoria" /></label><label class="grid gap-2 text-sm font-medium">Conta da receita <Select2Ajax v-model="form.receitaContaFinanceiraId" url="/lancamentos/contas/select2" placeholder="Selecione a conta" /></label><label class="grid gap-2 text-sm font-medium">Categoria das comissões <Select2Ajax v-model="form.comissaoCategoriaId" url="/lancamentos/categorias/select2" placeholder="Selecione a categoria" /></label><label class="grid gap-2 text-sm font-medium">Conta das comissões <Select2Ajax v-model="form.comissaoContaFinanceiraId" url="/lancamentos/contas/select2" placeholder="Selecione a conta" /></label><label class="grid gap-2 text-sm font-medium">Validade do orçamento (dias)<Input v-model.number="form.prazoAprovacaoDias" type="number" min="1" max="30" /></label><div class="flex items-end"><Button :disabled="saving" @click="save">Salvar configurações</Button></div></CardContent></Card></section>
</template>
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Select2Ajax from '@/components/formulario/Select2Ajax.vue'
import { OuriveRepository } from '@/repositories/ourive-repository'
const toast = useToast(); const saving = ref(false); const form = ref<any>({ prazoAprovacaoDias: 7, receitaCategoriaId: null, receitaContaFinanceiraId: null, comissaoCategoriaId: null, comissaoContaFinanceiraId: null })
async function load() { try { form.value = await OuriveRepository.configuracao() } catch { toast.error('Não foi possível carregar as configurações.') } }
async function save() { saving.value = true; try { await OuriveRepository.salvarConfiguracao(form.value); toast.success('Configurações salvas.') } catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar.') } finally { saving.value = false } }
onMounted(load)
</script>
