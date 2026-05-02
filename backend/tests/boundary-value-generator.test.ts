import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  hasNumericBounds, generateBoundaryVariants, generateVariantValue,
  hasStringLengthBounds, buildArrayOfLength
} from '../test-generation/handlers/boundary-value-generator.js';

describe('hasNumericBounds', () => {
  it('returns true for number type with minimum', () => {
    assert.equal(hasNumericBounds({ type: 'number', minimum: 0 }), true);
  });

  it('returns true for number type with maximum', () => {
    assert.equal(hasNumericBounds({ type: 'number', maximum: 100 }), true);
  });

  it('returns true for number type with both minimum and maximum', () => {
    assert.equal(hasNumericBounds({ type: 'number', minimum: 0, maximum: 100 }), true);
  });

  it('returns true for integer type with minimum', () => {
    assert.equal(hasNumericBounds({ type: 'integer', minimum: 1 }), true);
  });

  it('returns true for number type with exclusiveMinimum', () => {
    assert.equal(hasNumericBounds({ type: 'number', exclusiveMinimum: 0 }), true);
  });

  it('returns true for integer type with exclusiveMaximum', () => {
    assert.equal(hasNumericBounds({ type: 'integer', exclusiveMaximum: 100 }), true);
  });

  it('returns true for number type with multipleOf', () => {
    assert.equal(hasNumericBounds({ type: 'number', multipleOf: 5 }), true);
  });

  it('returns false for string type with exclusiveMinimum', () => {
    assert.equal(hasNumericBounds({ type: 'string', exclusiveMinimum: 0 }), false);
  });

  it('returns false for number type without any bounds', () => {
    assert.equal(hasNumericBounds({ type: 'number' }), false);
  });

  it('returns false for boolean type', () => {
    assert.equal(hasNumericBounds({ type: 'boolean' }), false);
  });

  it('returns false for string type even with minimum', () => {
    assert.equal(hasNumericBounds({ type: 'string', minimum: 1 }), false);
  });

  it('returns false for schema with no type', () => {
    assert.equal(hasNumericBounds({ minimum: 0 }), false);
  });
});

