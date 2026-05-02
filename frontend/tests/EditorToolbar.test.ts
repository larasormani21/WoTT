import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import EditorToolbar from '../src/components/EditorToolbar.vue'

describe('EditorToolbar', () => {

  const createWrapper = () =>
    mount(EditorToolbar, {
      props: {
        canGenerate: true,
        language: 'javascript'
      }
    })

  it('emits load event', async () => {
    const wrapper = createWrapper()

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('load')).toBeTruthy()
  })

  it('emits validate event', async () => {
    const wrapper = createWrapper()

    const buttons = wrapper.findAll('button')
    await buttons[1].trigger('click')

    expect(wrapper.emitted('validate')).toBeTruthy()
  })

  it('emits generate event', async () => {
    const wrapper = createWrapper()

    const buttons = wrapper.findAll('button')
    await buttons[2].trigger('click')

    expect(wrapper.emitted('generate')).toBeTruthy()
  })

  it('emits language change', async () => {
    const wrapper = createWrapper()

    const select = wrapper.find('#language-select')
    await select.setValue('javascript')

    expect(wrapper.emitted('update:language')).toBeTruthy()
  })

  it('renders language selector', () => {
    const wrapper = createWrapper()

    const select = wrapper.find('#language-select')
    expect(select.exists()).toBe(true)
  })

  it('defaults to javascript', () => {
    const wrapper = createWrapper()

    const select = wrapper.find('#language-select')
    expect((select.element as HTMLSelectElement).value).toBe('javascript')
  })

  it('has javascript option', () => {
    const wrapper = createWrapper()

    const options = wrapper.findAll('#language-select option')
    const values = options.map(o => (o.element as HTMLOptionElement).value)

    expect(values).toContain('javascript')
  })
})
