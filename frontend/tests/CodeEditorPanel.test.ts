import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CodeEditorPanel from '../src/components/CodeEditorPanel.vue'
import type { editor } from 'monaco-editor'

const mockRegister = vi.fn()

vi.mock('@guolao/vue-monaco-editor', () => ({
  default: {
    name: 'MonacoEditor',
    props: ['value', 'language'],
    template: `<div class="monaco" @click="$emit('update:value', 'edited content')" />`
  },
  useMonaco: () => ({ monacoRef: { value: null } })
}))

vi.mock('../src/composables/useMonacoEditor', () => ({
  useMonacoEditor: () => ({ register: mockRegister })
}))

describe('CodeEditorPanel', () => {

  const mountComponent = (props = {
    modelValue: '{}',
    title: 'Test Editor',
    language: 'json',
    badges: ['JSON'],
  }) => mount(CodeEditorPanel, { props })

  it('renders container', () => {
    const wrapper = mountComponent()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders the title', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('Test Editor')
  })

  it('renders each badge', () => {
    const wrapper = mount(CodeEditorPanel, {
      props: { modelValue: '', title: 'Editor', language: 'json', badges: ['JSON', 'JSON-LD'] }
    })
    expect(wrapper.text()).toContain('JSON')
    expect(wrapper.text()).toContain('JSON-LD')
  })

  it('renders a dynamic language badge', () => {
    const wrapper = mount(CodeEditorPanel, {
      props: { modelValue: '', title: 'Editor', language: 'javascript', badges: ['javascript'] }
    })
    expect(wrapper.text()).toContain('javascript')
  })

  it('passes modelValue to Monaco editor', () => {
    const wrapper = mount(CodeEditorPanel, {
      props: { modelValue: '{"a":1}', title: 'Editor', language: 'json', badges: [] }
    })
    const monaco = wrapper.findComponent({ name: 'MonacoEditor' })
    expect(monaco.props('value')).toBe('{"a":1}')
  })

  it('passes language to Monaco editor', () => {
    const wrapper = mount(CodeEditorPanel, {
      props: { modelValue: '', title: 'Editor', language: 'java', badges: [] }
    })
    const monaco = wrapper.findComponent({ name: 'MonacoEditor' })
    expect(monaco.props('language')).toBe('java')
  })

  it('emits update:modelValue when editor content changes', async () => {
    const wrapper = mountComponent()
    const monaco = wrapper.findComponent({ name: 'MonacoEditor' })
    await monaco.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['edited content'])
  })

  it('calls register when registerEditor is true and editor mounts', async () => {
    const wrapper = mount(CodeEditorPanel, {
      props: { modelValue: '', title: 'Editor', language: 'json', badges: [], registerEditor: true }
    })
    const fakeEditor = {} as unknown as editor.IStandaloneCodeEditor
    const monaco = wrapper.findComponent({ name: 'MonacoEditor' })
    await monaco.vm.$emit('mount', fakeEditor)
    expect(mockRegister).toHaveBeenCalledWith(fakeEditor, null)
  })

  it('does not call register when registerEditor is false', async () => {
    mockRegister.mockClear()
    const wrapper = mountComponent()
    const fakeEditor = {} as unknown as editor.IStandaloneCodeEditor
    const monaco = wrapper.findComponent({ name: 'MonacoEditor' })
    await monaco.vm.$emit('mount', fakeEditor)
    expect(mockRegister).not.toHaveBeenCalled()
  })
})
