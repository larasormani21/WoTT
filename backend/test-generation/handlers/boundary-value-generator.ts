import type { TdDataSchema } from '../../model/index.js';
import { generateValidSampleValue } from './datatype-values-generator.js';

export type BoundaryKind =
  | 'minimum' | 'belowMinimum'
  | 'maximum' | 'aboveMaximum'
  | 'exclusiveMinimum' | 'aboveExclusiveMinimum'
  | 'exclusiveMaximum' | 'belowExclusiveMaximum'
  | 'validMultiple' | 'notMultiple'
  | 'minLength' | 'belowMinLength'
  | 'maxLength' | 'aboveMaxLength'
  | 'minItems' | 'belowMinItems'
  | 'maxItems' | 'aboveMaxItems';

export interface BoundaryVariant {
  kind: BoundaryKind;
  value: number;
  expectSuccess: boolean;
  nameSuffix: string;
}

export function deriveValueFromBoundaryVariant(
  schema: TdDataSchema,
  variant: BoundaryVariant
): unknown {
  if (schema.type === 'array') {
    if (variant.nameSuffix.startsWith('item_')) {
      return generateVariantValue(schema, variant.value);
    }
    return buildArrayOfLength(schema, variant.value);
  }

  if (schema.type === 'string') {
    return generateVariantValue(schema, variant.value);
  }

  return variant.value;
}

export function generateVariantValue(schema: TdDataSchema, value: number): unknown {
  if (schema.type === 'string') {
    return buildStringOfLength(value);
  }

  if (schema.type === 'array') {
    if (!schema.items) return buildArrayOfLength(schema, value);

    const arr = buildArrayOfLength(schema, schema.minItems ?? 1);

    const itemSchema = schema.items;

    arr[0] =
      itemSchema.type === 'string'
        ? buildStringOfLength(value)
        : itemSchema.type === 'array'
        ? generateVariantValue(itemSchema, value)
        : value;

    return arr;
  }

  return value;
}

export function hasNumericBounds(schema: TdDataSchema): boolean {
  return (
    (schema.type === 'number' || schema.type === 'integer') &&
    (
      schema.minimum !== undefined ||
      schema.maximum !== undefined ||
      schema.exclusiveMinimum !== undefined ||
      schema.exclusiveMaximum !== undefined ||
      schema.multipleOf !== undefined
    )
  );
}

export function hasStringLengthBounds(schema: TdDataSchema): boolean {
  return (
    schema.type === 'string' &&
    (schema.minLength !== undefined || schema.maxLength !== undefined)
  );
}

export function buildStringOfLength(length: number): string {
  return 'a'.repeat(Math.max(0, length));
}

export function buildArrayOfLength(schema: TdDataSchema, length: number): unknown[] {
  const itemSchema = schema.items;

  return Array.from({ length: Math.max(0, length) }).map(() =>
    itemSchema ? generateValidSampleValue(itemSchema) : null
  );
}

export function generateBoundaryVariants(schema: TdDataSchema): BoundaryVariant[] {
  const boundaryVariants: BoundaryVariant[] = [];

  if (schema.minimum !== undefined) {
    boundaryVariants.push({ kind: 'minimum', value: schema.minimum, expectSuccess: true, nameSuffix: 'minimumBoundary' });
    boundaryVariants.push({ kind: 'belowMinimum', value: schema.minimum - 1, expectSuccess: false, nameSuffix: 'belowMinimum' });
  }

  if (schema.maximum !== undefined) {
    boundaryVariants.push({ kind: 'maximum', value: schema.maximum, expectSuccess: true, nameSuffix: 'maximumBoundary' });
    boundaryVariants.push({ kind: 'aboveMaximum', value: schema.maximum + 1, expectSuccess: false, nameSuffix: 'aboveMaximum' });
  }

  if (schema.exclusiveMinimum !== undefined) {
    boundaryVariants.push({ kind: 'exclusiveMinimum', value: schema.exclusiveMinimum, expectSuccess: false, nameSuffix: 'atExclusiveMinimum' });
    boundaryVariants.push({ kind: 'aboveExclusiveMinimum', value: schema.exclusiveMinimum + 1, expectSuccess: true, nameSuffix: 'aboveExclusiveMinimum' });
  }

  if (schema.exclusiveMaximum !== undefined) {
    boundaryVariants.push({ kind: 'belowExclusiveMaximum', value: schema.exclusiveMaximum - 1, expectSuccess: true, nameSuffix: 'belowExclusiveMaximum' });
    boundaryVariants.push({ kind: 'exclusiveMaximum', value: schema.exclusiveMaximum, expectSuccess: false, nameSuffix: 'atExclusiveMaximum' });
  }

  if (schema.multipleOf !== undefined) {
    boundaryVariants.push({ kind: 'validMultiple', value: schema.multipleOf, expectSuccess: true, nameSuffix: 'validMultiple' });
    boundaryVariants.push({ kind: 'notMultiple', value: schema.multipleOf + 1, expectSuccess: false, nameSuffix: 'notMultiple' });
  }

  if (schema.type === 'string') {
    if (schema.minLength !== undefined) {
      boundaryVariants.push({
        kind: 'minLength',
        value: schema.minLength,
        expectSuccess: true,
        nameSuffix: 'minLengthBoundary'
      });
      boundaryVariants.push({
        kind: 'belowMinLength',
        value: schema.minLength - 1,
        expectSuccess: false,
        nameSuffix: 'belowMinLength'
      });
    }

    if (schema.maxLength !== undefined) {
      boundaryVariants.push({
        kind: 'maxLength',
        value: schema.maxLength,
        expectSuccess: true,
        nameSuffix: 'maxLengthBoundary'
      });
      boundaryVariants.push({
        kind: 'aboveMaxLength',
        value: schema.maxLength + 1,
        expectSuccess: false,
        nameSuffix: 'aboveMaxLength'
      });
    }
  }

if (schema.type === 'array') {
  if (schema.minItems !== undefined) {
    boundaryVariants.push({
      kind: 'minItems',
      value: schema.minItems,
      expectSuccess: true,
      nameSuffix: 'minItemsBoundary'
    });
    boundaryVariants.push({
      kind: 'belowMinItems',
      value: schema.minItems - 1,
      expectSuccess: false,
      nameSuffix: 'belowMinItems'
    });
  }

  if (schema.maxItems !== undefined) {
    boundaryVariants.push({
      kind: 'maxItems',
      value: schema.maxItems,
      expectSuccess: true,
      nameSuffix: 'maxItemsBoundary'
    });
    boundaryVariants.push({
      kind: 'aboveMaxItems',
      value: schema.maxItems + 1,
      expectSuccess: false,
      nameSuffix: 'aboveMaxItems'
    });
  }
}

if (schema.type === 'array' && schema.items !== undefined) {
  const itemSchema = schema.items;

  if (hasNumericBounds(itemSchema) || hasStringLengthBounds(itemSchema)) {
    const itemVariants = generateBoundaryVariants(itemSchema);

    itemVariants.forEach(v => {
      boundaryVariants.push({
        kind: v.kind,
        value: v.value,
        expectSuccess: v.expectSuccess,
        nameSuffix: `item_${v.nameSuffix}`,
      });
    });
  }
}

  return boundaryVariants;
}