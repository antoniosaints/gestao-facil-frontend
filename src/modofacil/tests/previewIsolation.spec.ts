import { describe, it, expect, vi } from 'vitest'
describe('prévia isolada', () => {
  it('não oferece transporte real mesmo quando o módulo é recriado', async () => {
    const open = vi.spyOn(XMLHttpRequest.prototype, 'open')
    for (let i = 0; i < 2; i++) {
      vi.resetModules()
      const { default: http } = await import('./previewHttp')
      await expect(http.get('/leitura-nao-simulada')).rejects.toThrow('Prévia isolada')
    }
    expect(open).not.toHaveBeenCalled()
    open.mockRestore()
  })
})
