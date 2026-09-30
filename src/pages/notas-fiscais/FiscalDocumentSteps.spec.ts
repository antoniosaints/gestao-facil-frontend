import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import FiscalDocumentSteps from './FiscalDocumentSteps.vue'
import type { FiscalDocument } from '@/repositories/notas-fiscais-repository'

enableAutoUnmount(afterEach)
const document: FiscalDocument = {
  id: 17,
  tipo: 'NFE',
  status: 'PENDENTE',
  valorTotal: 100,
  criadoEm: '2026-09-30T12:00:00Z',
}
const current = (wrapper: ReturnType<typeof mount>) => wrapper.get('[aria-current="step"]')

describe('Etapas da nota fiscal', () => {
  it('destaca a etapa atual e só conclui a autorização quando confirmada', async () => {
    const wrapper = mount(FiscalDocumentSteps, { props: { document } })
    expect(wrapper.findAll('li')).toHaveLength(4)
    expect(current(wrapper).text()).toContain('Registrada')
    expect(wrapper.findAll('[data-state="completed"]')).toHaveLength(0)

    await wrapper.setProps({ document: { ...document, status: 'EMITINDO' } })
    expect(current(wrapper).text()).toContain('Emitindo')
    expect(current(wrapper).get('svg').classes()).toContain('animate-spin')
    expect(wrapper.findAll('[data-state="completed"]')).toHaveLength(1)

    await wrapper.setProps({ document: { ...document, status: 'AUTORIZADA' } })
    expect(current(wrapper).text()).toContain('Autorizada')
    expect(wrapper.findAll('li').slice(-1)[0]?.attributes('aria-current')).toBe('step')
    expect(wrapper.findAll('[data-state="completed"]')).toHaveLength(3)
    expect(wrapper.find('.animate-spin').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Cancelada')
  })

  it('adiciona o cancelamento no final somente quando solicitado ou confirmado', async () => {
    const wrapper = mount(FiscalDocumentSteps, {
      props: { document: { ...document, status: 'AUTORIZADA' } },
    })
    expect(wrapper.findAll('li')).toHaveLength(4)
    await wrapper.setProps({
      document: {
        ...document,
        status: 'AUTORIZADA',
        eventos: [
          { id: 1, tipo: 'CANCELAMENTO', status: 'PROCESSANDO', createdAt: document.criadoEm },
        ],
      },
    })
    expect(wrapper.findAll('li')).toHaveLength(5)
    expect(wrapper.findAll('li').slice(-1)[0]?.text()).toContain('Cancelando...')
    expect(current(wrapper).get('svg').classes()).toContain('animate-spin')
    expect(wrapper.findAll('[data-state="completed"]')).toHaveLength(4)

    await wrapper.setProps({ document: { ...document, status: 'CANCELADA' } })
    expect(wrapper.findAll('li')).toHaveLength(5)
    expect(wrapper.findAll('li').slice(-1)[0]?.text()).toContain('Cancelada')
    expect(current(wrapper).attributes('data-state')).toBe('current')
    expect(wrapper.find('.animate-spin').exists()).toBe(false)
  })

  it.each(['REJEITADA', 'FALHA_REPROCESSAVEL', 'EMISSAO_INCERTA', 'RESULTADO_INCERTO'])(
    'destaca %s no final sem indicar autorização concluída',
    (status) => {
      const wrapper = mount(FiscalDocumentSteps, { props: { document: { ...document, status } } })
      const steps = wrapper.findAll('li')
      expect(steps).toHaveLength(5)
      expect(steps[steps.length - 1]?.attributes('aria-current')).toBe('step')
      const authorization = steps.find((step) => step.text().includes('Autorizada'))!
      expect(authorization.attributes('data-state')).toBe('pending')
      expect(authorization.attributes('aria-current')).toBeUndefined()
    },
  )

  it('respeita pronta para emissão, processamento e homologação sem duplicar a etapa final', async () => {
    const wrapper = mount(FiscalDocumentSteps, {
      props: { document: { ...document, tipo: 'NFSE', status: 'PRONTA_PARA_EMISSAO' } },
    })
    expect(current(wrapper).text()).toContain('Pronta para emissão')
    await wrapper.setProps({ document: { ...document, status: 'EM_PROCESSAMENTO' } })
    expect(current(wrapper).text()).toContain('Processando')
    expect(wrapper.findAll('li')).toHaveLength(4)
    await wrapper.setProps({ document: { ...document, status: 'HOMOLOGADA' } })
    expect(current(wrapper).text()).toContain('Homologada')
    expect(wrapper.findAll('li')).toHaveLength(4)
    expect(wrapper.findAll('[data-state="pending"]')).toHaveLength(0)
  })
})
