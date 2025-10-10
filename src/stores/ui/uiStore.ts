import { onMounted, ref } from 'vue'
import { defineStore } from 'pinia'
import { ContaRepository } from '@/repositories/conta-repository'
import { UsuarioRepository } from '@/repositories/usuario-repository'
interface TipoPermissao {
  editar: boolean
  visualizar: boolean
  criar: boolean
  excluir: boolean
}
interface Permissoes {
  produtos: TipoPermissao
  clientes: TipoPermissao
  vendas: TipoPermissao
  financeiro: TipoPermissao
  relatorios: TipoPermissao
  configuracoes: TipoPermissao
  usuarios: TipoPermissao
}

export const useUiStore = defineStore('uiStore', () => {
  const openSidebar = ref(true)
  const isMobile = ref(window.innerWidth < 768)
  const usuarioLogged = ref(localStorage.getItem('gestao_facil:usuariologado') || '')
  const status = ref(localStorage.getItem('gestao_facil:status') || 'INATIVO')
  const diasParaVencer = ref<number>(
    Number(localStorage.getItem('gestao_facil:diasParaVencer')) || 0,
  )

  const permissoes = ref<Permissoes>({
    produtos: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
    },
    clientes: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
    },
    vendas: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
    },
    financeiro: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
    },
    relatorios: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
    },
    configuracoes: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
    },
    usuarios: {
      editar: false,
      visualizar: false,
      criar: false,
      excluir: false,
    },
  })

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
      usuarioLogged.value = data
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
    status,
    permissoes,
    usuarioLogged,
    getDataUsuario,
    diasParaVencer,
    getStatus,
    toggleSidebar,
    isMobile,
  }
})