describe('generateBoundaryVariants', () => {
  it('returns minimum and belowMinimum variants when only minimum is declared', () => {
    const variants = generateBoundaryVariants({ type: 'number', minimum: 10 });
    assert.equal(variants.length, 2);
    assert.deepEqual(variants[0], { kind: 'minimum', value: 10, expectSuccess: true, nameSuffix: 'minimumBoundary' });
    assert.deepEqual(variants[1], { kind: 'belowMinimum', value: 9, expectSuccess: false, nameSuffix: 'belowMinimum' });
  });

  it('returns maximum and aboveMaximum variants when only maximum is declared', () => {
    const variants = generateBoundaryVariants({ type: 'number', maximum: 100 });
    assert.equal(variants.length, 2);
    assert.deepEqual(variants[0], { kind: 'maximum', value: 100, expectSuccess: true, nameSuffix: 'maximumBoundary' });
    assert.deepEqual(variants[1], { kind: 'aboveMaximum', value: 101, expectSuccess: false, nameSuffix: 'aboveMaximum' });
  });

  it('returns all four variants when both minimum and maximum are declared', () => {
    const variants = generateBoundaryVariants({ type: 'number', minimum: 10, maximum: 100 });
    assert.equal(variants.length, 4);
    assert.equal(variants[0]?.kind, 'minimum');
    assert.equal(variants[1]?.kind, 'belowMinimum');
    assert.equal(variants[2]?.kind, 'maximum');
    assert.equal(variants[3]?.kind, 'aboveMaximum');
  });

  it('returns correct values for all four variants', () => {
    const variants = generateBoundaryVariants({ type: 'integer', minimum: 10, maximum: 100 });
    assert.equal(variants[0]?.value, 10);
    assert.equal(variants[1]?.value, 9);
    assert.equal(variants[2]?.value, 100);
    assert.equal(variants[3]?.value, 101);
  });

  it('marks minimum and maximum variants as expectSuccess true', () => {
    const variants = generateBoundaryVariants({ type: 'number', minimum: 0, maximum: 50 });
    assert.equal(variants[0]?.expectSuccess, true);
    assert.equal(variants[2]?.expectSuccess, true);
  });

  it('marks belowMinimum and aboveMaximum variants as expectSuccess false', () => {
    const variants = generateBoundaryVariants({ type: 'number', minimum: 0, maximum: 50 });
    assert.equal(variants[1]?.expectSuccess, false);
    assert.equal(variants[3]?.expectSuccess, false);
  });

  it('handles minimum of 0 correctly (belowMinimum is -1)', () => {
    const variants = generateBoundaryVariants({ type: 'integer', minimum: 0 });
    assert.equal(variants[1]?.value, -1);
  });

  it('returns empty array for schema with no bounds', () => {
    const variants = generateBoundaryVariants({ type: 'number' });
    assert.equal(variants.length, 0);
  });

  it('returns atExclusiveMinimum (fail) and aboveExclusiveMinimum (success) for exclusiveMinimum: 0', () => {
    const variants = generateBoundaryVariants({ type: 'integer', exclusiveMinimum: 0 });
    assert.equal(variants.length, 2);
    assert.deepEqual(variants[0], { kind: 'exclusiveMinimum', value: 0, expectSuccess: false, nameSuffix: 'atExclusiveMinimum' });
    assert.deepEqual(variants[1], { kind: 'aboveExclusiveMinimum', value: 1, expectSuccess: true, nameSuffix: 'aboveExclusiveMinimum' });
  });

  it('returns belowExclusiveMaximum (success) and atExclusiveMaximum (fail) for exclusiveMaximum: 100', () => {
    const variants = generateBoundaryVariants({ type: 'integer', exclusiveMaximum: 100 });
    assert.equal(variants.length, 2);
    assert.deepEqual(variants[0], { kind: 'belowExclusiveMaximum', value: 99, expectSuccess: true, nameSuffix: 'belowExclusiveMaximum' });
    assert.deepEqual(variants[1], { kind: 'exclusiveMaximum', value: 100, expectSuccess: false, nameSuffix: 'atExclusiveMaximum' });
  });

  it('returns validMultiple (success) and notMultiple (fail) for multipleOf: 5', () => {
    const variants = generateBoundaryVariants({ type: 'integer', multipleOf: 5 });
    assert.equal(variants.length, 2);
    assert.deepEqual(variants[0], { kind: 'validMultiple', value: 5, expectSuccess: true, nameSuffix: 'validMultiple' });
    assert.deepEqual(variants[1], { kind: 'notMultiple', value: 6, expectSuccess: false, nameSuffix: 'notMultiple' });
  });

  it('generates all constraint variants when all five constraint types are present', () => {
    const variants = generateBoundaryVariants({
      type: 'integer',
      minimum: 0,
      maximum: 100,
      exclusiveMinimum: 0,
      exclusiveMaximum: 100,
      multipleOf: 10,
    });
    assert.equal(variants.length, 10);
    assert.equal(variants.filter(v => v.expectSuccess).length, 5);
    assert.equal(variants.filter(v => !v.expectSuccess).length, 5);
  });

  it('generates string length boundaries', () => {
    const variants = generateBoundaryVariants({
      type: 'string',
      minLength: 2,
      maxLength: 5
    });

    assert.deepEqual(variants[0], { kind: 'minLength', value: 2, expectSuccess: true, nameSuffix: 'minLengthBoundary' });
    assert.deepEqual(variants[1], { kind: 'belowMinLength', value: 1, expectSuccess: false, nameSuffix: 'belowMinLength' });
    assert.deepEqual(variants[2], { kind: 'maxLength', value: 5, expectSuccess: true, nameSuffix: 'maxLengthBoundary' });
    assert.deepEqual(variants[3], { kind: 'aboveMaxLength', value: 6, expectSuccess: false, nameSuffix: 'aboveMaxLength' });
  });

  it('generates array length boundaries', () => {
    const variants = generateBoundaryVariants({
      type: 'array',
      minItems: 2,
      maxItems: 4
    });

    assert.equal(variants.length, 4);

    assert.deepEqual(variants[0], { kind: 'minItems', value: 2, expectSuccess: true, nameSuffix: 'minItemsBoundary' });
    assert.deepEqual(variants[1], { kind: 'belowMinItems', value: 1, expectSuccess: false, nameSuffix: 'belowMinItems' });
    assert.deepEqual(variants[2], { kind: 'maxItems', value: 4, expectSuccess: true, nameSuffix: 'maxItemsBoundary' });
    assert.deepEqual(variants[3], { kind: 'aboveMaxItems', value: 5, expectSuccess: false, nameSuffix: 'aboveMaxItems' });
  });

  it('generates item boundary variants for array items', () => {
    const variants = generateBoundaryVariants({
      type: 'array',
      items: { type: 'number', minimum: 1 }
    });

    const itemVariants = variants.filter(v => v.nameSuffix.startsWith('item_'));

    assert.ok(itemVariants.length > 0);
    assert.ok(itemVariants.some(v => v.kind === 'minimum'));
    assert.ok(itemVariants.some(v => v.kind === 'belowMinimum'));
  });

});

describe('generateVariantValue', () => {
  it('generates string of given length for string schema', () => {
    const result = generateVariantValue({ type: 'string' }, 3);
    assert.equal(result, 'aaa');
  });

  it('generates array of given length when no items schema', () => {
    const result = generateVariantValue({ type: 'array' }, 2);
    assert.deepEqual(result, [null, null]);
  });

  it('generates array with numeric item override', () => {
    const result = generateVariantValue(
      { type: 'array', items: { type: 'number' }, minItems: 2 },
      99
    );
    assert.equal((result as unknown[])[0], 99);
  });

  it('generates array with string item override', () => {
    const result = generateVariantValue(
      { type: 'array', items: { type: 'string' }, minItems: 1 },
      4
    );
    assert.equal((result as unknown[])[0], 'aaaa');
  });

  it('generates nested array variant', () => {
    const result = generateVariantValue(
      {
        type: 'array',
        items: { type: 'array', items: { type: 'number' } },
        minItems: 1
      },
      3
    );
    assert.ok(Array.isArray((result as unknown[])[0]));
  });
});

describe('hasStringLengthBounds', () => {
  it('returns true for string with minLength', () => {
    assert.equal(hasStringLengthBounds({ type: 'string', minLength: 1 }), true);
  });

  it('returns true for string with maxLength', () => {
    assert.equal(hasStringLengthBounds({ type: 'string', maxLength: 5 }), true);
  });

  it('returns false for string without bounds', () => {
    assert.equal(hasStringLengthBounds({ type: 'string' }), false);
  });

  it('returns false for non-string', () => {
    assert.equal(hasStringLengthBounds({ type: 'number', minLength: 1 }), false);
  });
});

describe('buildArrayOfLength', () => {
  it('returns null-filled array when no item schema', () => {
    const result = buildArrayOfLength({ type: 'array' }, 3);
    assert.deepEqual(result, [null, null, null]);
  });
});
