import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import EditorView from '../src/views/EditorView.vue'

const mockPush = vi.fn()

vi.mock('@guolao/vue-monaco-editor', () => ({
  default: {
    name: 'MonacoEditor',
    props: ['value'],
    template: `<textarea class="monaco"
      :value="value"
      @input="$emit('update:value', $event.target.value)" />`
  },
  useMonaco: () => ({ monacoRef: { value: null } })
}))

vi.mock('../src/composables/useMonacoEditor', () => ({
  useMonacoEditor: () => ({
    register: vi.fn(),
    applyMarkers: vi.fn(),
    clearMarkers: vi.fn(),
  })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

vi.mock('../src/store/testSuiteStore', () => ({
  selectedLanguage: { value: 'javascript' },
  generatedCode: { value: null },
  actionsWithMissingBindings: { value: false },
}))

vi.mock('../src/api/tdApi', () => ({
  validateThingDescription: vi.fn(async () => ({ kind: 'valid' })),
  generateTestSuite: vi.fn(async () => ({ kind: 'success', code: 'test code' }))
}))

const createWrapper = () =>
  mount(EditorView, {
    global: {
      stubs: {
        EditorToolbar: {
          template: `
    <div>
      <button class="load" @click="$emit('load')" />
      <button class="validate" @click="$emit('validate')" />
      <button class="generate" @click="$emit('generate')" />
    </div>
  `
        },
        CodeEditorPanel: {
          props: ['modelValue', 'title', 'language', 'badges', 'registerEditor'],
          template: `<textarea class="monaco"
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)" />`
        }
      }
    }
  })

describe('EditorView', () => {

  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders layout container', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.px-6').exists()).toBe(true)
  })

  it('initializes with placeholder', () => {
    const wrapper = createWrapper()
    const editor = wrapper.find('.monaco')

    expect(editor.exists()).toBe(true)
    expect((editor.element as HTMLTextAreaElement).value)
      .toContain('Upload or write')

  })

  it('starts with no error message', () => {
    const wrapper = createWrapper()
    expect(wrapper.text()).not.toContain('error')
  })

  it('updates content when typing in editor', async () => {
    const wrapper = createWrapper()
    const editor = wrapper.find('.monaco')

    await editor.setValue('{"title":"test"}')

    expect((editor.element as HTMLTextAreaElement).value)
      .toBe('{"title":"test"}')

  })

  it('clears error when user edits content', async () => {
    const wrapper = createWrapper()

    await wrapper.find('.generate').trigger('click')

    const editor = wrapper.find('.monaco')
    await editor.setValue('{"title":"ok"}')

    expect(wrapper.text()).not.toContain('empty')

  })

  it('navigates on valid generate', async () => {
    const wrapper = createWrapper()

    const editor = wrapper.find('.monaco')
    await editor.setValue('{"title":"valid"}')

    await wrapper.find('.generate').trigger('click')
    await flushPromises()

    expect(mockPush).toHaveBeenCalled()

  })

  it('renders file input', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
  })

  it('file input accepts correct types', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('input[type="file"]').attributes('accept'))
      .toBe('.json,.jsonld')
  })

  it('calls validation when validate button is clicked', async () => {
    const wrapper = createWrapper()

    const { validateThingDescription } = await import('../src/api/tdApi')
    vi.mocked(validateThingDescription).mockResolvedValue({ kind: 'valid' })
    await wrapper.find('.validate').trigger('click')
    await flushPromises()

    expect(validateThingDescription).toHaveBeenCalled()
  })

  it('resets validation state on editor change', async () => {
    const wrapper = createWrapper()

    const editor = wrapper.find('.monaco')
    await editor.setValue('{"title":"new"}')

    expect(wrapper.text()).not.toContain('invalid')
  })

})
