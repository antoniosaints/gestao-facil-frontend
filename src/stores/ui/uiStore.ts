import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ContaRepository } from '@/repositories/conta-repository'
import { StoreRepository } from '@/repositories/store-repository'
import { UsuarioRepository } from '@/repositories/usuario-repository'
import type { Contas, Usuarios } from '@/types/schemas'
import { hasPermission } from '@/hooks/authorize'
interface TipoPermissao {
  editar: boolean
  visualizar: boolean
  criar: boolean
  excluir: boolean
  painel: boolean
}
export interface Permissoes {
  superadmin: boolean
  admin: boolean
  produtos: TipoPermissao
  clientes: TipoPermissao
  servicos: TipoPermissao
  vendas: TipoPermissao
  financeiro: TipoPermissao
  relatorios: TipoPermissao
  configuracoes: TipoPermissao
  usuarios: TipoPermissao
}

export interface FinanceiroFlags {
  permitirLancamentoRetroativo: boolean
  permitirEfetivacaoFutura: boolean
  permitirTransferenciaContaFinanceira: boolean
  permitirCriacaoCobranca: boolean
}

export const useUiStore = defineStore('uiStore', () => {
  const openSidebar = ref(true)
  const loading = ref(false)
  const logoProfile = ref('/imgs/logo.png')
  const openModalProfile = ref(false)
  const isMobile = ref(window.innerWidth < 768)
  const usuarioLogged = ref<Usuarios>({} as Usuarios)
  const contaInfo = ref<Contas>({} as Contas)
  const financeiroFlags = ref<FinanceiroFlags>({
    permitirLancamentoRetroativo: true,
    permitirEfetivacaoFutura: true,
    permitirTransferenciaContaFinanceira: true,
    permitirCriacaoCobranca: true,
  })
  const canCreateCharge = computed(() => financeiroFlags.value.permitirCriacaoCobranca !== false)
  const appModules = ref<Record<string, boolean>>({})
  const appModulesLoaded = ref(false)
  const status = ref(localStorage.getItem('gestao_facil:status') || 'INATIVO')
  const diasParaVencer = ref<number>(
    Number(localStorage.getItem('gestao_facil:diasParaVencer')) || 0,
  )

  const setLogoProfile = (logo: string) => {
    logoProfile.value = logo
  }

  const permissoes = ref<Permissoes>({
    superadmin: false,
    admin: false,
    produtos: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
      painel: false,
    },
    clientes: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
      painel: false,
    },
    vendas: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
      painel: false,
    },
    servicos: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
      painel: false,
    },
    financeiro: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
      painel: false,
    },
    relatorios: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
      painel: false,
    },
    configuracoes: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
      painel: false,
    },
    usuarios: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
      painel: false,
    },
  })

  const populatePermissoes = () => {
    permissoes.value = {
      superadmin: usuarioLogged.value.superAdmin,
      admin: hasPermission(usuarioLogged.value, 4),
      produtos: {
        editar: hasPermission(usuarioLogged.value, 4),
        visualizar: hasPermission(usuarioLogged.value, 4),
        criar: hasPermission(usuarioLogged.value, 4),
        excluir: hasPermission(usuarioLogged.value, 4),
        painel: hasPermission(usuarioLogged.value, 4),
      },
      clientes: {
        editar: hasPermission(usuarioLogged.value, 2),
        visualizar: hasPermission(usuarioLogged.value, 1),
        criar: hasPermission(usuarioLogged.value, 2),
        excluir: hasPermission(usuarioLogged.value, 2),
        painel: hasPermission(usuarioLogged.value, 3),
      },
      vendas: {
        editar: hasPermission(usuarioLogged.value, 2),
        visualizar: hasPermission(usuarioLogged.value, 1),
        criar: hasPermission(usuarioLogged.value, 2),
        excluir: hasPermission(usuarioLogged.value, 3),
        painel: hasPermission(usuarioLogged.value, 3),
      },
      servicos: {
        editar: hasPermission(usuarioLogged.value, 2),
        visualizar: hasPermission(usuarioLogged.value, 1),
        criar: hasPermission(usuarioLogged.value, 2),
        excluir: hasPermission(usuarioLogged.value, 3),
        painel: hasPermission(usuarioLogged.value, 3),
      },
      financeiro: {
        editar: hasPermission(usuarioLogged.value, 3),
        visualizar: hasPermission(usuarioLogged.value, 3),
        criar: hasPermission(usuarioLogged.value, 3),
        excluir: hasPermission(usuarioLogged.value, 3),
        painel: hasPermission(usuarioLogged.value, 3),
      },
      relatorios: {
        editar: hasPermission(usuarioLogged.value, 3),
        visualizar: hasPermission(usuarioLogged.value, 3),
        criar: hasPermission(usuarioLogged.value, 3),
        excluir: hasPermission(usuarioLogged.value, 3),
        painel: hasPermission(usuarioLogged.value, 3),
      },
      configuracoes: {
        editar: hasPermission(usuarioLogged.value, 5),
        visualizar: hasPermission(usuarioLogged.value, 5),
        criar: hasPermission(usuarioLogged.value, 5),
        excluir: hasPermission(usuarioLogged.value, 5),
        painel: hasPermission(usuarioLogged.value, 5),
      },
      usuarios: {
        editar: hasPermission(usuarioLogged.value, 4),
        visualizar: hasPermission(usuarioLogged.value, 4),
        criar: hasPermission(usuarioLogged.value, 4),
        excluir: hasPermission(usuarioLogged.value, 4),
        painel: hasPermission(usuarioLogged.value, 4),
      },
    }
  }

  window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
      isMobile.value = true
    } else {
      isMobile.value = false
    }
  })

  async function loadAppModules(force = false) {
    if (appModulesLoaded.value && !force) {
      return appModules.value
    }

    try {
      const response = await StoreRepository.listar()
      appModules.value = response.data.reduce<Record<string, boolean>>((acc, item) => {
        acc[item.codigo] = item.ativo
        return acc
      }, {})
      appModulesLoaded.value = true
    } catch (error) {
      console.log(error)
      appModules.value = {}
      appModulesLoaded.value = false
    }

    return appModules.value
  }

  function hasActiveModule(codigo: string) {
    return Boolean(appModules.value[codigo])
  }

  async function loadFinanceiroFlags() {
    try {
      const response = await ContaRepository.getParametros()
      financeiroFlags.value = {
        permitirLancamentoRetroativo: response.data?.permitirLancamentoRetroativo ?? true,
        permitirEfetivacaoFutura: response.data?.permitirEfetivacaoFutura ?? true,
        permitirTransferenciaContaFinanceira: response.data?.permitirTransferenciaContaFinanceira ?? true,
        permitirCriacaoCobranca: response.data?.permitirCriacaoCobranca ?? true,
      }
      return financeiroFlags.value
    } catch (error) {
      console.log(error)
      financeiroFlags.value = {
        permitirLancamentoRetroativo: true,
        permitirEfetivacaoFutura: true,
        permitirTransferenciaContaFinanceira: true,
        permitirCriacaoCobranca: true,
      }
      return financeiroFlags.value
    }
  }

  async function getDataUsuario() {
    try {
      const data = await UsuarioRepository.whoami()
      const [conta] = await Promise.all([ContaRepository.info(), loadFinanceiroFlags()])
      usuarioLogged.value = data.data
      contaInfo.value = conta
      populatePermissoes()
      await loadAppModules(true)
      return data
    } catch (error) {
      console.log(error)
    }
  }

  function toggleSidebar() {
    openSidebar.value = !openSidebar.value
  }

  async function getStatus() {
    try {
      const { data } = await ContaRepository.status()
      status.value = data.status
      diasParaVencer.value = data.diasParaVencer
      localStorage.setItem('gestao_facil:status', data.status)
      localStorage.setItem('gestao_facil:diasParaVencer', String(data.diasParaVencer.toFixed(0)))

      return data
    } catch (error) {
      status.value = 'INATIVO'
      localStorage.setItem('gestao_facil:status', 'INATIVO')
      localStorage.setItem('gestao_facil:diasParaVencer', '0')
      return null
    }
  }

  return {
    loading,
    openSidebar,
    openModalProfile,
    status,
    permissoes,
    usuarioLogged,
    contaInfo,
    financeiroFlags,
    canCreateCharge,
    appModules,
    appModulesLoaded,
    getDataUsuario,
    loadFinanceiroFlags,
    diasParaVencer,
    getStatus,
    loadAppModules,
    hasActiveModule,
    toggleSidebar,
    isMobile,
    logoProfile,
    setLogoProfile,
  }
})
