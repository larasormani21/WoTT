import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TestCase } from '../model/index.js';
import {
  generateActionTestCases,
  appendQuery,
  buildQueryParameter
} from '../test-generation/handlers/action-handler.js';


describe('generateActionTestCases', () => {

  it('returns empty array when url is absent (stub with no forms)', () => {
    const tc: TestCase = {
      id: 'action-toggle',
      name: 'testAction_toggle',
      interactionType: 'action',
      interactionName: 'toggle',
    };
    const result = generateActionTestCases(tc);
    assert.deepEqual(result, []);
  });

  it('returns base testCase when schema or method is missing', () => {
    const tc: TestCase = {
      id: 'action-no-schema',
      name: 'testAction_no_schema',
      interactionType: 'action',
      interactionName: 'getStatus',
      httpMethod: 'GET',
      url: 'http://example.com/getStatus',
    };
    const result = generateActionTestCases(tc);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], tc);
  });

  it('returns the test case unchanged when dataSchema is defined but httpMethod is absent', () => {
    const tc: TestCase = {
      id: 'invokeaction-noMethod',
      name: 'testAction_noMethod',
      interactionType: 'action',
      interactionName: 'noMethod',
      url: 'http://example.com/noMethod',
      dataSchema: { type: 'string' },
    };
    const result = generateActionTestCases(tc);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], tc);
  });

  it('generates requestBody from dataSchema for non-GET methods', () => {
    const tc: TestCase = {
      id: 'invokeaction-setTemp',
      name: 'testAction_setTemp',
      interactionType: 'action',
      interactionName: 'setTemp',
      httpMethod: 'POST',
      url: 'http://example.com/setTemp',
      dataSchema: { type: 'number' },
    };
    const result = generateActionTestCases(tc);
    assert.equal(result.length, 2);
    assert.equal(result[0]?.requestBody, '42');
    assert.equal(result[1]?.requestBody, '"invalid"');
    assert.equal(result[1]?.name, 'testAction_setTemp_invalidType');
    assert.equal(result[1]?.expectedStatus, 400);
  });

  it('uses enum value from dataSchema for requestBody', () => {
    const tc: TestCase = {
      id: 'invokeaction-setMode',
      name: 'testAction_setMode',
      interactionType: 'action',
      interactionName: 'setMode',
      httpMethod: 'PUT',
      url: 'http://example.com/setMode',
      dataSchema: { type: 'string', enum: ['on', 'off'] },
    };
    const result = generateActionTestCases(tc);
    assert.equal(result[0]?.requestBody, '"on"');
  });

  it('uses query string parameters for GET action inputs and does not generate requestBody', () => {
    const tc: TestCase = {
      id: 'invokeaction-getStatus',
      name: 'testAction_getStatus',
      interactionType: 'action',
      interactionName: 'getStatus',
      httpMethod: 'GET',
      url: 'http://example.com/getStatus',
      dataSchema: { type: 'string' },
    };
    const result = generateActionTestCases(tc);
    assert.equal(result.length, 2);
    assert.equal(result[0]?.requestBody, undefined);
    assert.equal(result[0]?.url, 'http://example.com/getStatus?value=test');
    assert.equal(result[1]?.requestBody, undefined);
    assert.equal(result[1]?.url, 'http://example.com/getStatus?value=42');
    assert.equal(result[1]?.name, 'testAction_getStatus_invalidType');
    assert.equal(result[1]?.expectedStatus, 400);
  });

  it('expands a numeric action input with both bounds into four boundary variants', () => {
    const tc: TestCase = {
      id: 'invokeaction-setLevel',
      name: 'testAction_setLevel',
      interactionType: 'action',
      interactionName: 'setLevel',
      httpMethod: 'POST',
      url: 'http://example.com/setLevel',
      dataSchema: { type: 'number', minimum: 10, maximum: 100 },
    };
    const result = generateActionTestCases(tc);
    assert.equal(result.length, 5);
    assert.equal(result[0]?.requestBody, '10');
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[0]?.id, 'invokeaction-setLevel-minimumBoundary');
    assert.equal(result[0]?.name, 'testAction_setLevel_minimumBoundary');
    assert.equal(result[1]?.requestBody, '9');
    assert.equal(result[1]?.expectedStatus, 400);
    assert.equal(result[2]?.requestBody, '100');
    assert.equal(result[2]?.expectedStatus, 200);
    assert.equal(result[3]?.requestBody, '101');
    assert.equal(result[3]?.expectedStatus, 400);
    assert.equal(result[4]?.name, 'testAction_setLevel_invalidType');
    assert.equal(result[4]?.requestBody, '"invalid"');
    assert.equal(result[4]?.expectedStatus, 400);
  });

  it('expands an action input with exclusiveMinimum and exclusiveMaximum into four variants', () => {
    const tc: TestCase = {
      id: 'invokeaction-setLevel',
      name: 'testAction_setLevel',
      interactionType: 'action',
      interactionName: 'setLevel',
      httpMethod: 'POST',
      url: 'http://example.com/setLevel',
      dataSchema: { type: 'integer', exclusiveMinimum: 0, exclusiveMaximum: 100 },
    };
    const result = generateActionTestCases(tc);
    assert.equal(result.length, 5);
    assert.equal(result[0]?.name, 'testAction_setLevel_atExclusiveMinimum');
    assert.equal(result[0]?.requestBody, '0');
    assert.equal(result[0]?.expectedStatus, 400);
    assert.equal(result[1]?.name, 'testAction_setLevel_aboveExclusiveMinimum');
    assert.equal(result[1]?.requestBody, '1');
    assert.equal(result[1]?.expectedStatus, 200);
    assert.equal(result[2]?.name, 'testAction_setLevel_belowExclusiveMaximum');
    assert.equal(result[2]?.requestBody, '99');
    assert.equal(result[2]?.expectedStatus, 200);
    assert.equal(result[3]?.name, 'testAction_setLevel_atExclusiveMaximum');
    assert.equal(result[3]?.requestBody, '100');
    assert.equal(result[3]?.expectedStatus, 400);
    assert.equal(result[4]?.name, 'testAction_setLevel_invalidType');
    assert.equal(result[4]?.requestBody, '"invalid"');
    assert.equal(result[4]?.expectedStatus, 400);
  });

  it('expands an action input with multipleOf into validMultiple and notMultiple variants', () => {
    const tc: TestCase = {
      id: 'invokeaction-setStep',
      name: 'testAction_setStep',
      interactionType: 'action',
      interactionName: 'setStep',
      httpMethod: 'POST',
      url: 'http://example.com/setStep',
      dataSchema: { type: 'integer', multipleOf: 10 },
    };
    const result = generateActionTestCases(tc);
    assert.equal(result.length, 3);
    assert.equal(result[0]?.name, 'testAction_setStep_validMultiple');
    assert.equal(result[0]?.requestBody, '10');
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[1]?.name, 'testAction_setStep_notMultiple');
    assert.equal(result[1]?.requestBody, '11');
    assert.equal(result[1]?.expectedStatus, 400);
    assert.equal(result[2]?.name, 'testAction_setStep_invalidType');
    assert.equal(result[2]?.requestBody, '"invalid"');
    assert.equal(result[2]?.expectedStatus, 400);
  });

  it('produces valid and invalid type cases for a numeric action input without bounds', () => {
    const tc: TestCase = {
      id: 'invokeaction-setTemp',
      name: 'testAction_setTemp',
      interactionType: 'action',
      interactionName: 'setTemp',
      httpMethod: 'POST',
      url: 'http://example.com/setTemp',
      dataSchema: { type: 'number' },
    };
    const result = generateActionTestCases(tc);
    assert.equal(result.length, 2);
    assert.equal(result[0]?.requestBody, '42');
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[1]?.requestBody, '"invalid"');
    assert.equal(result[1]?.expectedStatus, 400);
  });

  it('expands a string action input with both bounds into four boundary variants', () => {
    const tc: TestCase = {
      id: 'invokeaction-setName',
      name: 'testAction_setName',
      interactionType: 'action',
      interactionName: 'setName',
      httpMethod: 'POST',
      url: 'http://example.com/setName',
      dataSchema: { type: 'string', minLength: 5, maxLength: 10 },
    };
    const result = generateActionTestCases(tc);
    assert.equal(result.length, 5);
    assert.equal(result[0]?.requestBody, '"aaaaa"');
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[1]?.requestBody, '"aaaa"');
    assert.equal(result[1]?.expectedStatus, 400);
    assert.equal(result[2]?.requestBody, '"aaaaaaaaaa"');
    assert.equal(result[2]?.expectedStatus, 200);
    assert.equal(result[3]?.requestBody, '"aaaaaaaaaaa"');
    assert.equal(result[3]?.expectedStatus, 400);
    assert.equal(result[4]?.requestBody, '42');
    assert.equal(result[4]?.expectedStatus, 400);
  });

  it('produces valid and invalid type cases for a string action input without bounds', () => {
    const tc: TestCase = {
      id: 'invokeaction-setName',
      name: 'testAction_setName',
      interactionType: 'action',
      interactionName: 'setName',
      httpMethod: 'POST',
      url: 'http://example.com/setName',
      dataSchema: { type: 'string' },
    };
    const result = generateActionTestCases(tc);
    assert.equal(result.length, 2);
    assert.equal(result[0]?.requestBody, '"test"');
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[1]?.requestBody, '42');
    assert.equal(result[1]?.expectedStatus, 400);
  });

  it('expands object with bounded leaf into variants + invalid', () => {
    const tc: TestCase = {
      id: 'obj',
      name: 'test_obj',
      interactionType: 'action',
      interactionName: 'obj',
      httpMethod: 'POST',
      url: 'http://example.com',
      dataSchema: {
        type: 'object',
        properties: {
          a: { type: 'number', minimum: 0, maximum: 10 },
        },
      },
    };

    const result = generateActionTestCases(tc);

    assert.ok(result.length >= 5);
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[1]?.expectedStatus, 400);
    assert.equal(result.at(-1)?.expectedStatus, 400);
  });

  it('object leaf without bounds uses fallback + invalid', () => {
    const tc: TestCase = {
      id: 'obj2',
      name: 'test_obj2',
      interactionType: 'action',
      interactionName: 'obj2',
      httpMethod: 'POST',
      url: 'http://example.com',
      dataSchema: {
        type: 'object',
        properties: {
          a: { type: 'string' },
        },
      },
    };

    const result = generateActionTestCases(tc);

    assert.equal(result.length, 2);
    assert.equal(result[0]?.expectedStatus, 200);
    assert.equal(result[1]?.expectedStatus, 400);
  });

  it('object without properties falls back to non-object branch', () => {
    const tc: TestCase = {
      id: 'obj-empty',
      name: 'test_obj_empty',
      interactionType: 'action',
      interactionName: 'obj_empty',
      httpMethod: 'POST',
      url: 'http://example.com',
      dataSchema: { type: 'object' },
    };

    const result = generateActionTestCases(tc);

    assert.ok(result.length >= 1);
  });

  it('handles array with item boundary variants', () => {
    const tc: TestCase = {
      id: 'arr',
      name: 'test_arr',
      interactionType: 'action',
      interactionName: 'arr',
      httpMethod: 'POST',
      url: 'http://example.com',
      dataSchema: {
        type: 'array',
        items: { type: 'number', minimum: 0, maximum: 10 },
      },
    };

    const result = generateActionTestCases(tc);

    assert.ok(result.some(r => r.expectedStatus === 400));
  });

  it('array without bounds uses fallback', () => {
    const tc: TestCase = {
      id: 'arr2',
      name: 'test_arr2',
      interactionType: 'action',
      interactionName: 'arr2',
      httpMethod: 'POST',
      url: 'http://example.com',
      dataSchema: {
        type: 'array',
        items: { type: 'number' },
      },
    };

    const result = generateActionTestCases(tc);

    assert.equal(result.length, 2);
  });

  it('serializes object into query params for GET', () => {
    const tc: TestCase = {
      id: 'get-obj',
      name: 'test_get_obj',
      interactionType: 'action',
      interactionName: 'get_obj',
      httpMethod: 'GET',
      url: 'http://example.com',
      dataSchema: {
        type: 'object',
        properties: {
          a: { type: 'number' },
        },
      },
    };

    const result = generateActionTestCases(tc);

    assert.ok(result[0]?.url?.includes('a=42'));
  });

  it('does not include requestBody when undefined (GET + empty object)', () => {
    const tc: TestCase = {
      id: 'get-empty',
      name: 'test_get_empty',
      interactionType: 'action',
      interactionName: 'get_empty',
      httpMethod: 'GET',
      url: 'http://example.com',
      dataSchema: { type: 'object', properties: {} },
    };

    const result = generateActionTestCases(tc);

    assert.equal(result[0]?.requestBody, undefined);
  });

  it('does not include requestBody when JSON.stringify returns undefined (non-GET)', () => {
    const tc: TestCase = {
      id: 'edge-undefined',
      name: 'test_edge_undefined',
      interactionType: 'action',
      interactionName: 'edge',
      httpMethod: 'POST',
      url: 'http://example.com',
      dataSchema: { type: 'null' },
    };

    const result = generateActionTestCases(tc);
    assert.equal(result[0]?.requestBody, 'null');
  });

  it('builds nested object schema recursively', () => {
    const tc: TestCase = {
      id: 'nested-obj',
      name: 'nested',
      interactionType: 'action',
      interactionName: 'nested',
      httpMethod: 'POST',
      url: 'http://example.com',
      dataSchema: {
        type: 'object',
        properties: {
          a: {
            type: 'object',
            properties: {
              b: { type: 'number' },
            },
          },
        },
      },
    };

    const result = generateActionTestCases(tc);

    assert.ok(result.length > 0);
  });

});

