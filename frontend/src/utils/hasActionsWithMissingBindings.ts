export function hasActionsWithMissingBindings(
  thingDescription: { actions?: Record<string, { forms?: Array<{ [key: string]: string }> }> }
): boolean {
  const actions = thingDescription.actions
  if (!actions) return false

  return Object.values(actions).some(action => {
    if (!action.forms || action.forms.length === 0) return false
    return action.forms.some(form => !form['htv:methodName'])
  })
}
