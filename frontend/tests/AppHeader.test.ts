import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from '../src/components/AppHeader.vue'

describe('AppHeader', () => {
  const wrapper = mount(AppHeader)

  it('renders title', () => {
    expect(wrapper.text()).toContain('WIT')
  })

  it('renders description', () => {
    expect(wrapper.text()).toContain('WoT Intelligent Testing')
  })
})