/**
 * Sessão de suporte do CEO dentro da conta de um assinante.
 *
 * Dono exclusivo das chaves `gestao_facil:support:*`. Ninguém mais deve mexer
 * nelas: a troca de sessão precisa ser atômica o suficiente para o app nunca
 * ficar com o token de uma conta e o contexto de outra.
 */

const TOKEN_KEY = 'gestao_facil:token'
const REFRESH_KEY = 'gestao_facil:refreshToken'
const USER_KEY = 'gestao_facil:usuario'
const CEO_MODE_KEY = 'gestao_facil:ceo_mode'

const SUPPORT_ACTIVE = 'gestao_facil:support:active'
const SUPPORT_INFO = 'gestao_facil:support:info'
const BACKUP_TOKEN = 'gestao_facil:support:ceo_token'
const BACKUP_REFRESH = 'gestao_facil:support:ceo_refresh'
const BACKUP_USER = 'gestao_facil:support:ceo_user'

export type SupportInfo = {
  sessaoId: number
  expiraEm: string
  conta: { id: number; nome: string }
  usuarioAlvo: { id: number; nome: string; email: string }
}

export function isSupportActive(): boolean {
  return localStorage.getItem(SUPPORT_ACTIVE) === '1'
}

export function getSupportInfo(): SupportInfo | null {
  const raw = localStorage.getItem(SUPPORT_INFO)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SupportInfo
  } catch {
    return null
  }
}

/**
 * Troca a sessão do CEO pela sessão de suporte, guardando a do CEO para o retorno.
 */
export function enterSupport(token: string, info: SupportInfo) {
  localStorage.setItem(BACKUP_TOKEN, localStorage.getItem(TOKEN_KEY) || '')
  localStorage.setItem(BACKUP_REFRESH, localStorage.getItem(REFRESH_KEY) || '')
  localStorage.setItem(BACKUP_USER, localStorage.getItem(USER_KEY) || '')

  // Crítico: o refreshToken do CEO não pode sobrar aqui. Se sobrar, o primeiro 401
  // dispara auth.refresh() e grava um token DA CONTA DO CEO enquanto o banner e a
  // store continuam achando que estamos na conta do assinante — escrita na conta
  // errada, em silêncio. A sessão de suporte é deliberadamente sem refresh.
  localStorage.removeItem(REFRESH_KEY)
  // O guard de rota chutaria o CEO de volta para /admin durante o suporte.
  localStorage.removeItem(CEO_MODE_KEY)

  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, info.usuarioAlvo.nome)
  localStorage.setItem(SUPPORT_INFO, JSON.stringify(info))
  localStorage.setItem(SUPPORT_ACTIVE, '1')
}

/**
 * Restaura a sessão do CEO. Seguro de chamar mesmo sem suporte ativo.
 */
export function exitSupport() {
  if (!isSupportActive()) return

  const token = localStorage.getItem(BACKUP_TOKEN) || ''
  const refresh = localStorage.getItem(BACKUP_REFRESH) || ''
  const user = localStorage.getItem(BACKUP_USER) || ''

  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)

  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
  else localStorage.removeItem(REFRESH_KEY)

  if (user) localStorage.setItem(USER_KEY, user)
  else localStorage.removeItem(USER_KEY)

  localStorage.setItem(CEO_MODE_KEY, '1')
  clearSupport()
}

/**
 * Descarta as chaves de suporte sem restaurar nada. Usado no logout: sem isso o
 * próximo login herdaria um "Sair do suporte" apontando para uma sessão morta.
 */
export function clearSupport() {
  localStorage.removeItem(SUPPORT_ACTIVE)
  localStorage.removeItem(SUPPORT_INFO)
  localStorage.removeItem(BACKUP_TOKEN)
  localStorage.removeItem(BACKUP_REFRESH)
  localStorage.removeItem(BACKUP_USER)
}
