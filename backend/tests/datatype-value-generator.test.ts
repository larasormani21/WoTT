import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateInvalidSampleValue, generateValidSampleValue } from '../test-generation/handlers/datatype-values-generator.js';

describe('generateValidSampleValue', () => {
  it('returns 42 for number type', () => {
    assert.equal(generateValidSampleValue({ type: 'number' }), 42);
  });

  it('returns 42 for integer type', () => {
    assert.equal(generateValidSampleValue({ type: 'integer' }), 42);
  });

  it('returns true for boolean type', () => {
    assert.equal(generateValidSampleValue({ type: 'boolean' }), true);
  });

  it('returns "test" for string type', () => {
    assert.equal(generateValidSampleValue({ type: 'string' }), 'test');
  });

  it('returns empty array for array type', () => {
    assert.deepEqual(generateValidSampleValue({ type: 'array' }), []);
  });

  it('returns empty object for object type', () => {
    assert.deepEqual(generateValidSampleValue({ type: 'object' }), {});
  });

  it('returns null for null type', () => {
    assert.equal(generateValidSampleValue({ type: 'null' }), null);
  });

  it('returns null for unknown type', () => {
    assert.equal(generateValidSampleValue({}), null);
  });

  it('prefers enum[0] over type-based fallback', () => {
    assert.equal(generateValidSampleValue({ type: 'number', enum: [5, 10] }), 5);
  });

  it('prefers const over type-based fallback', () => {
    assert.equal(generateValidSampleValue({ type: 'string', const: 'fixed' }), 'fixed');
  });

  it('prefers default over type-based fallback', () => {
    assert.equal(generateValidSampleValue({ type: 'number', default: 99 }), 99);
  });

  it('prefers enum over const and default', () => {
    assert.equal(generateValidSampleValue({ type: 'string', enum: ['a', 'b'], const: 'c', default: 'd' }), 'a');
  });

  it('returns array with generated item when items is defined', () => {
    const result = generateValidSampleValue({
      type: 'array',
      items: { type: 'number' }
    });

    assert.deepStrictEqual(result, [42]);
  });

  it('returns object with generated properties', () => {
    const result = generateValidSampleValue({
      type: 'object',
      properties: {
        a: { type: 'number' },
        b: { type: 'string' }
      }
    });

    assert.deepStrictEqual(result, {
      a: 42,
      b: 'test'
    });
  });

  it('handles nested object properties recursively', () => {
    const result = generateValidSampleValue({
      type: 'object',
      properties: {
        nested: {
          type: 'object',
          properties: {
            value: { type: 'boolean' }
          }
        }
      }
    });

    assert.deepStrictEqual(result, {
      nested: {
        value: true
      }
    });
  });
});

describe('generateInvalidSampleValue', () => {
  it('returns string for numeric types', () => {
    assert.equal(generateInvalidSampleValue({ type: 'number' }), 'invalid');
    assert.equal(generateInvalidSampleValue({ type: 'integer' }), 'invalid');
  });

  it('returns number for non-numeric types', () => {
    assert.equal(generateInvalidSampleValue({ type: 'string' }), 42);
    assert.equal(generateInvalidSampleValue({ type: 'boolean' }), 42);
  });
});