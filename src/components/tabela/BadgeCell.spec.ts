import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import BadgeCell from './BadgeCell.vue'
import { activeThemeCustomization } from '@/utils/theme'
import { DEFAULT_THEME_CUSTOMIZATION } from '@/utils/themeCustomization'

describe('BadgeCell', () => {
  beforeEach(() => {
    activeThemeCustomization.value = { ...DEFAULT_THEME_CUSTOMIZATION }
  })

  it('aplica ou remove a largura da borda conforme a preferência de aparência', async () => {
    const wrapper = mount(BadgeCell, {
      props: { label: 'Ativo', color: 'green' },
    })

    expect(wrapper.attributes('style')).toContain('border-width: 1px')

    activeThemeCustomization.value = {
      ...DEFAULT_THEME_CUSTOMIZATION,
      bordaBadgeCell: false,
    }
    await wrapper.vm.$nextTick()

    expect(wrapper.attributes('style')).toContain('border-width: 0px')
  })
})