describe('appendQuery', () => {
  it('appendQuery adds ? when not present', () => {
    const url = appendQuery('http://example.com', 'a=1');
    assert.equal(url, 'http://example.com?a=1');
  });

  it('appendQuery adds & when ? already present', () => {
    const url = appendQuery('http://example.com?x=1', 'a=2');
    assert.equal(url, 'http://example.com?x=1&a=2');
  });
});

describe('buildQueryParameter', () => {
  it('handles null value', () => {
    const query = buildQueryParameter(null);
    assert.equal(query, 'value=null');
  });
  it('handles string primitive', () => {
    const query = buildQueryParameter('test');
    assert.equal(query, 'value=test');
  });
  it('handles array of primitives', () => {
    const query = buildQueryParameter(['x', 'y']);
    assert.equal(query, 'value%5B0%5D=x&value%5B1%5D=y');
  });
  it('handles nested object', () => {
    const query = buildQueryParameter({
      a: {
        b: {
          c: 3
        }
      }
    });

    assert.ok(query.includes('a.b.c=3'));
  });
  it('handles array with prefix', () => {
    const query = buildQueryParameter([1, 2], 'data');
    assert.equal(query, 'data%5B0%5D=1&data%5B1%5D=2');
  });

  it('handles nested array with prefix', () => {
    const query = buildQueryParameter(
      { list: [1] }, 'data'
    );

    assert.equal(query, 'data.list%5B0%5D=1');
  });
  it('handles nested object with prefix', () => {
    const query = buildQueryParameter({ a: { b: 2 } }, 'data');

    assert.ok(query.includes('data.a.b=2'));
  });
  it('handles empty object in query parameters', () => {
    const query = buildQueryParameter({});
    assert.equal(query, '');
  });
  it('handles null inside object', () => {
    const query = buildQueryParameter({ a: null });

    assert.equal(query, 'a=null');
  });
  it('buildQueryParameter handles array of objects', () => {
    const query = buildQueryParameter([
      { a: 1 },
      { b: 2 },
    ]);

    assert.ok(query.includes('value%5B0%5D=%7B'));
    assert.ok(query.includes('value%5B1%5D=%7B'));
  });
});
