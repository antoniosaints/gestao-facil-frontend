import { afterEach, describe, expect, it } from 'vitest'
import { useConfirm } from './useConfirm'

afterEach(() => useConfirm().onNo())

describe('Confirmações', () => {
  it('resolve como cancelamento ao fechar por overlay, Escape ou drawer', async () => {
    const dialog = useConfirm()
    const result = dialog.confirm({ title: 'Descartar?' })
    dialog.isOpen.value = false
    await expect(result).resolves.toBe(false)
  })

  it('preserva a confirmação afirmativa', async () => {
    const dialog = useConfirm()
    const result = dialog.confirm()
    dialog.onYes()
    await expect(result).resolves.toBe(true)
  })

  it('cancela uma solicitação anterior sem deixá-la pendente', async () => {
    const dialog = useConfirm()
    const previous = dialog.confirm()
    const current = dialog.confirm()
    await expect(previous).resolves.toBe(false)
    dialog.onYes()
    await expect(current).resolves.toBe(true)
  })
})
