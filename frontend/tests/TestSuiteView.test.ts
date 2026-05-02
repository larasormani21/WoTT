import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Ref } from 'vue'

vi.mock('../src/components/CodeEditorPanel.vue', () => ({
  default: {
    name: 'CodeEditorPanel',
    props: ['modelValue', 'title', 'language', 'badges'],
    template: `<div class="monaco" />`
  }
}))

const mockDownloadTestSuite = vi.hoisted(() => vi.fn())
vi.mock('../src/utils/testSuiteDownload', () => ({
  downloadTestSuite: mockDownloadTestSuite
}))

vi.mock('../src/store/testSuiteStore', async () => {
  const { ref } = await import('vue')
  return {
    generatedCode: ref<string | null>(null),
    selectedLanguage: ref('javascript'),
    actionsWithMissingBindings: ref(false),
  }
})

import TestSuiteView from '../src/views/TestSuiteView.vue'
import * as tdStore from '../src/store/testSuiteStore'

describe('TestSuiteView', () => {

  beforeEach(() => {
    ;(tdStore.generatedCode as Ref<string | null>).value = null
    ;(tdStore.selectedLanguage as Ref<string>).value = 'javascript'
    ;(tdStore.actionsWithMissingBindings as Ref<boolean>).value = false
    mockDownloadTestSuite.mockReset()
  })

  it('renders the heading', () => {
    const wrapper = mount(TestSuiteView)
    expect(wrapper.text()).toContain('Test Suite Editor')
  })

  it('renders the Download button', () => {
    const wrapper = mount(TestSuiteView)
    expect(wrapper.find('button').text()).toContain('Download')
  })

  it('Download button is disabled when no code has been generated', () => {
    const wrapper = mount(TestSuiteView)
    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeDefined()
  })

  it('Download button is enabled when code is present', async () => {
    ;(tdStore.generatedCode as Ref<string | null>).value = 'const x = 1'
    const wrapper = mount(TestSuiteView)
    const button = wrapper.find('button')
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('calls downloadTestSuite with current code and language when Download is clicked', async () => {
    ;(tdStore.generatedCode as Ref<string | null>).value = 'const x = 1'
    ;(tdStore.selectedLanguage as Ref<string>).value = 'javascript'
    const wrapper = mount(TestSuiteView)
    await wrapper.find('button').trigger('click')
    expect(mockDownloadTestSuite).toHaveBeenCalledWith('const x = 1', 'javascript')
  })

  it('shows the missing bindings warning when relevant', () => {
    ;(tdStore.actionsWithMissingBindings as Ref<boolean>).value = true
    const wrapper = mount(TestSuiteView)
    expect(wrapper.text()).toContain('Some actions are missing an HTTP method')
  })
})
