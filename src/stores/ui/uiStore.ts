import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ContaRepository } from '@/repositories/conta-repository'
import { StoreRepository } from '@/repositories/store-repository'
import { UsuarioRepository } from '@/repositories/usuario-repository'
import type { Contas, Usuarios } from '@/types/schemas'
import { hasPermission } from '@/hooks/authorize'
import { setThemeCustomization } from '@/utils/theme'
import {
  RestauranteRepository,
  type RestauranteAccess,
  type RestauranteCapability,
} from '@/repositories/restaurante-repository'
import { OuriveRepository, type OuriveAccess, type OuriveCapability } from '@/repositories/ourive-repository'
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
  reservas: TipoPermissao
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
  vendaLancamentoAutomatico: boolean
  osLancamentoAutomatico: boolean
}

export type UiNavigationStyle = 'PADRAO' | 'CARDS' | 'SITE' | 'SIDEV2'

export const useUiStore = defineStore('uiStore', () => {
  const openSidebar = ref(true)
  // Modo operacional do KDS: o layout principal usa este estado para remover
  // navegação e ocupar toda a área disponível, sem alterar a rota atual.
  const kdsImersivo = ref(false)
  const loading = ref(false)
  const logoProfile = ref('/imgs/logo.png')
  const isMobile = ref(window.innerWidth < 768)
  const usuarioLogged = ref<Usuarios>({} as Usuarios)
  const contaInfo = ref<Contas>({} as Contas)
  const financeiroFlags = ref<FinanceiroFlags>({
    permitirLancamentoRetroativo: true,
    permitirEfetivacaoFutura: true,
    permitirTransferenciaContaFinanceira: true,
    permitirCriacaoCobranca: true,
    vendaLancamentoAutomatico: false,
    osLancamentoAutomatico: false,
  })
  const canCreateCharge = computed(() => financeiroFlags.value.permitirCriacaoCobranca !== false)
  // Com o lançamento automático ligado, o faturamento sempre gera financeiro: o
  // modal de faturar não deve mais oferecer a escolha.
  const vendaLancamentoAutomatico = computed(
    () => financeiroFlags.value.vendaLancamentoAutomatico === true,
  )
  const osLancamentoAutomatico = computed(
    () => financeiroFlags.value.osLancamentoAutomatico === true,
  )
  const appModules = ref<Record<string, boolean>>({})
  const appModulesLoaded = ref(false)
  const restaurantAccess = ref<RestauranteAccess>({
    papeis: [],
    capabilities: [],
    fallbackLegado: true,
  })
  const restaurantAccessLoaded = ref(false)
  const ouriveAccess = ref<OuriveAccess>({ papeis: [], capabilities: [], usuarioId: 0 })
  const ouriveAccessLoaded = ref(false)
  const visibleMenuKeys = ref<string[] | null>(null)
  // Submenus ocultos (keys no formato "pai:filho"). Separado de visibleMenuKeys porque
  // no payload `menusVisiveis` as keys de topo são whitelist e as de submenu são blacklist.
  const hiddenSubmenuKeys = ref<string[]>([])
  const estiloUi = ref<UiNavigationStyle>('PADRAO')
  const usaNavegacaoPorCards = computed(() => estiloUi.value === 'CARDS')
  const usaNavegacaoSite = computed(() => estiloUi.value === 'SITE')
  const usaNavegacaoSideV2 = computed(() => estiloUi.value === 'SIDEV2')
  const usaNavegacaoSemSidebar = computed(
    () => usaNavegacaoPorCards.value || usaNavegacaoSite.value,
  )
  // Tour de boas-vindas: default true evita flash do tour antes do parametros carregar.
  const tourConcluido = ref<boolean>(true)
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
    reservas: {
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
      reservas: {
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
        editar: hasPermission(usuarioLogged.value, 4),
        visualizar: hasPermission(usuarioLogged.value, 4),
        criar: hasPermission(usuarioLogged.value, 4),
        excluir: hasPermission(usuarioLogged.value, 4),
        painel: hasPermission(usuarioLogged.value, 4),
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

  async function loadRestaurantAccess(force = false) {
    if (restaurantAccessLoaded.value && !force) return restaurantAccess.value
    if (!hasActiveModule('restaurante-delivery')) {
      restaurantAccess.value = { papeis: [], capabilities: [], fallbackLegado: true }
      restaurantAccessLoaded.value = true
      return restaurantAccess.value
    }
    try {
      restaurantAccess.value = await RestauranteRepository.acesso()
      restaurantAccessLoaded.value = true
    } catch (error) {
      console.log(error)
      restaurantAccess.value = { papeis: [], capabilities: [], fallbackLegado: false }
      restaurantAccessLoaded.value = false
    }
    return restaurantAccess.value
  }

  function hasRestaurantCapability(capability: RestauranteCapability) {
    return restaurantAccess.value.capabilities.includes(capability)
  }

  async function loadOuriveAccess(force = false) {
    if (ouriveAccessLoaded.value && !force) return ouriveAccess.value
    if (!hasActiveModule('ourives')) {
      ouriveAccess.value = { papeis: [], capabilities: [], usuarioId: 0 }
      ouriveAccessLoaded.value = true
      return ouriveAccess.value
    }
    try {
      ouriveAccess.value = await OuriveRepository.acesso()
      ouriveAccessLoaded.value = true
    } catch (error) {
      console.log(error)
      ouriveAccess.value = { papeis: [], capabilities: [], usuarioId: 0 }
      ouriveAccessLoaded.value = false
    }
    return ouriveAccess.value
  }

  function hasOuriveCapability(capability: OuriveCapability) {
    return ouriveAccess.value.capabilities.includes(capability)
  }

  async function loadFinanceiroFlags() {
    try {
      const response = await ContaRepository.getParametros()
      financeiroFlags.value = {
        permitirLancamentoRetroativo: response.data?.permitirLancamentoRetroativo ?? true,
        permitirEfetivacaoFutura: response.data?.permitirEfetivacaoFutura ?? true,
        permitirTransferenciaContaFinanceira:
          response.data?.permitirTransferenciaContaFinanceira ?? true,
        permitirCriacaoCobranca: response.data?.permitirCriacaoCobranca ?? true,
        vendaLancamentoAutomatico: response.data?.vendaLancamentoAutomatico ?? false,
        osLancamentoAutomatico: response.data?.osLancamentoAutomatico ?? false,
      }
      if (Array.isArray(response.data?.menusVisiveis)) {
        const keys = response.data.menusVisiveis as string[]
        // Keys com ":" são submenus ocultos (blacklist); as demais são menus de topo visíveis.
        visibleMenuKeys.value = keys.filter((key) => !key.includes(':'))
        hiddenSubmenuKeys.value = keys.filter((key) => key.includes(':'))
      } else {
        visibleMenuKeys.value = null
        hiddenSubmenuKeys.value = []
      }
      const estiloSalvo = response.data?.estiloUi
      estiloUi.value = ['CARDS', 'SITE', 'SIDEV2'].includes(estiloSalvo)
        ? (estiloSalvo as UiNavigationStyle)
        : 'PADRAO'
      setThemeCustomization(response.data?.temaPersonalizado)
      tourConcluido.value = response.data?.tourOnboardingConcluido ?? false
      return financeiroFlags.value
    } catch (error) {
      console.log(error)
      financeiroFlags.value = {
        permitirLancamentoRetroativo: true,
        permitirEfetivacaoFutura: true,
        permitirTransferenciaContaFinanceira: true,
        permitirCriacaoCobranca: true,
        vendaLancamentoAutomatico: false,
        osLancamentoAutomatico: false,
      }
      visibleMenuKeys.value = null
      hiddenSubmenuKeys.value = []
      estiloUi.value = 'PADRAO'
      setThemeCustomization(null)
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
      await loadRestaurantAccess(true)
      await loadOuriveAccess(true)
      return data
    } catch (error) {
      console.log(error)
    }
  }

  function toggleSidebar() {
    openSidebar.value = !openSidebar.value
  }

  async function getStatus(forceRefresh = false) {
    try {
      const { data } = await ContaRepository.status(forceRefresh)
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
    kdsImersivo,
    status,
    permissoes,
    usuarioLogged,
    contaInfo,
    financeiroFlags,
    canCreateCharge,
    vendaLancamentoAutomatico,
    osLancamentoAutomatico,
    appModules,
    appModulesLoaded,
    restaurantAccess,
    restaurantAccessLoaded,
    ouriveAccess,
    ouriveAccessLoaded,
    visibleMenuKeys,
    hiddenSubmenuKeys,
    estiloUi,
    usaNavegacaoPorCards,
    usaNavegacaoSite,
    usaNavegacaoSideV2,
    usaNavegacaoSemSidebar,
    getDataUsuario,
    loadFinanceiroFlags,
    diasParaVencer,
    tourConcluido,
    getStatus,
    loadAppModules,
    loadRestaurantAccess,
    hasRestaurantCapability,
    loadOuriveAccess,
    hasOuriveCapability,
    hasActiveModule,
    toggleSidebar,
    isMobile,
    logoProfile,
    setLogoProfile,
  }
})
