import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ValidationErrors from '../src/components/ValidationErrors.vue'
import type { TDValidationError } from '../src/types/thingDescription'

describe('ValidationErrors', () => {

  it('renders a list of formatted validation errors', () => {
    const errors: TDValidationError[] = [
      {
        instancePath: '/properties/foo',
        keyword: 'type',
        message: 'must be a string'
      },
      {
        instancePath: '/properties/bar',
        keyword: 'required',
        params: { missingProperty: 'baz' }
      }
    ]

    const wrapper = mount(ValidationErrors, { props: { errors } })

    expect(wrapper.text()).toContain('Validation errors:')
    expect(wrapper.text()).toContain('Invalid type at /properties/foo')
    expect(wrapper.text()).toContain('Missing required field: baz')
  })
})
