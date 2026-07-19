import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { InformativoRepository } from '@/repositories/informativo-repository'
import { useInformativosStore } from './useInformativos'

vi.mock('@/repositories/informativo-repository', () => ({
  InformativoRepository: {
    ativos: vi.fn(),
    marcarLido: vi.fn(),
    dispensar: vi.fn(),
  },
}))

const item = {
  id: 1,
  titulo: 'Instabilidade',
  mensagem: 'Estamos investigando.',
  integracao: 'WhatsApp',
  severidade: 'ATENCAO' as const,
  situacao: 'INVESTIGANDO' as const,
  status: 'PUBLICADO' as const,
  escopo: 'MODULO' as const,
  createdAt: '2026-07-18T18:00:00.000Z',
  updatedAt: '2026-07-18T18:00:00.000Z',
  lido: false,
  dispensado: false,
}

describe('useInformativosStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('loads active notices and exposes the unread counter', async () => {
    vi.mocked(InformativoRepository.ativos).mockResolvedValue([{ ...item }])
    const store = useInformativosStore()
    await store.carregar()
    expect(store.naoLidos).toBe(1)
    expect(store.visiveis).toHaveLength(1)
  })

  it('marks notices as read and keeps dismissed items available in history', async () => {
    vi.mocked(InformativoRepository.ativos).mockResolvedValue([{ ...item }])
    vi.mocked(InformativoRepository.marcarLido).mockResolvedValue(undefined)
    vi.mocked(InformativoRepository.dispensar).mockResolvedValue(undefined)
    const store = useInformativosStore()
    await store.carregar()
    await store.marcarTodosComoLidos()
    await store.dispensar(store.items[0])
    expect(store.naoLidos).toBe(0)
    expect(store.visiveis).toHaveLength(0)
    expect(store.dispensados).toHaveLength(1)
  })
})
