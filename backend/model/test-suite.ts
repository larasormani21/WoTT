import type { TdDataSchema } from './td-types.js';
import type { ErrorObject } from "ajv";

export type InteractionType = 'property' | 'action';

export interface TestCase {
  id: string;
  name: string;
  interactionType: InteractionType;
  interactionName: string;
  httpMethod?: string;
  url?: string;
  dataSchema?: TdDataSchema;
  responseSchema?: TdDataSchema;
  requestBody?: string;
  /** Dot-path to the sub-property being tested (e.g. "brightness", "status.brightness"). Set only for tests derived from object sub-properties. */
  propertyPath?: string;
  /** Resolved security scheme type (e.g. 'nosec'). Derived from form-level security with root-level as fallback. */
  securityScheme?: string;
  expectedStatus?: number;
}

export interface TestSuite {
  thingId: string;
  testCases: TestCase[];
}

export interface ValidationResult {
    valid: boolean;
    errors?: ErrorObject[];
}

export interface TestSuiteResult {
  testSuite: TestSuite;
  validationResult: ValidationResult;
}