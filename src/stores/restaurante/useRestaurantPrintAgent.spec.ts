import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  qzConnected: false,
  socketOn: vi.fn(),
  socketOff: vi.fn(),
  connect: vi.fn(async () => {
    mocks.qzConnected = true
  }),
  getPrinters: vi.fn(async () => ['Cozinha']),
  printRaw: vi.fn(async () => undefined),
  heartbeat: vi.fn(async (_token?: string, _payload?: unknown): Promise<any> => undefined),
  buscarTrabalhos: vi.fn(async (_token?: string): Promise<any[]> => []),
  confirmarTrabalho: vi.fn(async () => undefined),
}))

vi.mock('@/pluguins/socket', () => ({
  getSocket: () => ({
    on: mocks.socketOn,
    off: mocks.socketOff,
  }),
}))

vi.mock('@/utils/qzTray', () => ({
  default: {
    isConnected: () => mocks.qzConnected,
    connect: mocks.connect,
    getPrinters: mocks.getPrinters,
    printRaw: mocks.printRaw,
  },
}))

vi.mock('@/repositories/restaurante-repository', () => ({
  RestauranteRepository: {
    heartbeatEstacao: mocks.heartbeat,
    buscarTrabalhosEstacao: mocks.buscarTrabalhos,
    confirmarTrabalhoEstacao: mocks.confirmarTrabalho,
  },
}))

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
  }),
}))

import {
  RESTAURANT_PRINT_STORAGE,
  useRestaurantPrintAgent,
} from './useRestaurantPrintAgent'

describe('useRestaurantPrintAgent', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    mocks.qzConnected = false
    vi.clearAllMocks()
    mocks.heartbeat.mockResolvedValue(undefined)
    mocks.buscarTrabalhos.mockResolvedValue([])
    vi.useFakeTimers()
  })

  it('mantem a busca de impressoes ativa fora da pagina de configuracao', async () => {
    localStorage.setItem(RESTAURANT_PRINT_STORAGE.token, 'token-estacao')
    localStorage.setItem(RESTAURANT_PRINT_STORAGE.printer, 'Cozinha')
    localStorage.setItem(RESTAURANT_PRINT_STORAGE.enabled, 'true')
    mocks.qzConnected = true
    const agent = useRestaurantPrintAgent()

    await agent.start()

    expect(agent.started).toBe(true)
    expect(agent.connectors).toHaveLength(1)
    expect(agent.connectors[0].printer).toBe('Cozinha')
    expect(mocks.socketOn).toHaveBeenCalledWith(
      'restaurante:impressao',
      expect.any(Function),
    )

    await vi.advanceTimersByTimeAsync(10_000)

    expect(mocks.heartbeat).toHaveBeenCalledWith('token-estacao', {
      impressoraNome: 'Cozinha',
      papel: '80mm',
    })
    expect(mocks.buscarTrabalhos).toHaveBeenCalledWith('token-estacao')

    agent.stop()
    const chamadasAoParar = mocks.buscarTrabalhos.mock.calls.length
    await vi.advanceTimersByTimeAsync(10_000)

    expect(mocks.buscarTrabalhos).toHaveBeenCalledTimes(chamadasAoParar)
    expect(mocks.socketOff).toHaveBeenCalledWith(
      'restaurante:impressao',
      expect.any(Function),
    )
  })

  it('controla dois conectores e impressoras diferentes no mesmo computador', async () => {
    const trabalho = {
      uid: 'trabalho-15',
      conteudo: '^XA^FO10,10^FDComanda 15^FS^XZ',
      papel: '80mm',
      vias: 1,
      leaseToken: 'lease-15',
    }
    localStorage.setItem(RESTAURANT_PRINT_STORAGE.connectors, JSON.stringify([
      {
        localId: 'local-cozinha',
        token: 'token-cozinha',
        printer: 'Impressora Cozinha',
        paper: '80mm',
        enabled: true,
      },
      {
        localId: 'local-bar',
        token: 'token-bar',
        printer: 'Impressora Bar',
        paper: '58mm',
        enabled: true,
      },
    ]))
    mocks.qzConnected = true
    mocks.heartbeat.mockImplementation(async (token?: string) => ({
      id: token === 'token-cozinha' ? 10 : 20,
      nome: token === 'token-cozinha' ? 'Cozinha' : 'Bar',
    }))
    mocks.buscarTrabalhos.mockImplementation(async (token?: string) => token === 'token-cozinha' ? [trabalho] : [])
    const agent = useRestaurantPrintAgent()

    await agent.pollJobs()

    expect(mocks.heartbeat).toHaveBeenCalledWith('token-cozinha', {
      impressoraNome: 'Impressora Cozinha',
      papel: '80mm',
    })
    expect(mocks.heartbeat).toHaveBeenCalledWith('token-bar', {
      impressoraNome: 'Impressora Bar',
      papel: '58mm',
    })
    expect(mocks.printRaw).toHaveBeenCalledWith(
      trabalho.conteudo,
      {
        printer: 'Impressora Cozinha',
        paper: '80mm',
        copies: 1,
        jobName: 'Restaurante trabalho-15',
      },
    )
    expect(mocks.confirmarTrabalho).toHaveBeenCalledWith('token-cozinha', {
      uid: 'trabalho-15',
      leaseToken: 'lease-15',
      success: true,
    })
    expect(agent.lastPrintedJobUid).toBe('trabalho-15')
    expect(agent.connectors.map((item) => item.stationId)).toEqual([10, 20])
  })
})
