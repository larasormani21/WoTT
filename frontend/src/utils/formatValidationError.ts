import type { TDValidationError } from '../types/thingDescription'

export const formatValidationError = (validationError: TDValidationError): string => {
  if (validationError.keyword === 'required') {
    return `Missing required field: ${validationError.params?.missingProperty}`
  }

  if (validationError.keyword === 'type') {
    return `Invalid type at ${validationError.instancePath || 'root'}`
  }

  if (validationError.keyword === 'testableElements') {
    return 'Thing Description must have at least one property or action to be testable.'
  }

  if (validationError.keyword === 'securityReference') {
    const reference = validationError.params?.['reference'] as string | undefined
    return reference
      ? `Security reference "${reference}" is not defined in securityDefinitions`
      : `Invalid security reference at ${validationError.instancePath || 'root'}`
  }

  return `${validationError.instancePath || 'root'}: ${validationError.message}`
}
