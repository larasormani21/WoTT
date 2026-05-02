import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TestCase } from '../model/index.js';
import { generatePropertyTestCases } from '../test-generation/handlers/property-handler.js';

describe('generatePropertyTestCases', () => {
  it('returns the test case when it has a url (readproperty)', () => {
    const tc: TestCase = {
      id: 'property-temp',
      name: 'testProperty_temp',
      interactionType: 'property',
      interactionName: 'temp',
      httpMethod: 'GET',
      url: 'http://example.com/temp',
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], tc);
  });

  it('returns empty array when url is absent (stub with no forms)', () => {
    const tc: TestCase = {
      id: 'property-actuator',
      name: 'testProperty_actuator',
      interactionType: 'property',
      interactionName: 'actuator',
    };
    const result = generatePropertyTestCases(tc);
    assert.deepEqual(result, []);
  });

  it('preserves url and httpMethod for readproperty cases', () => {
    const tc: TestCase = {
      id: 'property-humidity',
      name: 'testProperty_humidity',
      interactionType: 'property',
      interactionName: 'humidity',
      httpMethod: 'GET',
      url: 'http://example.com/hum',
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result[0]?.url, 'http://example.com/hum');
    assert.equal(result[0]?.httpMethod, 'GET');
  });

  it('generates requestBody from dataSchema for write cases and a negative invalid-type test', () => {
    const tc: TestCase = {
      id: 'writeproperty-actuator',
      name: 'testWriteProperty_actuator',
      interactionType: 'property',
      interactionName: 'actuator',
      httpMethod: 'PUT',
      url: 'http://example.com/act',
      dataSchema: { type: 'boolean' },
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result.length, 2);
    assert.equal(result[0]?.requestBody, 'true');
    assert.equal(result[1]?.requestBody, '42');
    assert.equal(result[1]?.name, 'testWriteProperty_actuator_invalidType');
    assert.equal(result[1]?.expectedStatus, 400);
  });

  it('generates invalid type test case for number dataSchema values', () => {
    const tc: TestCase = {
      id: 'writeproperty-temp',
      name: 'testWriteProperty_temp',
      interactionType: 'property',
      interactionName: 'temp',
      httpMethod: 'PUT',
      url: 'http://example.com/temp',
      dataSchema: { type: 'number' },
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result.length, 2);
    assert.equal(result[0]?.requestBody, '42');
    assert.equal(result[1]?.requestBody, '"invalid"');
    assert.equal(result[1]?.name, 'testWriteProperty_temp_invalidType');
    assert.equal(result[1]?.expectedStatus, 400);
  });

  it('uses enum value from dataSchema for requestBody', () => {
    const tc: TestCase = {
      id: 'writeproperty-mode',
      name: 'testWriteProperty_mode',
      interactionType: 'property',
      interactionName: 'mode',
      httpMethod: 'PUT',
      url: 'http://example.com/mode',
      dataSchema: { type: 'string', enum: ['on', 'off'] },
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result[0]?.requestBody, '"on"');
    assert.equal(result[1]?.requestBody, '42');
    assert.equal(result[1]?.name, 'testWriteProperty_mode_invalidType');
    assert.equal(result[1]?.expectedStatus, 400);
  });

  it('expands a numeric sub-property with bounds into wrapped boundary variants', () => {
    const tc: TestCase = {
      id: 'writeproperty-status-brightness',
      name: 'testWriteProperty_status_brightness',
      interactionType: 'property',
      interactionName: 'status',
      httpMethod: 'PUT',
      url: 'https://mylamp.example.com/status',
      dataSchema: { type: 'number', minimum: 0, maximum: 100 },
      propertyPath: 'brightness',
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result.length, 5);
    assert.equal(result[0]?.requestBody, '{"brightness":0}');
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[1]?.requestBody, '{"brightness":-1}');
    assert.equal(result[1]?.expectedStatus, 400);
    assert.equal(result[2]?.requestBody, '{"brightness":100}');
    assert.equal(result[2]?.expectedStatus, 200);
    assert.equal(result[3]?.requestBody, '{"brightness":101}');
    assert.equal(result[3]?.expectedStatus, 400);
    assert.equal(result[4]?.name, 'testWriteProperty_status_brightness_invalidType');
    assert.equal(result[4]?.requestBody, '{"brightness":"invalid"}');
    assert.equal(result[4]?.expectedStatus, 400);
  });

  it('wraps a nested dot-path into deeply nested JSON', () => {
    const tc: TestCase = {
      id: 'writeproperty-device-status-brightness',
      name: 'testWriteProperty_device_status_brightness',
      interactionType: 'property',
      interactionName: 'device',
      httpMethod: 'PUT',
      url: 'https://example.com/device',
      dataSchema: { type: 'number' },
      propertyPath: 'status.brightness',
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result[0]?.requestBody, '{"status":{"brightness":42}}');
  });

  it('wraps array sub-property in its path', () => {
    const tc: TestCase = {
      id: 'writeproperty-status-rgb',
      name: 'testWriteProperty_status_rgb',
      interactionType: 'property',
      interactionName: 'status',
      httpMethod: 'PUT',
      url: 'https://mylamp.example.com/status',
      dataSchema: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
      propertyPath: 'rgb',
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result[0]?.requestBody, '{"rgb":[42,42,42]}');
  });

  it('does not wrap body when propertyPath is absent (primitive property)', () => {
    const tc: TestCase = {
      id: 'writeproperty-temp',
      name: 'testWriteProperty_temp',
      interactionType: 'property',
      interactionName: 'temp',
      httpMethod: 'PUT',
      url: 'http://example.com/temp',
      dataSchema: { type: 'number' },
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result.length, 2);
    assert.equal(result[0]?.requestBody, '42');
    assert.equal(result[1]?.requestBody, '"invalid"');
    assert.equal(result[1]?.expectedStatus, 400);
  });

  it('does not set requestBody on read cases even if dataSchema is absent', () => {
    const tc: TestCase = {
      id: 'property-temp',
      name: 'testProperty_temp',
      interactionType: 'property',
      interactionName: 'temp',
      httpMethod: 'GET',
      url: 'http://example.com/temp',
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result[0]?.requestBody, undefined);
  });

  it('expands a flat numeric write property with both bounds into four boundary variants', () => {
    const tc: TestCase = {
      id: 'writeproperty-brightness',
      name: 'testWriteProperty_brightness',
      interactionType: 'property',
      interactionName: 'brightness',
      httpMethod: 'PUT',
      url: 'http://example.com/brightness',
      dataSchema: { type: 'integer', minimum: 10, maximum: 100 },
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result.length, 5);
    assert.equal(result[0]?.requestBody, '10');
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[0]?.id, 'writeproperty-brightness-minimumBoundary');
    assert.equal(result[0]?.name, 'testWriteProperty_brightness_minimumBoundary');
    assert.equal(result[1]?.requestBody, '9');
    assert.equal(result[1]?.expectedStatus, 400);
    assert.equal(result[2]?.requestBody, '100');
    assert.equal(result[2]?.expectedStatus, 200);
    assert.equal(result[3]?.requestBody, '101');
    assert.equal(result[3]?.expectedStatus, 400);
    assert.equal(result[4]?.name, 'testWriteProperty_brightness_invalidType');
    assert.equal(result[4]?.requestBody, '"invalid"');
    assert.equal(result[4]?.expectedStatus, 400);
  });

  it('expands a numeric write property with only minimum into two boundary variants', () => {
    const tc: TestCase = {
      id: 'writeproperty-level',
      name: 'testWriteProperty_level',
      interactionType: 'property',
      interactionName: 'level',
      httpMethod: 'PUT',
      url: 'http://example.com/level',
      dataSchema: { type: 'number', minimum: 5 },
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result.length, 3);
    assert.equal(result[0]?.requestBody, '5');
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[1]?.requestBody, '4');
    assert.equal(result[1]?.expectedStatus, 400);
    assert.equal(result[2]?.name, 'testWriteProperty_level_invalidType');
    assert.equal(result[2]?.requestBody, '"invalid"');
    assert.equal(result[2]?.expectedStatus, 400);
  });

  it('produces valid and invalid type cases for a numeric write property without bounds', () => {
    const tc: TestCase = {
      id: 'writeproperty-count',
      name: 'testWriteProperty_count',
      interactionType: 'property',
      interactionName: 'count',
      httpMethod: 'PUT',
      url: 'http://example.com/count',
      dataSchema: { type: 'number' },
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result.length, 2);
    assert.equal(result[0]?.requestBody, '42');
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[1]?.requestBody, '"invalid"');
    assert.equal(result[1]?.expectedStatus, 400);
  });

  it('expands a property with exclusiveMinimum into atExclusiveMinimum (fail) and aboveExclusiveMinimum (success) variants', () => {
    const tc: TestCase = {
      id: 'writeproperty-level',
      name: 'testWriteProperty_level',
      interactionType: 'property',
      interactionName: 'level',
      httpMethod: 'PUT',
      url: 'http://example.com/level',
      dataSchema: { type: 'integer', exclusiveMinimum: 0 },
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result.length, 3);
    assert.equal(result[0]?.requestBody, '0');
    assert.equal(result[0]?.expectedStatus, 400);
    assert.equal(result[0]?.name, 'testWriteProperty_level_atExclusiveMinimum');
    assert.equal(result[1]?.requestBody, '1');
    assert.equal(result[1]?.expectedStatus, 200);
    assert.equal(result[1]?.name, 'testWriteProperty_level_aboveExclusiveMinimum');
    assert.equal(result[2]?.name, 'testWriteProperty_level_invalidType');
    assert.equal(result[2]?.requestBody, '"invalid"');
    assert.equal(result[2]?.expectedStatus, 400);
  });

  it('expands a property with exclusiveMaximum into belowExclusiveMaximum (success) and atExclusiveMaximum (fail) variants', () => {
    const tc: TestCase = {
      id: 'writeproperty-level',
      name: 'testWriteProperty_level',
      interactionType: 'property',
      interactionName: 'level',
      httpMethod: 'PUT',
      url: 'http://example.com/level',
      dataSchema: { type: 'integer', exclusiveMaximum: 100 },
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result.length, 3);
    assert.equal(result[0]?.requestBody, '99');
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[0]?.name, 'testWriteProperty_level_belowExclusiveMaximum');
    assert.equal(result[1]?.requestBody, '100');
    assert.equal(result[1]?.expectedStatus, 400);
    assert.equal(result[1]?.name, 'testWriteProperty_level_atExclusiveMaximum');
    assert.equal(result[2]?.name, 'testWriteProperty_level_invalidType');
    assert.equal(result[2]?.requestBody, '"invalid"');
    assert.equal(result[2]?.expectedStatus, 400);
  });

  it('expands a property with multipleOf into validMultiple (success) and notMultiple (fail) variants', () => {
    const tc: TestCase = {
      id: 'writeproperty-step',
      name: 'testWriteProperty_step',
      interactionType: 'property',
      interactionName: 'step',
      httpMethod: 'PUT',
      url: 'http://example.com/step',
      dataSchema: { type: 'integer', multipleOf: 5 },
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result.length, 3);
    assert.equal(result[0]?.requestBody, '5');
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[0]?.name, 'testWriteProperty_step_validMultiple');
    assert.equal(result[1]?.requestBody, '6');
    assert.equal(result[1]?.expectedStatus, 400);
    assert.equal(result[1]?.name, 'testWriteProperty_step_notMultiple');
    assert.equal(result[2]?.name, 'testWriteProperty_step_invalidType');
    assert.equal(result[2]?.requestBody, '"invalid"');
    assert.equal(result[2]?.expectedStatus, 400);
  });

  it('expands an array write property with bounded items into four numeric boundary variants', () => {
    const tc: TestCase = {
      id: 'writeproperty-status-rgb',
      name: 'testWriteProperty_status_rgb',
      interactionType: 'property',
      interactionName: 'status',
      httpMethod: 'PUT',
      url: 'https://mylamp.example.com/status',
      dataSchema: { type: 'array', items: { type: 'number', minimum: 0, maximum: 255 }, minItems: 3, maxItems: 3 },
      propertyPath: 'rgb',
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result[4]?.requestBody, '{"rgb":[0,42,42]}');
    assert.equal(result[4]?.expectedStatus, 200);
    assert.equal(result[5]?.requestBody, '{"rgb":[-1,42,42]}');
    assert.equal(result[5]?.expectedStatus, 400);
    assert.equal(result[6]?.requestBody, '{"rgb":[255,42,42]}');
    assert.equal(result[6]?.expectedStatus, 200);
    assert.equal(result[7]?.requestBody, '{"rgb":[256,42,42]}');
    assert.equal(result[7]?.expectedStatus, 400);
    assert.equal(result[8]?.name, 'testWriteProperty_status_rgb_invalidType');
    assert.equal(result[8]?.requestBody, '{"rgb":42}');
    assert.equal(result[8]?.expectedStatus, 400);
  });

  it('expands a flat array write property with bounded items into boundary variants', () => {
    const tc: TestCase = {
      id: 'writeproperty-values',
      name: 'testWriteProperty_values',
      interactionType: 'property',
      interactionName: 'values',
      httpMethod: 'PUT',
      url: 'http://example.com/values',
      dataSchema: { type: 'array', items: { type: 'integer', minimum: 1, maximum: 10 }, minItems: 2 },
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result[0]?.requestBody, '[42,42]');
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[1]?.requestBody, '[42]');
    assert.equal(result[1]?.expectedStatus, 400);
    assert.equal(result[2]?.requestBody, '[1,42]');
    assert.equal(result[2]?.expectedStatus, 200);
    assert.equal(result[3]?.requestBody, '[0,42]');
    assert.equal(result[3]?.expectedStatus, 400);
    assert.equal(result[4]?.requestBody, '[10,42]');
    assert.equal(result[4]?.expectedStatus, 200);
    assert.equal(result[5]?.requestBody, '[11,42]');
    assert.equal(result[5]?.expectedStatus, 400);
    assert.equal(result[6]?.name, 'testWriteProperty_values_invalidType');
    assert.equal(result[6]?.requestBody, '42');
    assert.equal(result[6]?.expectedStatus, 400);
  });

  it('produces valid and invalid type cases for a non-numeric write property', () => {
    const tc: TestCase = {
      id: 'writeproperty-mode',
      name: 'testWriteProperty_mode',
      interactionType: 'property',
      interactionName: 'mode',
      httpMethod: 'PUT',
      url: 'http://example.com/mode',
      dataSchema: { type: 'string', enum: ['on', 'off'] },
    };
    const result = generatePropertyTestCases(tc);
    assert.equal(result.length, 2);
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[1]?.expectedStatus, 400);
  });
});
