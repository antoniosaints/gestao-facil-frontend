import type { RouteLocationRaw } from 'vue-router'

export function isAppAvailable(code: string): boolean {
  return code !== 'notas-fiscais' || import.meta.env.VITE_NOTAS_FISCAIS_ENABLED === 'true'
}

export const appAccessCatalog: Record<string, { name: string; setup?: string; configuration?: RouteLocationRaw; open: RouteLocationRaw; permission?: number }> = {
  'core-ia': { name: 'CORE IA', open: { name: 'ia' } },
  whatsapp: { name: 'WhatsApp', setup: 'Cadastre ou conecte uma instância para enviar mensagens.', configuration: { name: 'whatsapp' }, open: { name: 'whatsapp' }, permission: 5 },
  atendimento: { name: 'Atendimento', setup: 'Conecte uma instância WhatsApp para iniciar as conversas.', configuration: { name: 'whatsapp' }, open: { name: 'atendimento' }, permission: 5 },
  'loja-virtual': { name: 'Loja Virtual', setup: 'Configure a vitrine, os dados da loja e as opções de venda.', configuration: { name: 'loja-virtual' }, open: { name: 'loja-virtual' }, permission: 2 },
  combos: { name: 'Combos', open: { name: 'produtos-combos' } },
  assinaturas: { name: 'Contratos', open: { name: 'assinaturas-home' } },
  servicos: { name: 'Serviços', open: { name: 'servicos-listagem' } },
  ourives: { name: 'Ourive', setup: 'Revise as preferências e a equipe do Ourive.', configuration: { name: 'ourive-configuracoes' }, open: { name: 'ourive-painel' } },
  arena: { name: 'Arena', setup: 'Cadastre as quadras e os horários disponíveis.', configuration: { name: 'arena-quadras' }, open: { name: 'arena-reservas' }, permission: 3 },
  reservas: { name: 'Reservas', setup: 'Configure os serviços, os recursos e a agenda pública.', configuration: { name: 'reservas-configuracoes' }, open: { name: 'reservas-calendario' }, permission: 4 },
  'restaurante-delivery': { name: 'Restaurante e Delivery', setup: 'Configure a operação, o cardápio e as formas de entrega.', configuration: { name: 'restaurante-configuracoes' }, open: { name: 'restaurante-pedidos' }, permission: 4 },
  'notas-fiscais': { name: 'Notas Fiscais', setup: 'Configure a empresa, o ambiente e o certificado exigido para a emissão.', configuration: { name: 'notas-fiscais-configuracoes' }, open: { name: 'notas-fiscais-painel' }, permission: 4 },
  'mercado-pago': { name: 'Mercado Pago', setup: 'Conecte sua conta do Mercado Pago antes de gerar cobranças.', configuration: { name: 'loja-home', query: { app: 'mercado-pago' } }, open: { name: 'loja-home', query: { app: 'mercado-pago' } }, permission: 4 },
  abacatepay: { name: 'AbacatePay', setup: 'Configure as credenciais da sua conta antes de gerar cobranças.', configuration: { name: 'loja-home', query: { app: 'abacatepay' } }, open: { name: 'loja-home', query: { app: 'abacatepay' } }, permission: 4 },
}

export function requiredAppCodes(value: unknown): string[] {
  const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
  const available = values.filter((code): code is string =>
    typeof code === 'string' &&
    isAppAvailable(code) &&
    Object.prototype.hasOwnProperty.call(appAccessCatalog, code),
  )
  return [...new Set(available)]
}

/** Destino interno de retomada. Nunca permite URL externa nem o próprio fluxo de acesso. */
export function safeAppReturnPath(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return
  let decoded: string
  try { decoded = decodeURIComponent(value) } catch { return }
  if (decoded.startsWith('//') || /[\\\u0000-\u0020]/.test(decoded) || /^\/(?:apps\/acesso|login|admin)(?:[/?#]|$)/.test(decoded)) return
  return value
}

export function appActivationLocation(code: string, returnTo?: unknown): RouteLocationRaw {
  return { name: 'loja-home', query: { app: code, ...(safeAppReturnPath(returnTo) ? { retorno: safeAppReturnPath(returnTo) } : {}) } }
}

export function appConfigurationLocation(location: RouteLocationRaw, returnTo?: unknown): RouteLocationRaw {
  const path = safeAppReturnPath(returnTo)
  return typeof location === 'string' || !path ? location : { ...location, query: { ...location.query, retorno: path } }
}

export function gatewayAppCode(gateway: string) {
  return gateway === 'mercadopago' ? 'mercado-pago' : gateway === 'abacatepay' ? 'abacatepay' : undefined
}

const inactiveErrors: Record<string, string> = {
  whatsapp_module_inactive: 'whatsapp', 'atendimento_app-inativo': 'atendimento',
  core_ia_module_inactive: 'core-ia', combos_module_inactive: 'combos',
  reservas_module_inactive: 'reservas', restaurante_module_inactive: 'restaurante-delivery',
  notas_fiscais_module_inactive: 'notas-fiscais', ourive_module_inactive: 'ourives',
  assinaturas_module_inactive: 'assinaturas', arena_module_inactive: 'arena',
  loja_virtual_module_inactive: 'loja-virtual', commerce_module_inactive: 'loja-virtual',
  mercado_pago_module_inactive: 'mercado-pago', abacatepay_module_inactive: 'abacatepay',
}
const configurationErrors: Record<string, string> = {
  whatsapp_instance_required: 'whatsapp', whatsapp_instance_disconnected: 'whatsapp',
  mercado_pago_configuration_required: 'mercado-pago', abacatepay_configuration_required: 'abacatepay',
  fiscal_homologation_required: 'notas-fiscais',
  fiscal_config_incomplete: 'notas-fiscais', fiscal_document_disabled: 'notas-fiscais',
}

export function appAccessIssue(data: unknown): { app: string; kind: 'activation' | 'configuration'; configurationTo?: RouteLocationRaw } | null {
  const code = (data as { error?: { code?: string } } | null)?.error?.code
  if (!code) return null
  if (code === 'whatsapp_notification_instance_required') return { app: 'whatsapp', kind: 'configuration', configurationTo: { name: 'configuracoes-home', query: { tab: 'whatsapp' } } }
  if (Object.prototype.hasOwnProperty.call(inactiveErrors, code) && isAppAvailable(inactiveErrors[code])) {
    return { app: inactiveErrors[code], kind: 'activation' }
  }
  if (Object.prototype.hasOwnProperty.call(configurationErrors, code) && isAppAvailable(configurationErrors[code])) {
    return { app: configurationErrors[code], kind: 'configuration' }
  }
  return null
}
