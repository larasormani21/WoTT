export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
import type { TdDataSchema } from '../../model/index.js';

export function generateValidSampleValue(schema: TdDataSchema): JsonValue {
  if (schema.enum?.length) return schema.enum[0] as JsonValue;
  if (schema.const !== undefined) return schema.const as JsonValue;
  if (schema.default !== undefined) return schema.default as JsonValue;

  switch (schema.type) {
    case 'integer':
    case 'number':
      return 42;

    case 'boolean':
      return true;

    case 'string':
      return 'test';

    case 'array':
      return schema.items
        ? [generateValidSampleValue(schema.items)]
        : [];

    case 'object':
      if (schema.properties) {
        const obj: Record<string, JsonValue> = {};
        for (const [k, v] of Object.entries(schema.properties)) {
          obj[k] = generateValidSampleValue(v);
        }
        return obj;
      }
      return {};

    case 'null':
      return null;

    default:
      return null;
  }
}

export function generateInvalidSampleValue(schema: TdDataSchema): JsonValue {
  if (schema.type === 'integer' || schema.type === 'number') {
    return 'invalid';
  }
  return 42;
}