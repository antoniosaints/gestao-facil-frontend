<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Gem, Plus, UsersRound } from 'lucide-vue-next'
import { useToast } from 'vue-toastification'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { OuriveRepository } from '@/repositories/ourive-repository'

const toast = useToast()
const loading = ref(false)
const savingId = ref<number | null>(null)
const newSpecialty = ref('')
const team = ref<any[]>([])
const specialties = ref<any[]>([])
const roles = ['GESTOR', 'ATENDIMENTO', 'OURIVE', 'REVISAO']
const roleLabel = (role: string) => ({ GESTOR: 'Gestor', ATENDIMENTO: 'Atendimento', OURIVE: 'Ourive', REVISAO: 'Revisão' } as Record<string, string>)[role] || role
async function load() {
  loading.value = true
  try { [team.value, specialties.value] = await Promise.all([OuriveRepository.equipe(), OuriveRepository.especialidades()]) }
  catch { toast.error('Não foi possível carregar a equipe.') } finally { loading.value = false }
}
function toggle(list: number[], id: number) { return list.includes(id) ? list.filter((item) => item !== id) : [...list, id] }
function toggleRole(member: any, role: string) { member.papeis = member.papeis.includes(role) ? member.papeis.filter((item: string) => item !== role) : [...member.papeis, role] }
function toggleSpecialty(member: any, id: number) { member.especialidadeIds = toggle(member.especialidadeIds || [], id) }
async function saveSpecialty() {
  if (!newSpecialty.value.trim()) return
  try { await OuriveRepository.salvarEspecialidade({ nome: newSpecialty.value.trim() }); newSpecialty.value = ''; specialties.value = await OuriveRepository.especialidades(); toast.success('Especialidade adicionada.') }
  catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível salvar a especialidade.') }
}
async function saveMember(member: any) {
  savingId.value = member.id
  try { await OuriveRepository.salvarEquipe(member.id, { papeis: member.papeis, especialidadeIds: member.especialidadeIds || [] }); toast.success(`${member.nome} atualizado.`) }
  catch (error: any) { toast.error(error?.response?.data?.error?.message || 'Não foi possível atualizar o profissional.') } finally { savingId.value = null }
}
onMounted(load)
</script>

<template>
  <section class="space-y-6"><div><h2 class="flex items-center gap-2 text-2xl font-bold"><UsersRound class="h-6 w-6 text-primary" />Equipe e especialidades</h2><p class="text-sm text-muted-foreground">Organize funções e aptidões de cada profissional do ateliê.</p></div>
    <div class="grid gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]"><Card><CardHeader><CardTitle class="flex items-center gap-2 text-base"><Gem class="h-4 w-4 text-primary" />Especialidades</CardTitle><CardDescription>Habilitações disponíveis para as etapas.</CardDescription></CardHeader><CardContent class="space-y-4"><div class="flex gap-2"><Input v-model="newSpecialty" placeholder="Ex.: Cravação" @keyup.enter="saveSpecialty" /><Button size="icon" @click="saveSpecialty"><Plus class="h-4 w-4" /></Button></div><div class="flex flex-wrap gap-2"><Badge v-for="specialty in specialties" :key="specialty.id" variant="secondary">{{ specialty.nome }}</Badge><p v-if="!specialties.length" class="text-sm text-muted-foreground">Nenhuma especialidade cadastrada.</p></div></CardContent></Card>
      <div class="space-y-3"><div v-if="loading" class="py-12 text-center text-sm text-muted-foreground">Carregando equipe…</div><Card v-for="member in team" :key="member.id"><CardContent class="p-4 sm:p-5"><div class="flex flex-col gap-4"><div class="flex flex-col justify-between gap-2 sm:flex-row"><div><p class="font-semibold">{{ member.nome }}</p><p class="text-sm text-muted-foreground">{{ member.email }}</p></div><Badge :variant="member.status ? 'secondary' : 'outline'">{{ member.status || 'Ativo' }}</Badge></div><div class="grid gap-4 lg:grid-cols-2"><div><p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Funções no módulo</p><div class="flex flex-wrap gap-2"><button v-for="role in roles" :key="role" type="button" class="rounded-full border px-3 py-1.5 text-sm transition" :class="member.papeis.includes(role) ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-muted'" @click="toggleRole(member, role)">{{ roleLabel(role) }}</button></div></div><div><p class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Especialidades</p><div class="flex flex-wrap gap-2"><button v-for="specialty in specialties" :key="specialty.id" type="button" class="rounded-full border px-3 py-1.5 text-sm transition" :class="member.especialidadeIds?.includes(specialty.id) ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted'" @click="toggleSpecialty(member, specialty.id)">{{ specialty.nome }}</button><span v-if="!specialties.length" class="text-sm text-muted-foreground">Cadastre especialidades para vincular.</span></div></div></div><div class="flex justify-end border-t pt-3"><Button size="sm" :disabled="savingId === member.id" @click="saveMember(member)">{{ savingId === member.id ? 'Salvando…' : 'Salvar alterações' }}</Button></div></div></CardContent></Card><Card v-if="!loading && !team.length"><CardContent class="p-10 text-center text-sm text-muted-foreground">Nenhum usuário encontrado nesta conta.</CardContent></Card></div></div>
  </section>
</template>
