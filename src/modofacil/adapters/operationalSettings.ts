import http from '@/utils/axios'
import { readCompatible } from './compatibleRead'
import { markDataChanged } from '../application/dataChanges'

const path = '/modofacil/configuracoes/operacionais'
const legacyPath = '/contas/parametros'
const defaults = {
  contaFinanceiraPadraoId: null,
  vendaLancamentoAutomatico: false,
  vendaCategoriaFinanceiraId: null,
  vendaContaFinanceiraId: null,
  osLancamentoAutomatico: false,
  osCategoriaFinanceiraId: null,
  osContaFinanceiraId: null,
  osOcultarAssinatura: false,
  modeloPdv: 'BASICO',
  permitirLancamentoRetroativo: true,
  permitirEfetivacaoFutura: true,
  permitirTransferenciaContaFinanceira: true,
  permitirCriacaoCobranca: true,
  eventoVendaConcluida: true,
  eventoProdutoAlterado: true,
  eventoEstoqueBaixo: true,
  eventoSangria: false,
} as const
type Key = keyof typeof defaults
function reviewedFields(input: Record<string, unknown>) {
  const result: Record<string, unknown> = {}
  for (const key of Object.keys(defaults) as Key[]) {
    if (!Object.prototype.hasOwnProperty.call(input, key)) continue
    const value = input[key]
    const valid =
      key === 'modeloPdv'
        ? ['BASICO', 'PRO'].includes(String(value))
        : key.endsWith('Id')
          ? value === null || (Number.isSafeInteger(value) && Number(value) > 0)
          : typeof value === 'boolean'
    if (!valid) throw new Error('Confira os valores das preferências antes de salvar.')
    result[key] = value
  }
  return result
}
function project(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Não foi possível carregar as preferências da conta. Tente novamente.')
  // The normal settings DTO also contains gateway credentials. Never retain them
  // in the form or send them back as part of a partial operational edit.
  const data = value as Record<string, unknown>
  return Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [key, data[key] ?? fallback]),
  )
}

// Instance belongs to the mounted settings page, never shared across sessions.
export function createOperationalSettingsApi() {
  let loadedPath: string | null = null
  return {
    async get() {
      loadedPath = null
      const result = await readCompatible(
        path,
        { params: { _mfRead: crypto.randomUUID() } },
        legacyPath,
      )
      const record = project(result.response.data.data ?? result.response.data)
      loadedPath = result.path
      return record
    },
    async save(input: Record<string, unknown>) {
      if (!loadedPath) throw new Error('Carregue as preferências antes de salvar.')
      const body = reviewedFields(input)
      if (!Object.keys(body).length) throw new Error('Altere uma preferência antes de salvar.')
      // Choose the existing normal save contract only after its GET succeeded.
      // Never retry a write on another endpoint after an ambiguous failure.
      const { data } =
        loadedPath === legacyPath ? await http.post(legacyPath, body) : await http.patch(path, body)
      markDataChanged(path)
      return project(data.data ?? data)
    },
  }
}
