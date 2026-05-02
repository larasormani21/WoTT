import { describe, it, expect } from 'vitest'
import { hasActionsWithMissingBindings } from '../src/utils/hasActionsWithMissingBindings'

describe('hasActionsWithMissingBindings', () => {
  it('returns false for TD without actions', () => {
    expect(hasActionsWithMissingBindings({ title: 'Test TD' })).toBe(false)
  })

  it('returns false for TD with actions but no forms', () => {
    expect(hasActionsWithMissingBindings({ actions: { toggle: {} } })).toBe(false)
  })

  it('returns false for TD with actions and forms with htv:methodName', () => {
    expect(hasActionsWithMissingBindings({
      actions: { toggle: { forms: [{ 'htv:methodName': 'POST' }] } }
    })).toBe(false)
  })

  it('returns true for TD with actions and forms without htv:methodName', () => {
    expect(hasActionsWithMissingBindings({
      actions: { toggle: { forms: [{ href: '/toggle' }] } }
    })).toBe(true)
  })

  it('returns true when at least one action has forms without htv:methodName', () => {
    expect(hasActionsWithMissingBindings({
      actions: {
        toggle: { forms: [{ 'htv:methodName': 'POST' }] },
        reset: { forms: [{ href: '/reset' }] }
      }
    })).toBe(true)
  })

  it('returns false when all actions have htv:methodName', () => {
    expect(hasActionsWithMissingBindings({
      actions: {
        toggle: { forms: [{ 'htv:methodName': 'POST' }] },
        reset: { forms: [{ 'htv:methodName': 'PUT' }] }
      }
    })).toBe(false)
  })
})
