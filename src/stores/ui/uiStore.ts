import { onMounted, ref } from 'vue'
import { defineStore } from 'pinia'
import { ContaRepository } from '@/repositories/conta-repository'
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

export const useUiStore = defineStore('uiStore', () => {
  const openSidebar = ref(true)
  const openModalProfile = ref(false)
  const isMobile = ref(window.innerWidth < 768)
  const usuarioLogged = ref<Usuarios>({} as Usuarios)
  const contaInfo = ref<Contas>({} as Contas)
  const status = ref(localStorage.getItem('gestao_facil:status') || 'INATIVO')
  const diasParaVencer = ref<number>(
    Number(localStorage.getItem('gestao_facil:diasParaVencer')) || 0,
  )

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

  async function getDataUsuario() {
    try {
      const data = await UsuarioRepository.whoami()
      const conta = await ContaRepository.info()
      usuarioLogged.value = data.data
      contaInfo.value = conta
      populatePermissoes()
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
    openSidebar,
    openModalProfile,
    status,
    permissoes,
    usuarioLogged,
    contaInfo,
    getDataUsuario,
    diasParaVencer,
    getStatus,
    toggleSidebar,
    isMobile,
  }
})
