import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('comandas payment item selection', () => {
  it('uses the current Checkbox modelValue contract in the billing modal', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/pages/comandas/Home.vue'), 'utf8')

    expect(source).toContain(':model-value="store.faturarForm.itemIds.includes(item.id)"')
    expect(source).toContain('@update:model-value="handlePaymentItemChecked(item.id, $event)"')
    expect(source).not.toContain('@update:checked="handlePaymentItemChecked(item.id, $event)"')
  })
})
