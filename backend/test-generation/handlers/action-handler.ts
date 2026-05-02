import type { TestCase, TdDataSchema } from '../../model/index.js';
import {
  generateBoundaryVariants, generateVariantValue, 
  deriveValueFromBoundaryVariant , type BoundaryVariant
} from './boundary-value-generator.js';
import { enumerateLeafSubProperties } from '../../td-processing/td-parser.js';
import { generateValidSampleValue, generateInvalidSampleValue, type JsonValue } from './datatype-values-generator.js';

function isInvokeActionWithSchema(testCase: TestCase): boolean {
  return (
    testCase.dataSchema !== undefined &&
    testCase.httpMethod !== undefined
  );
}

function buildSampleObjectBody(schema: TdDataSchema): Record<string, unknown> {
  if (schema.type !== 'object' || schema.properties === undefined) return {};
  const result: Record<string, unknown> = {};
  for (const [name, childSchema] of Object.entries(schema.properties)) {
    result[name] = (childSchema.type === 'object' && childSchema.properties !== undefined)
      ? buildSampleObjectBody(childSchema)
      : generateValidSampleValue(childSchema);
  }
  return result;
}

function setByPath(target: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  const parts = path.split('.');
  const result: Record<string, unknown> = { ...target };
  let cursor = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]!;
    const next = { ...((cursor[key] as Record<string, unknown> | undefined) ?? {}) };
    cursor[key] = next;
    cursor = next;
  }
  cursor[parts[parts.length - 1]!] = value;
  return result;
}

function buildHttpRequestFromValue(
  testCase: TestCase,
  value: unknown
): { url: string; requestBody?: string } {
  if (testCase.httpMethod === 'GET') {
    const query = buildQueryParameter(value as JsonValue);
    return {
      url: appendQuery(testCase.url!, query),
    };
  }

  return {
    url: testCase.url!,
    requestBody: JSON.stringify(value),
  };
}

export function buildQueryParameter(obj: JsonValue, prefix = ''): string {
  const params = new URLSearchParams();

  if (typeof obj === 'object' && obj !== null) {
    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        const key = prefix ? `${prefix}[${index}]` : `value[${index}]`;
        if (typeof item === 'object' && item !== null) {
          params.append(key, JSON.stringify(item));
        } else {
          params.append(key, String(item));
        }
      });
    } else {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((item, idx) => {
              const arrKey = `${fullKey}[${idx}]`;
              params.append(arrKey, typeof item === 'object' ? JSON.stringify(item) : String(item));
            });
          } else {
            const subParams = buildQueryParameter(value, fullKey);
            for (const [k, v] of new URLSearchParams(subParams)) {
              params.append(k, v);
            }
          }
        } else {
          params.append(fullKey, String(value));
        }
      }
    }
  } else {
    const key = prefix || 'value';
    params.append(key, String(obj));
  }

  return params.toString();
}

export function appendQuery(url: string, query: string): string {
  return url.includes('?') ? `${url}&${query}` : `${url}?${query}`;
}

export function generateActionTestCases(testCase: TestCase): TestCase[] {
  if (testCase.url === undefined) return [];
  if (!isInvokeActionWithSchema(testCase)) return [testCase];

  const schema = testCase.dataSchema!;
  const baseTestCase = { ...testCase };

  const createTestCase = (
    overrides: Partial<TestCase> & {
      value?: unknown;
      expectStatus: number;
      suffix: string;
      path?: string;
    }
  ): TestCase => {
    const { value, expectStatus, suffix, path } = overrides;

    const { url, requestBody } = buildHttpRequestFromValue(baseTestCase, value);

    const idSuffix = path ? `${path}-${suffix}` : suffix;
    const nameSuffix = path
      ? `${path.replace(/\./g, '_')}_${suffix}`
      : suffix;

    return {
      ...baseTestCase,
      id: `${testCase.id}-${idSuffix}`,
      name: `${testCase.name}_${nameSuffix}`,
      url,
      ...(requestBody && { requestBody }),
      expectedStatus: expectStatus,
    };
  };

  const mapBoundaryVariantsToTestCases = (
    variants: BoundaryVariant[],
    mapper: (variant: BoundaryVariant) => TestCase
  ) => variants.map(mapper);

  if (schema.type === 'object' && schema.properties) {
    const leaves = enumerateLeafSubProperties(schema);

    return leaves.flatMap(({ path, schema: leafSchema }) => {
      const baseObject = buildSampleObjectBody(schema);
      const boundaryVariants = generateBoundaryVariants(leafSchema);

      let variants: TestCase[];

      if (boundaryVariants.length > 0) {
        variants = mapBoundaryVariantsToTestCases(boundaryVariants, (variant) => {
          const value = setByPath(
            baseObject,
            path,
            generateVariantValue(leafSchema, variant.value)
          );

          return createTestCase({
            value,
            expectStatus: variant.expectSuccess ? 200 : 400,
            suffix: variant.nameSuffix,
            path,
          });
        });
      } else {
        const value = setByPath(
          baseObject,
          path,
          generateValidSampleValue(leafSchema)
        );

        variants = [
          createTestCase({
            value,
            expectStatus: 200,
            suffix: 'valid',
            path,
          }),
        ];
      }

      const invalidValue = setByPath(
        baseObject,
        path,
        generateInvalidSampleValue(leafSchema)
      );

      return [
        ...variants,
        createTestCase({
          value: invalidValue,
          expectStatus: 400,
          suffix: 'invalidType',
          path,
        }),
      ];
    });
  }

  const boundaryVariants = generateBoundaryVariants(schema);

  let variants: TestCase[];

  if (boundaryVariants.length > 0) {
    variants = mapBoundaryVariantsToTestCases(boundaryVariants, (variant) =>
      createTestCase({
        value: deriveValueFromBoundaryVariant(schema, variant),
        expectStatus: variant.expectSuccess ? 200 : 400,
        suffix: variant.nameSuffix,
      })
    );
  } else {
    variants = [
      createTestCase({
        value: generateValidSampleValue(schema),
        expectStatus: 200,
        suffix: 'valid',
      }),
    ];
  }

  const invalidValue = generateInvalidSampleValue(schema);

  return [
    ...variants,
    createTestCase({
      value: invalidValue,
      expectStatus: 400,
      suffix: 'invalidType',
    }),
  ];
}