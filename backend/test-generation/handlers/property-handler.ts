import type { TestCase } from '../../model/index.js';
import {
  generateBoundaryVariants,
  deriveValueFromBoundaryVariant,
  type BoundaryVariant
} from './boundary-value-generator.js';
import {
  generateInvalidSampleValue,
  generateValidSampleValue
} from './datatype-values-generator.js';

/**
 * Wraps a value in a nested object matching the given dot-path.
 *
 * Example:
 * wrapValueByPath('a.b', 42) -> { a: { b: 42 } }
 */
function wrapValueByPath(path: string, value: unknown): unknown {
  const parts = path.split('.');
  let result: unknown = value;

  for (let i = parts.length - 1; i >= 0; i--) {
    const key = parts[i];
    if (key !== undefined) {
      result = { [key]: result };
    }
  }

  return result;
}

function isWritePropertyWithSchema(testCase: TestCase): boolean {
  return (
    testCase.dataSchema !== undefined &&
    testCase.httpMethod !== undefined &&
    testCase.httpMethod !== 'GET'
  );
}

function buildHttpRequestBody(
  value: unknown,
  propertyPath?: string
): string {
  const payload = propertyPath
    ? wrapValueByPath(propertyPath, value)
    : value;

  return JSON.stringify(payload);
}

export function generatePropertyTestCases(testCase: TestCase): TestCase[] {
  if (testCase.url === undefined) return [];
  if (!isWritePropertyWithSchema(testCase)) return [testCase];

  const schema = testCase.dataSchema!;
  const { propertyPath } = testCase;

  const baseTestCase = { ...testCase };

  const createTestCase = (
    overrides: {
      value: unknown;
      expectStatus: number;
      suffix: string;
    }
  ): TestCase => {
    const { value, expectStatus, suffix } = overrides;

    return {
      ...baseTestCase,
      id: `${testCase.id}-${suffix}`,
      name: `${testCase.name}_${suffix}`,
      requestBody: buildHttpRequestBody(value, propertyPath),
      expectedStatus: expectStatus,
    };
  };

  const mapBoundaryVariantsToTestCases = (
    variants: BoundaryVariant[],
    mapper: (variant: BoundaryVariant) => TestCase
  ) => variants.map(mapper);

  const boundaryVariants = generateBoundaryVariants(schema);

  let testCasesFromVariants: TestCase[];

  if (boundaryVariants.length > 0) {
    testCasesFromVariants = mapBoundaryVariantsToTestCases(
      boundaryVariants,
      (variant) =>
        createTestCase({
          value: deriveValueFromBoundaryVariant(schema, variant),
          expectStatus: variant.expectSuccess ? 200 : 400,
          suffix: variant.nameSuffix,
        })
    );
  } else {
    testCasesFromVariants = [
      createTestCase({
        value: generateValidSampleValue(schema),
        expectStatus: 200,
        suffix: 'valid',
      }),
    ];
  }

  const invalidValue = generateInvalidSampleValue(schema);

  return [
    ...testCasesFromVariants,
    createTestCase({
      value: invalidValue,
      expectStatus: 400,
      suffix: 'invalidType',
    }),
  ];
}