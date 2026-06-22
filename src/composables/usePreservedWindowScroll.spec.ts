import { describe, expect, it, vi } from 'vitest'

import { runWithPreservedWindowScroll } from './usePreservedWindowScroll'

describe('runWithPreservedWindowScroll', () => {
  it('restores the window scroll after an async reload finishes', async () => {
    Object.defineProperty(window, 'scrollX', { configurable: true, value: 24 })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 640 })
    const scrollTo = vi.fn()
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo)

    await runWithPreservedWindowScroll(async () => {
      Object.defineProperty(window, 'scrollX', { configurable: true, value: 0 })
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    })

    expect(scrollTo).toHaveBeenCalledWith({ left: 24, top: 640, behavior: 'auto' })
  })

  it('restores the window scroll even when the reload fails', async () => {
    Object.defineProperty(window, 'scrollX', { configurable: true, value: 12 })
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 320 })
    const scrollTo = vi.fn()
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo)

    await expect(
      runWithPreservedWindowScroll(async () => {
        throw new Error('reload failed')
      }),
    ).rejects.toThrow('reload failed')

    expect(scrollTo).toHaveBeenCalledWith({ left: 12, top: 320, behavior: 'auto' })
  })
})
