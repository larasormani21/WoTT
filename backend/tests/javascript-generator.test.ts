import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { GenericTestSuite, TdDataSchema } from '../model/index.js';
import { generateJavaScriptTestSuite } from '../code-generators/generators/javascript-generator.js';

function makeCase(functionName: string, type: 'property' | 'action', url?: string, httpMethod?: string, requestBody?: string, securityScheme?: string, interactionName?: string, responseSchema?: TdDataSchema, expectedStatus?: number) {
  return {
    id: `${type}-${functionName}`,
    functionName,
    description: functionName,
    interactionType: type,
    interactionName: interactionName ?? functionName,
    ...(url !== undefined ? { url } : {}),
    ...(httpMethod !== undefined ? { httpMethod } : {}),
    ...(requestBody !== undefined ? { requestBody } : {}),
    ...(responseSchema !== undefined ? { responseSchema } : {}),
    ...(securityScheme !== undefined ? { securityScheme } : {}),
    ...(expectedStatus !== undefined ? { expectedStatus } : {}),
  };
}

describe('generateJavaScript', () => {
  it('includes the node:test import statement', () => {
    const suite: GenericTestSuite = { thingId: 'x', suiteName: 'xTestSuite', testCases: [] };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes("import { describe, it } from 'node:test';"));
  });

  it('wraps output in a describe block named after the suite', () => {
    const suite: GenericTestSuite = { thingId: 'x', suiteName: 'MyTestSuite', testCases: [] };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes("describe('MyTestSuite'"));
  });

  it('emits no inner describe blocks for an empty suite', () => {
    const suite: GenericTestSuite = { thingId: 'x', suiteName: 'xTestSuite', testCases: [] };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(!code.includes("describe('Properties'"));
    assert.ok(!code.includes("describe('Actions'"));
  });

  it('emits Properties block but not Actions when only properties exist', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testProperty_temp', 'property', 'http://example.com/temp', 'GET')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes("describe('Properties'"));
    assert.ok(!code.includes("describe('Actions'"));
    assert.ok(code.includes("it('testProperty_temp'"));
  });

  it('emits Actions block but not Properties when only actions exist', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testAction_toggle', 'action')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(!code.includes("describe('Properties'"));
    assert.ok(code.includes("describe('Actions'"));
    assert.ok(code.includes("it('testAction_toggle'"));
  });

  it('emits both blocks in order (Properties before Actions) for a mixed suite', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [
        makeCase('testProperty_temp', 'property', 'http://example.com/temp', 'GET'),
        makeCase('testAction_toggle', 'action'),
      ],
    };
    const code = generateJavaScriptTestSuite(suite);
    const propIdx = code.indexOf("describe('Properties'");
    const actIdx = code.indexOf("describe('Actions'");
    assert.ok(propIdx !== -1 && actIdx !== -1);
    assert.ok(propIdx < actIdx);
  });

  it('generates an async fetch call for a property with url and httpMethod', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testProperty_temp', 'property', 'http://example.com/temp', 'GET')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes("async ()"), `Expected async test function, got: ${code}`);
    assert.ok(code.includes("await fetch('http://example.com/temp')"), `Expected fetch call, got: ${code}`);
    assert.ok(code.includes('assert.strictEqual(response.status, 200)'), `Expected status assertion, got: ${code}`);
  });

  it('generates response body type assertions for a responseSchema', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testProperty_temp', 'property', 'http://example.com/temp', 'GET', undefined, undefined, undefined, { type: 'number' })],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes('const body = await response.json();'), `Expected body parsing, got: ${code}`);
    assert.ok(code.includes("assert.strictEqual(typeof body, 'number')"), `Expected number assertion, got: ${code}`);
  });

  it('generates response body type assertions for string responseSchema', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testProperty_name', 'property', 'http://example.com/name', 'GET', undefined, undefined, undefined, { type: 'string' })],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes('const body = await response.json();'), `Expected body parsing, got: ${code}`);
    assert.ok(code.includes("assert.strictEqual(typeof body, 'string')"), `Expected string assertion, got: ${code}`);
  });

  it('generates response assertions for various schema types', () => {
  const cases = [
    { type: 'integer', expected: "Number.isInteger(body)" },
    { type: 'boolean', expected: "typeof body, 'boolean'" },
    { type: 'array', expected: "Array.isArray(body)" },
    { type: 'object', expected: "typeof body, 'object'" },
    { type: 'null', expected: "body, null" },
  ];

  for (const c of cases) {
    const suite: GenericTestSuite = {
      thingId: 'x',
      suiteName: 'xTestSuite',
      testCases: [
        makeCase(
          `test_${c.type}`,
          'property',
          'http://example.com/test',
          'GET',
          undefined,
          undefined,
          undefined,
          { type: c.type }
        ),
      ],
    };

    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes('const body = await response.json();'));
    assert.ok(code.includes(c.expected), `Missing assertion for type ${c.type}`);
  }
});

  it('generates object type assertions with null and array guards for object responseSchema', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testProperty_config', 'property', 'http://example.com/config', 'GET', undefined, undefined, undefined, { type: 'object' })],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes("assert.strictEqual(typeof body, 'object')"), `Expected object type assertion, got: ${code}`);
    assert.ok(code.includes("body !== null && !Array.isArray(body)"), `Expected null/array guard, got: ${code}`);
  });

  it('generates a generic existence assertion for a responseSchema with no type', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testProperty_unknown', 'property', 'http://example.com/unknown', 'GET', undefined, undefined, undefined, {})],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes("body !== undefined, 'Expected response body'"), `Expected default assertion, got: ${code}`);
  });

  it('generates a PUT fetch with method, headers and body for a write property', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testWriteProperty_actuator', 'property', 'http://example.com/act', 'PUT', 'true')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes("method: 'PUT'"), `Expected PUT method, got: ${code}`);
    assert.ok(code.includes("'Content-Type': 'application/json'"), `Expected Content-Type header, got: ${code}`);
    assert.ok(code.includes('body: JSON.stringify(true)'), `Expected body serialization, got: ${code}`);
    assert.ok(code.includes('assert.strictEqual(response.status, 200)'), `Expected status assertion, got: ${code}`);
  });

  it('generates a negative-input test that expects rejection', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testWriteProperty_actuator_invalidType', 'property', 'http://example.com/act', 'PUT', '"invalid"', undefined, undefined, undefined, 400)],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes('assert.strictEqual(response.status, 400)'), `Expected rejection assertion, got: ${code}`);
    assert.ok(!code.includes('assert.strictEqual(response.status, 200)'), `Unexpected positive success assertion in negative test, got: ${code}`);
  });

  it('generates a negative-input GET action test with invalid query parameter', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testAction_getStatus_invalidType', 'action', 'http://example.com/getStatus?value=42', 'GET', undefined, undefined, undefined, undefined, 400)],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes("await fetch('http://example.com/getStatus?value=42')"), `Expected invalid query fetch, got: ${code}`);
    assert.ok(code.includes('assert.strictEqual(response.status, 400)'), `Expected rejection assertion, got: ${code}`);
  });

  it('imports assert when there are HTTP test cases', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testProperty_temp', 'property', 'http://example.com/temp', 'GET')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes("import assert from 'node:assert/strict'"), `Expected assert import, got: ${code}`);
  });

  it('imports assert when there are only write test cases', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testWriteProperty_actuator', 'property', 'http://example.com/act', 'PUT', 'true')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes("import assert from 'node:assert/strict'"), `Expected assert import, got: ${code}`);
  });

  it('does not import assert when no HTTP test cases exist', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testAction_toggle', 'action')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(!code.includes("import assert"), `Expected no assert import, got: ${code}`);
  });

  it('includes TODO placeholder for action stubs', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testAction_toggle', 'action')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes('// TODO: implement'));
  });

  it('generates no Authorization header for nosec test cases', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testReadProperty_temp', 'property', 'http://example.com/temp', 'GET', undefined, 'nosec')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(!code.includes('Authorization'), `Expected no Authorization header, got: ${code}`);
    assert.ok(code.includes("await fetch('http://example.com/temp')"), `Expected plain fetch call, got: ${code}`);
  });

  it('generates no API key parameter for nosec test cases', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testReadProperty_temp', 'property', 'http://example.com/temp', 'GET', undefined, 'nosec')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(!code.toLowerCase().includes('x-api-key'), `Expected no API key, got: ${code}`);
    assert.ok(!code.toLowerCase().includes('apikey'), `Expected no apikey, got: ${code}`);
  });

  it('emits a no-security comment above the fetch call for nosec test cases', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testReadProperty_temp', 'property', 'http://example.com/temp', 'GET', undefined, 'nosec')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes('// No security required'), `Expected no-security comment, got: ${code}`);
    const commentIndex = code.indexOf('// No security required');
    const fetchIndex = code.indexOf('await fetch(');
    assert.ok(commentIndex < fetchIndex, `Expected no-security comment to appear before fetch call, got: ${code}`);
  });

  it('emits an unsupported-scheme TODO comment above the fetch call when securityScheme is not nosec', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testReadProperty_temp', 'property', 'http://example.com/temp', 'GET', undefined, 'bearer')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes('// TODO: bearer security scheme not yet supported'), `Expected TODO comment, got: ${code}`);
    assert.ok(code.includes('await fetch('), `Expected fetch call to still be present for unsupported scheme, got: ${code}`);
    const commentIndex = code.indexOf('// TODO: bearer security scheme not yet supported');
    const fetchIndex = code.indexOf('await fetch(');
    assert.ok(commentIndex < fetchIndex, `Expected TODO comment to appear before fetch call, got: ${code}`);
  });

  it('nests tests for the same property under a single describe with the interactionName', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [
        makeCase('testWriteProperty_brightness_minimumBoundary', 'property', '/brightness', 'PUT', '10', undefined, 'brightness'),
        makeCase('testWriteProperty_brightness_belowMinimum', 'property', '/brightness', 'PUT', '9', undefined, 'brightness'),
      ],
    };
    const code = generateJavaScriptTestSuite(suite);
    const brightnessDescIdx = code.indexOf("describe('brightness'");
    assert.ok(brightnessDescIdx !== -1, `Expected describe('brightness') block`);
    const minBoundaryIdx = code.indexOf("it('testWriteProperty_brightness_minimumBoundary'");
    const belowMinIdx = code.indexOf("it('testWriteProperty_brightness_belowMinimum'");
    assert.ok(minBoundaryIdx > brightnessDescIdx, `Expected minimumBoundary it() inside describe('brightness')`);
    assert.ok(belowMinIdx > brightnessDescIdx, `Expected belowMinimum it() inside describe('brightness')`);
    assert.equal((code.match(/describe\('brightness'/g) ?? []).length, 1, `Expected exactly one describe('brightness')`);
  });

  it('emits one inner describe per distinct interactionName in source order', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [
        makeCase('testReadProperty_temp', 'property', '/temp', 'GET', undefined, undefined, 'temp'),
        makeCase('testWriteProperty_brightness', 'property', '/brightness', 'PUT', '50', undefined, 'brightness'),
        makeCase('testReadProperty_humidity', 'property', '/humidity', 'GET', undefined, undefined, 'humidity'),
      ],
    };
    const code = generateJavaScriptTestSuite(suite);
    const tempIdx = code.indexOf("describe('temp'");
    const brightnessIdx = code.indexOf("describe('brightness'");
    const humidityIdx = code.indexOf("describe('humidity'");
    assert.ok(tempIdx !== -1 && brightnessIdx !== -1 && humidityIdx !== -1, `Expected all three interaction describes`);
    assert.ok(tempIdx < brightnessIdx, `Expected temp before brightness`);
    assert.ok(brightnessIdx < humidityIdx, `Expected brightness before humidity`);
  });

  it('nests action boundary tests under a describe with the action interactionName', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [
        makeCase('testAction_setLevel_minimumBoundary', 'action', '/setLevel', 'POST', '10', undefined, 'setLevel'),
        makeCase('testAction_setLevel_belowMinimum', 'action', '/setLevel', 'POST', '9', undefined, 'setLevel'),
      ],
    };
    const code = generateJavaScriptTestSuite(suite);
    const actionsDescIdx = code.indexOf("describe('Actions'");
    const setLevelDescIdx = code.indexOf("describe('setLevel'");
    assert.ok(setLevelDescIdx > actionsDescIdx, `Expected describe('setLevel') to be nested inside describe('Actions')`);
    assert.equal((code.match(/describe\('setLevel'/g) ?? []).length, 1, `Expected exactly one describe('setLevel')`);
  });

  it('nested interaction describe is inside the matching interaction-type describe', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testReadProperty_temp', 'property', '/temp', 'GET', undefined, undefined, 'temp')],
    };
    const code = generateJavaScriptTestSuite(suite);
    const propertiesIdx = code.indexOf("describe('Properties'");
    const tempIdx = code.indexOf("describe('temp'");
    const itIdx = code.indexOf("it('testReadProperty_temp'");
    assert.ok(propertiesIdx < tempIdx, `Expected describe('Properties') before describe('temp')`);
    assert.ok(tempIdx < itIdx, `Expected describe('temp') before it('testReadProperty_temp')`);
  });

  it('emits response body boundary assertions when expectedResponseBodyMinimum and expectedResponseBodyMaximum are set', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [{
        ...makeCase('testAction_getLevel', 'action', '/getLevel', 'POST', '{}', undefined, 'getLevel'),
        expectedResponseBodyMinimum: 0,
        expectedResponseBodyMaximum: 100,
      }],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes('const body = await response.json();'), 'Expected body parse line');
    assert.ok(code.includes("assert.ok(body >= 0, 'Response body below minimum bound (0)');"), 'Expected minimum assertion');
    assert.ok(code.includes("assert.ok(body <= 100, 'Response body above maximum bound (100)');"), 'Expected maximum assertion');
  });

  it('emits only minimum assertion when only expectedResponseBodyMinimum is set', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [{
        ...makeCase('testAction_getLevel', 'action', '/getLevel', 'POST', undefined, undefined, 'getLevel'),
        expectedResponseBodyMinimum: 5,
      }],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(code.includes('const body = await response.json();'), 'Expected body parse line');
    assert.ok(code.includes("assert.ok(body >= 5,"), 'Expected minimum assertion');
    assert.ok(!code.includes('body <='), 'Expected no maximum assertion');
  });

  it('does not emit response body assertions when expectedResponseBodyMinimum and expectedResponseBodyMaximum are absent', () => {
    const suite: GenericTestSuite = {
      thingId: 'x', suiteName: 'xTestSuite',
      testCases: [makeCase('testAction_toggle', 'action', '/toggle', 'POST', undefined, undefined, 'toggle')],
    };
    const code = generateJavaScriptTestSuite(suite);
    assert.ok(!code.includes('response.json()'), 'Expected no body parse line');
    assert.ok(!code.includes('body >='), 'Expected no minimum assertion');
    assert.ok(!code.includes('body <='), 'Expected no maximum assertion');
  });
});
