import type { TestSuite, TestCase, GenericTestSuite, GenericTestCase } from '../model/index.js';
import { generatePropertyTestCases } from './handlers/property-handler.js';
import { generateActionTestCases } from './handlers/action-handler.js';

// URN structure: urn:<NID>:<NSS>:<local-part> — we keep only the local-part
const URN_PREFIX_PATTERN = /^urn:[^:]+:[^:]+:/;

export function sanitizeIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^([^a-zA-Z_])/, '_$1');
}

export function createTestSuiteName(thingId: string): string {
  const localId = thingId.replace(URN_PREFIX_PATTERN, '').replace(/[^a-zA-Z0-9]/g, '_');
  return localId + 'TestSuite';
}

function mapToGenericTestCase(testCase: TestCase): GenericTestCase {
  return {
    id: testCase.id,
    functionName: sanitizeIdentifier(testCase.name),
    description: testCase.name,
    interactionType: testCase.interactionType,
    interactionName: testCase.interactionName,
    ...(testCase.httpMethod !== undefined ? { httpMethod: testCase.httpMethod } : {}),
    ...(testCase.url !== undefined ? { url: testCase.url } : {}),
    ...(testCase.requestBody !== undefined ? { requestBody: testCase.requestBody } : {}),
    ...(testCase.responseSchema !== undefined ? { responseSchema: testCase.responseSchema } : {}),
    ...(testCase.propertyPath !== undefined ? { propertyPath: testCase.propertyPath } : {}),
    ...(testCase.securityScheme !== undefined ? { securityScheme: testCase.securityScheme } : {}),
    ...(testCase.expectedStatus !== undefined ? { expectedStatus: testCase.expectedStatus } : {}),
    ...(testCase.responseSchema?.minimum !== undefined ? { expectedResponseBodyMinimum: testCase.responseSchema.minimum } : {}),
    ...(testCase.responseSchema?.maximum !== undefined ? { expectedResponseBodyMaximum: testCase.responseSchema.maximum } : {}),
    ...(testCase.responseSchema?.minLength !== undefined ? { expectedResponseBodyMinLength: testCase.responseSchema.minLength } : {}),
    ...(testCase.responseSchema?.maxLength !== undefined ? { expectedResponseBodyMaxLength: testCase.responseSchema.maxLength } : {}),
    ...(testCase.responseSchema?.minItems !== undefined ? { expectedResponseBodyMinItems: testCase.responseSchema.minItems } : {}),
    ...(testCase.responseSchema?.maxItems !== undefined ? { expectedResponseBodyMaxItems: testCase.responseSchema.maxItems } : {}),
  };
}

export function generateGenericTestSuite(testSuiteMetamodel: TestSuite): GenericTestSuite {
  const propertyCases = testSuiteMetamodel.testCases
    .filter(testCase => testCase.interactionType === 'property')
    .flatMap(testCase => generatePropertyTestCases(testCase));

  const actionCases = testSuiteMetamodel.testCases
    .filter(testCase => testCase.interactionType === 'action')
    .flatMap(testCase => generateActionTestCases(testCase));

  return {
    thingId: testSuiteMetamodel.thingId,
    suiteName: createTestSuiteName(testSuiteMetamodel.thingId),
    testCases: [...propertyCases, ...actionCases].map(mapToGenericTestCase),
  };
}
