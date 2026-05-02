import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { TestSuite } from '../model/index.js';
import { sanitizeIdentifier, createTestSuiteName, generateGenericTestSuite } from '../test-generation/test-generator.js';

describe('sanitizeIdentifier', () => {
  it('passes through a plain alphanumeric name unchanged', () => {
    assert.equal(sanitizeIdentifier('myProp'), 'myProp');
  });

  it('replaces hyphens and dots with underscores', () => {
    assert.equal(sanitizeIdentifier('my-prop.value'), 'my_prop_value');
  });

  it('prepends underscore when name starts with a digit', () => {
    assert.equal(sanitizeIdentifier('123abc'), '_123abc');
  });

  it('leaves a name starting with underscore unchanged', () => {
    assert.equal(sanitizeIdentifier('_valid'), '_valid');
  });
});

describe('createTestSuiteName', () => {
  it('appends TestSuite to a simple title', () => {
    assert.equal(createTestSuiteName('MyThing'), 'MyThingTestSuite');
  });

  it('strips the URN prefix and uses the last segment', () => {
    assert.equal(createTestSuiteName('urn:dev:ops:myThing'), 'myThingTestSuite');
  });

  it('replaces special characters with underscores', () => {
    assert.equal(createTestSuiteName('my-thing.v2'), 'my_thing_v2TestSuite');
  });
});

