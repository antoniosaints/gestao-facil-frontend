import { mount, flushPromises, enableAutoUnmount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import GeranetCities from './GeranetCities.vue'
import NfseConsult from './NfseConsult.vue'
import Configuracoes from './Configuracoes.vue'
import NfseAdditionalFields from './NfseAdditionalFields.vue'
import type { FiscalConfig, NfseEmission } from '@/repositories/notas-fiscais-repository'
const mocks = vi.hoisted(() => ({
  buscarCidadesGeranet: vi.fn(),
  consultarNfse: vi.fn(),
  getConfig: vi.fn(),
  saveConfig: vi.fn(),
  toast: { error: vi.fn(), success: vi.fn(), info: vi.fn() },
}))
vi.mock('@/repositories/notas-fiscais-repository', () => ({ NotasFiscaisRepository: mocks }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('vue-toastification', () => ({ useToast: () => mocks.toast }))
enableAutoUnmount(afterEach)
const city = { codigoIbge: '1702109', nome: 'Araguaína', uf: 'TO', provedor: 'PadraoNacional' }
const button = (wrapper: ReturnType<typeof mount>, label: string) =>
  wrapper.findAll('button').find((item) => item.text().includes(label))!
beforeEach(() => {
  vi.clearAllMocks()
  mocks.buscarCidadesGeranet.mockResolvedValue([city])
})

describe('Geranet NFS-e', () => {
  it('consulta cobertura e permite escolher o município, sem fallback à lista IBGE', async () => {
    const wrapper = mount(GeranetCities, { props: { selectable: true } })
    await wrapper.get('input').setValue('Araguaína')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.buscarCidadesGeranet).toHaveBeenCalledWith('Araguaína')
    expect(wrapper.text()).toContain('PadraoNacional')
    await button(wrapper, 'Usar município').trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual([city])
    mocks.buscarCidadesGeranet.mockRejectedValueOnce(new Error('falha'))
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Usar município')
  })
  it('consulta recebidas e usa o NSU sugerido ao avançar, preservando emissões locais', async () => {
    mocks.consultarNfse.mockResolvedValue({
      ultimoNsu: '2',
      maximoNsu: '10',
      proximoNsuSugerido: '2',
      temMais: true,
      registros: [
        {
          nsu: '2',
          numeroNota: '42',
          descricaoSituacao: 'Autorizada',
          dadosNota: { prestador: { razaoSocial: 'Prestador recebido' } },
        },
      ],
    })
    const wrapper = mount(NfseConsult)
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(mocks.consultarNfse).toHaveBeenCalledWith({ ultimoNsu: '0' })
    expect(wrapper.text()).toContain('Prestador recebido')
    await button(wrapper, 'Próximas notas').trigger('click')
    await flushPromises()
    expect(mocks.consultarNfse).toHaveBeenLastCalledWith({ ultimoNsu: '2' })
    expect(button(wrapper, 'Próximas notas')).toBeUndefined()
    expect(wrapper.emitted('changed')).toBeUndefined()
  })
  it('não envia chave nacional inválida', async () => {
    const wrapper = mount(NfseConsult)
    await wrapper.get('#nfse-query-key').setValue('123')
    await wrapper.get('form').trigger('submit')
    expect(mocks.consultarNfse).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('50 dígitos')
  })
  it('mostra Simples independente do ISS e permite omitir a porcentagem', async () => {
    const form: Partial<NfseEmission> = { percentualTributosSimplesNacional: null }
    const wrapper = mount(NfseAdditionalFields, {
      props: { form, config: { regimeTributario: 1, nfse: { issRetido: '2' } } as FiscalConfig },
    })
    await wrapper.get('#nfse-total-simples').setValue('6.5')
    expect(form.percentualTributosSimplesNacional).toBe(6.5)
    await wrapper.get('#nfse-total-simples').setValue('')
    expect(form.percentualTributosSimplesNacional).toBeNull()
    expect(wrapper.text()).toContain('diferente da alíquota de ISS')
  })
  it('remove a escolha D2TI da configuração e salva Geranet sem apagar os dados antigos', async () => {
    const config = {
      documento: '',
      modoEmissaoNfse: 'LEGADO_D2TI',
      provedorNfse: 'D2TI_CTA_SAO_MATEUS_MA',
      codigoMunicipioIbge: '2111300',
      codigoMunicipioPrestador: 'TOM-antigo',
      codigoServicoPadrao: '0101',
      descricaoServicoPadrao: 'Descrição antiga',
      codigoAtividadePadrao: '123',
      certificado: { configurado: true, atualizadoEm: null },
      criptografiaFiscalDisponivel: true,
      nfse: {},
      nfce: {},
      nfe: {},
      responsavelTecnico: {},
      integracao: { tipo: 'TOKEN_D2TI' },
    } as unknown as FiscalConfig
    mocks.getConfig.mockResolvedValue(config)
    mocks.saveConfig.mockResolvedValue({ ...config, modoEmissaoNfse: 'GERANET' })
    const wrapper = mount(Configuracoes, { global: { stubs: { FiscalSetupGuide: true } } })
    await flushPromises()
    expect(wrapper.text()).not.toMatch(/D2TI|Rota de emissão|Token D2TI/)
    await wrapper
      .findAll('[role="tab"]')
      .find((item) => item.text() === 'NFS-e')!
      .trigger('mousedown', { button: 0 })
    await flushPromises()
    expect(wrapper.text()).not.toMatch(/Descrição da atividade|Código TOM|Tipo de recolhimento/)
    wrapper.findComponent(GeranetCities).vm.$emit('select', city)
    await button(wrapper, 'Salvar').trigger('click')
    await flushPromises()
    expect(mocks.saveConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        modoEmissaoNfse: 'GERANET',
        provedorNfse: 'GERANET_NFSE',
        codigoMunicipioIbge: '1702109',
        municipioNome: 'Araguaína',
        uf: 'TO',
        descricaoServicoPadrao: 'Descrição antiga',
        codigoAtividadePadrao: '123',
      }),
    )
  })
})
