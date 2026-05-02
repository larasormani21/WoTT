import type { ThingDescription, TestSuiteResult, ValidationResult } from '../model/index.js';
import { createTestSuiteMetamodel } from './td-parser.js';
import { validateTD } from './td-validation.js';

export function generateTestSuiteMetamodel(thingDescription: ThingDescription): TestSuiteResult {
  const validationResult = validateTD(thingDescription);
  const testSuite = createTestSuiteMetamodel(thingDescription);
  const testSuiteResult: TestSuiteResult = {
    testSuite,
    validationResult,
  };
  return testSuiteResult;
}

export function validateThingDescription(thingDescription: ThingDescription): ValidationResult {
  return validateTD(thingDescription);
}
