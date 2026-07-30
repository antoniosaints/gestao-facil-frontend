import { beforeEach, describe, expect, it, vi } from 'vitest'

const handlers = new Map<string, () => void>()
const emit = vi.fn()
const fakeSocket = {
  connected: false,
  id: 'socket-test',
  on: vi.fn((event: string, handler: () => void) => handlers.set(event, handler)),
  emit,
}

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => fakeSocket),
}))

describe('socket account room', () => {
  beforeEach(() => {
    handlers.clear()
    emit.mockClear()
    fakeSocket.connected = false
    vi.resetModules()
  })

  it('reentra na conta ativa depois de reconectar', async () => {
    const socketModule = await import('./socket')
    socketModule.getSocket()
    socketModule.entrarNaConta(42)
    expect(emit).not.toHaveBeenCalled()

    fakeSocket.connected = true
    handlers.get('connect')?.()
    expect(emit).toHaveBeenCalledWith('entrarNaConta', 42)
  })

  it('não reentra depois de sair da conta', async () => {
    const socketModule = await import('./socket')
    socketModule.getSocket()
    fakeSocket.connected = true
    socketModule.entrarNaConta(42)
    socketModule.sairDaConta(42)
    emit.mockClear()

    handlers.get('connect')?.()
    expect(emit).not.toHaveBeenCalled()
  })
})
