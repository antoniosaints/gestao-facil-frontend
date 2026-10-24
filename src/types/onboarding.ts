import type { ThemeCustomization } from './schemas'

export const OPERATION_KEYS = [
  'vendeProdutos',
  'prestaServicos',
  'usaAgendamento',
  'gerenciaQuadras',
  'atuaOurivesaria',
  'operaRestauranteDelivery',
  'usaCombos',
  'possuiContratosRecorrentes',
  'vendeOnline',
  'usaAtendimentoWhatsapp',
  'usaNotificacoesWhatsapp',
  'emiteNotas',
] as const
export type OperationKey = (typeof OPERATION_KEYS)[number]
export type OperationAnswers = Record<OperationKey, boolean>
export interface OnboardingConfig {
  version: 1
  catalogVersion?: string
  questions: Array<{ key: OperationKey; label: string; description?: string }>
  baseMenuKeys: string[]
  modules: Array<{
    codigo: string
    nome: string
    menuKey: string | null
    precoMensal: number
    status: boolean
    ativacaoNoCadastro: boolean
  }>
  themePresets: Array<{ id: string; nome: string; tema: Partial<ThemeCustomization> }>
  fonts: Array<string | { value: string; label: string }>
}
export interface OnboardingPreviewInput {
  version: 1
  catalogVersion?: string
  respostas: OperationAnswers
  modulosSelecionados?: string[]
  menusSelecionados?: string[]
}
export interface OnboardingPreview {
  version: 1
  catalogVersion?: string
  menusSugeridos: string[]
  menusEfetivos: string[]
  modulos: Array<{
    codigo: string
    motivo: string
    precoMensal: number
    selecionado: boolean
    acao: 'ATIVAR_GRATUITO' | 'RECOMENDAR_CONTRATACAO' | 'NAO_SELECIONADO'
  }>
  avisos: string[]
}
export interface RegistrationOnboarding extends OnboardingPreviewInput {
  modulosSelecionados: string[]
  menusSelecionados: string[]
  temaPersonalizado: ThemeCustomization
}
