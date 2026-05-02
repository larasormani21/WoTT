import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ValidationStatus from '../src/components/ValidationStatus.vue'
import type { TDValidationError } from '../src/types/thingDescription'

describe('ValidationStatus', () => {
  it('renders valid status message when state is valid', () => {
    const wrapper = mount(ValidationStatus, {
      props: {
        state: 'valid',
        errors: []
      }
    })

    expect(wrapper.text()).toContain('✔ Thing Description is valid')
    expect(wrapper.text()).not.toContain('invalid')
  })

  it('renders invalid status with error count when state is invalid', () => {
    const errors: TDValidationError[] = [
      {
        instancePath: '/properties/foo',
        keyword: 'required',
        params: { missingProperty: 'bar' }
      },
      {
        instancePath: '/properties/baz',
        keyword: 'type',
        message: 'should be a string'
      }
    ]

    const wrapper = mount(ValidationStatus, {
      props: {
        state: 'invalid',
        errors
      }
    })

    expect(wrapper.text()).toContain('✖ Thing Description is invalid (2 errors)')
  })
})
