import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useToast } from 'vue-toastification'
import {
  CaixaRepository,
  type AbrirCaixaPayload,
  type FecharCaixaPayload,
  type MovimentarCaixaPayload,
} from '@/repositories/caixa-repository'
import type { CaixaSessao, PdvPonto } from '@/types/schemas'

export const useCaixaStore = defineStore('caixaStore', () => {
  const toast = useToast()
  const loading = ref(false)
  const caixaAtivo = ref<CaixaSessao | null>(null)
  const caixasAbertos = ref<CaixaSessao[]>([])
  const pdvs = ref<PdvPonto[]>([])
  const openModalSelecionarCaixa = ref(false)
  const openModalMovimento = ref(false)
  const openModalFechamento = ref(false)

  async function loadContexto() {
    try {
      loading.value = true
      const contexto = await CaixaRepository.contexto()
      caixaAtivo.value = contexto.caixaAtivo
      caixasAbertos.value = contexto.caixasAbertos || []
      pdvs.value = contexto.pdvs || []
      openModalSelecionarCaixa.value = !contexto.caixaAtivo
      return contexto
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao carregar caixa do PDV')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function abrirCaixa(payload: AbrirCaixaPayload) {
    try {
      loading.value = true
      caixaAtivo.value = await CaixaRepository.abrirCaixa(payload)
      openModalSelecionarCaixa.value = false
      toast.success('Caixa aberto com sucesso')
      await loadContexto()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao abrir caixa')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function entrarCaixa(caixaId: number) {
    try {
      loading.value = true
      caixaAtivo.value = await CaixaRepository.entrarCaixa({ caixaId })
      openModalSelecionarCaixa.value = false
      toast.success('Caixa selecionado')
      await loadContexto()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao entrar no caixa')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function registrarMovimento(payload: MovimentarCaixaPayload) {
    try {
      loading.value = true
      caixaAtivo.value = await CaixaRepository.movimentarCaixa(payload)
      openModalMovimento.value = false
      toast.success('Movimentacao registrada')
      await loadContexto()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao movimentar caixa')
      throw error
    } finally {
      loading.value = false
    }
  }

  async function fecharCaixa(payload: FecharCaixaPayload) {
    try {
      loading.value = true
      caixaAtivo.value = await CaixaRepository.fecharCaixa(payload)
      openModalFechamento.value = false
      toast.success('Caixa fechado com sucesso')
      await loadContexto()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao fechar caixa')
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    caixaAtivo,
    caixasAbertos,
    pdvs,
    openModalSelecionarCaixa,
    openModalMovimento,
    openModalFechamento,
    loadContexto,
    abrirCaixa,
    entrarCaixa,
    registrarMovimento,
    fecharCaixa,
  }
})

