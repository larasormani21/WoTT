import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EditorStatusBar from '../src/components/EditorStatusBar.vue'

describe('EditorStatusBar', () => {
  it('renders char count', () => {
    const wrapper = mount(EditorStatusBar, {
      props: {
        charCount: 42
      }
    })

    expect(wrapper.text()).toContain('42')
  })
})