describe('generateGenericTestSuite', () => {
  it('returns a suite with empty testCases for an empty model', () => {
    const model: TestSuite = { thingId: 'urn:x:y:empty', testCases: [] };
    const result = generateGenericTestSuite(model);
    assert.equal(result.thingId, 'urn:x:y:empty');
    assert.equal(result.suiteName, 'emptyTestSuite');
    assert.deepEqual(result.testCases, []);
  });

  it('maps property cases with sanitized functionName', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        { id: 'property-temp', name: 'testProperty_temp', interactionType: 'property', interactionName: 'temp', httpMethod: 'GET', url: 'http://example.com/temp' },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases.length, 1);
    assert.equal(result.testCases[0]?.functionName, 'testProperty_temp');
    assert.equal(result.testCases[0]?.interactionType, 'property');
  });

  it('maps url and httpMethod through to generic test case', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        { id: 'property-temp', name: 'testProperty_temp', interactionType: 'property', interactionName: 'temp', httpMethod: 'GET', url: 'http://example.com/temp' },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases[0]?.httpMethod, 'GET');
    assert.equal(result.testCases[0]?.url, 'http://example.com/temp');
  });

  it('maps requestBody through to generic test case after handler generates it', () => {
    // The property handler sets requestBody on the TestCase (from dataSchema) before
    // mapToGenericTestCase is called; verify it is forwarded to the GenericTestCase.
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        { id: 'writeproperty-actuator', name: 'testWriteProperty_actuator', interactionType: 'property', interactionName: 'actuator', httpMethod: 'PUT', url: 'http://example.com/act', dataSchema: { type: 'boolean' } },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases[0]?.requestBody, 'true');
    assert.equal(result.testCases[0]?.httpMethod, 'PUT');
  });

  it('forwards responseSchema through to GenericTestCase', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        { id: 'invokeaction-status', name: 'testAction_status', interactionType: 'action', interactionName: 'status', httpMethod: 'GET', url: 'http://example.com/status', responseSchema: { type: 'boolean' } },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.deepEqual(result.testCases[0]?.responseSchema, { type: 'boolean' });
  });

  it('forwards expectedStatus to GenericTestCase for negative test cases', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        { id: 'invokeaction-status', name: 'testAction_status_invalidType', interactionType: 'action', interactionName: 'status', httpMethod: 'GET', url: 'http://example.com/status', expectedStatus: 400 },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases[0]?.expectedStatus, 400);
  });

  it('does not include requestBody on read test cases', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        { id: 'property-temp', name: 'testProperty_temp', interactionType: 'property', interactionName: 'temp', httpMethod: 'GET', url: 'http://example.com/temp' },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases[0]?.requestBody, undefined);
  });

  it('maps action cases correctly', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        { id: 'invokeaction-toggle', name: 'testAction_toggle', interactionType: 'action', interactionName: 'toggle', httpMethod: 'POST', url: 'http://example.com/toggle' },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases.length, 1);
    assert.equal(result.testCases[0]?.functionName, 'testAction_toggle');
    assert.equal(result.testCases[0]?.interactionType, 'action');
  });

  it('orders property cases before action cases in the output', () => {
    const model: TestSuite = {
      thingId: 'Mixed',
      testCases: [
        { id: 'action-toggle', name: 'testAction_toggle', interactionType: 'action', interactionName: 'toggle' },
        { id: 'property-temp', name: 'testProperty_temp', interactionType: 'property', interactionName: 'temp', httpMethod: 'GET', url: '/temp' },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases.length, 1);
    assert.equal(result.testCases[0]?.interactionType, 'property');
  });

  it('sanitizes a function name with special characters', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        { id: 'property-my-prop', name: 'testProperty_my-prop', interactionType: 'property', interactionName: 'my-prop', httpMethod: 'GET', url: '/my-prop' },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases[0]?.functionName, 'testProperty_my_prop');
  });

  it('forwards securityScheme from TestCase to GenericTestCase', () => {
    const model: TestSuite = {
      thingId: 'SecThing',
      testCases: [
        { id: 'readproperty-temp', name: 'testReadProperty_temp', interactionType: 'property', interactionName: 'temp', httpMethod: 'GET', url: '/temp', securityScheme: 'nosec' },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases[0]?.securityScheme, 'nosec');
  });

  it('omits securityScheme from GenericTestCase when not set on TestCase', () => {
    const model: TestSuite = {
      thingId: 'PlainThing',
      testCases: [
        { id: 'readproperty-temp', name: 'testReadProperty_temp', interactionType: 'property', interactionName: 'temp', httpMethod: 'GET', url: '/temp' },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases[0]?.securityScheme, undefined);
  });

  it('forwards expectedStatus from TestCase to GenericTestCase', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        { id: 'writeproperty-level-belowMinimum', name: 'testWriteProperty_level_belowMinimum', interactionType: 'property', interactionName: 'level', httpMethod: 'PUT', url: '/level', requestBody: '4', expectedStatus: 400 },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases[0]?.expectedStatus, 400);
  });

  it('omits expectedStatus from GenericTestCase when not set on TestCase', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        { id: 'readproperty-temp', name: 'testReadProperty_temp', interactionType: 'property', interactionName: 'temp', httpMethod: 'GET', url: '/temp' },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases[0]?.expectedStatus, undefined);
  });

  it('maps responseSchema with numeric bounds to expectedResponseBodyMinimum and expectedResponseBodyMaximum', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        {
          id: 'invokeaction-getLevel',
          name: 'testAction_getLevel',
          interactionType: 'action',
          interactionName: 'getLevel',
          httpMethod: 'POST',
          url: 'http://example.com/getLevel',
          responseSchema: { type: 'integer', minimum: 0, maximum: 100 },
        },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases.length, 1);
    assert.equal(result.testCases[0]?.expectedResponseBodyMinimum, 0);
    assert.equal(result.testCases[0]?.expectedResponseBodyMaximum, 100);
  });

  it('omits expectedResponseBodyMinimum and expectedResponseBodyMaximum when responseSchema has no numeric bounds', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        {
          id: 'invokeaction-getStatus',
          name: 'testAction_getStatus',
          interactionType: 'action',
          interactionName: 'getStatus',
          httpMethod: 'POST',
          url: 'http://example.com/getStatus',
          responseSchema: { type: 'string' },
        },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases[0]?.expectedResponseBodyMinimum, undefined);
    assert.equal(result.testCases[0]?.expectedResponseBodyMaximum, undefined);
  });

  it('omits expectedResponseBodyMinimum and expectedResponseBodyMaximum when no responseSchema', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        { id: 'invokeaction-toggle', name: 'testAction_toggle', interactionType: 'action', interactionName: 'toggle', httpMethod: 'POST', url: '/toggle' },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases[0]?.expectedResponseBodyMinimum, undefined);
    assert.equal(result.testCases[0]?.expectedResponseBodyMaximum, undefined);
  });

  it('expands a numeric write property with bounds into four boundary GenericTestCases', () => {
    const model: TestSuite = {
      thingId: 'BoundaryThing',
      testCases: [
        { id: 'writeproperty-brightness', name: 'testWriteProperty_brightness', interactionType: 'property', interactionName: 'brightness', httpMethod: 'PUT', url: '/brightness', dataSchema: { type: 'integer', minimum: 10, maximum: 100 } },
      ],
    };
    const result = generateGenericTestSuite(model);
    assert.equal(result.testCases.length, 5);
    assert.equal(result.testCases[0]?.expectedStatus, 200);
    assert.equal(result.testCases[1]?.expectedStatus, 400);
    assert.equal(result.testCases[2]?.expectedStatus, 200);
    assert.equal(result.testCases[3]?.expectedStatus, 400);
    assert.equal(result.testCases[4]?.expectedStatus, 400);
  });

  it('forwards propertyPath to GenericTestCase', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        {
          id: 'writeproperty-temp',
          name: 'testWriteProperty_temp',
          interactionType: 'property',
          interactionName: 'temp',
          httpMethod: 'PUT',
          url: '/temp',
          propertyPath: 'status.brightness',
        },
      ],
    };

    const result = generateGenericTestSuite(model);

    assert.equal(result.testCases[0]?.propertyPath, 'status.brightness');
  });
  it('maps responseSchema with string length bounds to expectedResponseBodyMinLength and expectedResponseBodyMaxLength', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        {
          id: 'invokeaction-getName',
          name: 'testAction_getName',
          interactionType: 'action',
          interactionName: 'getName',
          httpMethod: 'POST',
          url: 'http://example.com/getName',
          responseSchema: { type: 'string', minLength: 3, maxLength: 10 },
        },
      ],
    };

    const result = generateGenericTestSuite(model);

    assert.equal(result.testCases.length, 1);
    assert.equal(result.testCases[0]?.expectedResponseBodyMinLength, 3);
    assert.equal(result.testCases[0]?.expectedResponseBodyMaxLength, 10);
  });

  it('omits expectedResponseBodyMinLength and expectedResponseBodyMaxLength when not present', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        {
          id: 'invokeaction-getName',
          name: 'testAction_getName',
          interactionType: 'action',
          interactionName: 'getName',
          httpMethod: 'POST',
          url: 'http://example.com/getName',
          responseSchema: { type: 'string' },
        },
      ],
    };

    const result = generateGenericTestSuite(model);

    assert.equal(result.testCases[0]?.expectedResponseBodyMinLength, undefined);
    assert.equal(result.testCases[0]?.expectedResponseBodyMaxLength, undefined);
  });

  it('maps responseSchema with array bounds to expectedResponseBodyMinItems and expectedResponseBodyMaxItems', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        {
          id: 'invokeaction-getList',
          name: 'testAction_getList',
          interactionType: 'action',
          interactionName: 'getList',
          httpMethod: 'POST',
          url: 'http://example.com/getList',
          responseSchema: { type: 'array', minItems: 1, maxItems: 5 },
        },
      ],
    };

    const result = generateGenericTestSuite(model);

    assert.equal(result.testCases.length, 1);
    assert.equal(result.testCases[0]?.expectedResponseBodyMinItems, 1);
    assert.equal(result.testCases[0]?.expectedResponseBodyMaxItems, 5);
  });

  it('omits expectedResponseBodyMinItems and expectedResponseBodyMaxItems when not present', () => {
    const model: TestSuite = {
      thingId: 'MyThing',
      testCases: [
        {
          id: 'invokeaction-getList',
          name: 'testAction_getList',
          interactionType: 'action',
          interactionName: 'getList',
          httpMethod: 'POST',
          url: 'http://example.com/getList',
          responseSchema: { type: 'array' },
        },
      ],
    };

    const result = generateGenericTestSuite(model);

    assert.equal(result.testCases[0]?.expectedResponseBodyMinItems, undefined);
    assert.equal(result.testCases[0]?.expectedResponseBodyMaxItems, undefined);
  });
});

