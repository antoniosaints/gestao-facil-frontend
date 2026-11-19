import { describe, expect, it, vi } from 'vitest'
vi.mock('@/modofacil/bootstrap', () => ({ registerModoFacilPolicy: vi.fn() }))
import router from '@/router'
import { appAccessCatalog, appAccessIssue, appActivationLocation, requiredAppCodes, safeAppReturnPath } from './appAccess'

describe('acessos que dependem de apps', () => {
  it('cobre todos os apps exigidos pelas rotas e aponta para destinos existentes', () => {
    for (const route of router.getRoutes()) {
      const modules = route.meta.modulo ? Array.isArray(route.meta.modulo) ? route.meta.modulo : [route.meta.modulo] : []
      for (const code of modules) expect(appAccessCatalog[String(code)], route.path).toBeDefined()
    }
    for (const [code, app] of Object.entries(appAccessCatalog)) {
      expect(router.resolve(app.open).name, code).not.toBe('notfound')
      if (app.configuration) expect(router.resolve(app.configuration).name, code).not.toBe('notfound')
    }
  })
  it('preserva somente destinos internos seguros para retomar o recurso', () => {
    expect(appActivationLocation('whatsapp', '/clientes/101?tab=vendas')).toEqual({ name: 'loja-home', query: { app: 'whatsapp', retorno: '/clientes/101?tab=vendas' } })
    for (const path of ['https://example.invalid', '//example.invalid', '/%2fexample.invalid', '/\\example.invalid', '/%5cexample.invalid', '/apps/acesso?apps=whatsapp', '/admin/assinantes', '/login', '/%']) expect(safeAppReturnPath(path), path).toBeUndefined()
    expect(requiredAppCodes(['whatsapp', 'whatsapp', 'constructor', 'inexistente'])).toEqual(['whatsapp'])
  })
  it('distingue falta de app, configuração pendente e falta de permissão', () => {
    expect(appAccessIssue({ error: { code: 'restaurante_module_inactive' } })).toEqual({ app: 'restaurante-delivery', kind: 'activation' })
    expect(appAccessIssue({ error: { code: 'mercado_pago_configuration_required' } })).toEqual({ app: 'mercado-pago', kind: 'configuration' })
    expect(appAccessIssue({ error: { code: 'whatsapp_notification_instance_required' } })?.configurationTo).toEqual({ name: 'configuracoes-home', query: { tab: 'whatsapp' } })
    for (const code of ['restaurante_forbidden', 'combos_forbidden', 'atendimento_menu-oculto', 'whatsapp_instance_not_found', 'unauthorized']) expect(appAccessIssue({ error: { code } })).toBeNull()
  })
})
