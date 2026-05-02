import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ThingDescription } from '../model/index.js';
import { createTestSuiteMetamodel, enumerateLeafSubProperties } from '../td-processing/td-parser.js';

describe('createTestSuiteMetamodel', () => {
  it('returns empty testCases for a TD with no properties or actions', () => {
    const td: ThingDescription = { title: 'Empty', security: 'nosec' };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.thingId, 'Empty');
    assert.deepEqual(suite.testCases, []);
  });

  it('uses td.id as thingId when present', () => {
    const td: ThingDescription = { title: 'MyThing', id: 'urn:example:myThing', security: 'nosec' };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.thingId, 'urn:example:myThing');
  });

  it('falls back to td.title when id is absent', () => {
    const td: ThingDescription = { title: 'FallbackThing', security: 'nosec' };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.thingId, 'FallbackThing');
  });

  it('includes a property with op: readproperty as a read test case with GET', () => {
    const td: ThingDescription = {
      title: 'PropThing',
      security: 'nosec',  
      properties: {
        temperature: { type: 'number', forms: [{ href: '/temp', op: 'readproperty' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [tc] = suite.testCases;
    assert.ok(tc);
    assert.equal(tc.id, 'readproperty-temperature');
    assert.equal(tc.name, 'testReadProperty_temperature');
    assert.equal(tc.interactionType, 'property');
    assert.equal(tc.interactionName, 'temperature');
    assert.equal(tc.httpMethod, 'GET');
    assert.equal(tc.dataSchema, undefined);
    assert.equal(tc.responseSchema?.type, 'number');
    assert.equal(tc.requestBody, undefined);
  });

  it('includes a property with op: writeproperty as a write test case with PUT and dataSchema', () => {
    const td: ThingDescription = {
      title: 'WriteOnly',
      security: 'nosec',
      properties: {
        actuator: { type: 'boolean', forms: [{ href: '/act', op: 'writeproperty' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [tc] = suite.testCases;
    assert.ok(tc);
    assert.equal(tc.id, 'writeproperty-actuator');
    assert.equal(tc.name, 'testWriteProperty_actuator');
    assert.equal(tc.httpMethod, 'PUT');
    assert.ok(tc.url !== undefined);
    assert.ok(tc.dataSchema !== undefined, 'dataSchema should be set for handler to use');
    assert.equal(tc.requestBody, undefined, 'parser must not set requestBody — that is the handler\'s job');
  });

  it('includes a writeOnly: true property as a write test case with dataSchema', () => {
    const td: ThingDescription = {
      title: 'WriteOnlyImplicit',
      base: 'http://example.com',
      security: 'nosec',
      properties: {
        actuator: { type: 'boolean', writeOnly: true, forms: [{ href: '/act' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [tc] = suite.testCases;
    assert.ok(tc);
    assert.equal(tc.httpMethod, 'PUT');
    assert.equal(tc.url, 'http://example.com/act');
    assert.ok(tc.dataSchema !== undefined);
    assert.equal(tc.requestBody, undefined);
  });

  it('includes a property with no op (defaults to both readable and writable) as two test cases', () => {
    const td: ThingDescription = {
      title: 'DefaultOp',
      base: 'http://example.com',
      security: 'nosec',
      properties: {
        humidity: { type: 'number', forms: [{ href: '/hum' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 2);
    assert.equal(suite.testCases[0]?.httpMethod, 'GET');
    assert.equal(suite.testCases[1]?.httpMethod, 'PUT');
    assert.ok(suite.testCases[1]?.dataSchema !== undefined);
  });

  it('includes a property with op array containing both ops as two test cases', () => {
    const td: ThingDescription = {
      title: 'ArrayOp',
      security: 'nosec',
      properties: {
        temp: { type: 'number', forms: [{ href: '/temp', op: ['readproperty', 'writeproperty'] }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 2);
    assert.equal(suite.testCases[0]?.httpMethod, 'GET');
    assert.equal(suite.testCases[0]?.id, 'readproperty-temp');
    assert.equal(suite.testCases[1]?.httpMethod, 'PUT');
    assert.equal(suite.testCases[1]?.id, 'writeproperty-temp');
  });

  it('resolves url using base + href for read case', () => {
    const td: ThingDescription = {
      title: 'BaseThing',
      security: 'nosec',
      base: 'http://example.com',
      properties: {
        temperature: { type: 'number', forms: [{ href: '/temp', op: 'readproperty' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.url, 'http://example.com/temp');
  });

  it('resolves url using base + href for write case', () => {
    const td: ThingDescription = {
      title: 'BaseThing',
      security: 'nosec',
      base: 'http://example.com',
      properties: {
        actuator: { type: 'boolean', forms: [{ href: '/act', op: 'writeproperty' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.url, 'http://example.com/act');
  });

  it('uses href as-is when no base is present', () => {
    const td: ThingDescription = {
      title: 'NoBase',
      security: 'nosec',
      properties: {
        temperature: { type: 'number', forms: [{ href: '/temp', op: 'readproperty' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.url, '/temp');
  });

  it('does not double-slash when base ends with / and href starts with /', () => {
    const td: ThingDescription = {
      title: 'SlashThing',
      security: 'nosec',
      base: 'http://example.com/',
      properties: {
        temp: { type: 'number', forms: [{ href: '/temp', op: 'readproperty' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.url, 'http://example.com/temp');
  });

  it('uses an absolute href as-is even when base is present', () => {
    const td: ThingDescription = {
      title: 'AbsoluteHref',
      security: 'nosec',
      base: 'http://example.com',
      properties: {
        temp: { type: 'number', forms: [{ href: 'http://other.com/temp', op: 'readproperty' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.url, 'http://other.com/temp');
  });

  it('prepends a slash when href has no leading slash and base is present', () => {
    const td: ThingDescription = {
      title: 'NoSlashHref',
      security: 'nosec',
      base: 'http://example.com',
      properties: {
        temp: { type: 'number', forms: [{ href: 'temp', op: 'readproperty' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.url, 'http://example.com/temp');
  });

  it('produces a test case stub without url when a property has no forms', () => {
    const td: ThingDescription = {
      title: 'NoForms',
      security: 'nosec',
      properties: {
        status: { type: 'string' },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    assert.equal(suite.testCases[0]?.id, 'readproperty-status');
    assert.equal(suite.testCases[0]?.url, undefined);
    assert.equal(suite.testCases[0]?.httpMethod, undefined);
  });

  it('maps actions to test cases with correct id, name and interactionType', () => {
    const td: ThingDescription = {
      title: 'ActionThing',
      security: 'nosec',
      actions: {
        toggle: { forms: [{ href: '/toggle' }] },
        reset: { forms: [{ href: '/reset' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 2);

    const [first] = suite.testCases;
    assert.ok(first);
    assert.equal(first.id, 'invokeaction-toggle');
    assert.equal(first.name, 'testAction_toggle');
    assert.equal(first.interactionType, 'action');
    assert.equal(first.interactionName, 'toggle');
    assert.equal(first.httpMethod, 'POST');
    assert.equal(first.url, '/toggle');
    assert.deepEqual(first.dataSchema, undefined);
  });

  it('explodes an object property with sub-properties into one read test per leaf', () => {
    const td: ThingDescription = {
      title: 'ObjectProp',
      security: 'nosec',
      base: 'https://mylamp.example.com',
      properties: {
        status: {
          type: 'object',
          properties: {
            brightness: { type: 'number', minimum: 0, maximum: 100 },
            rgb: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
          },
          forms: [{ href: '/status', op: 'readproperty' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 2);

    const [brightness, rgb] = suite.testCases;
    assert.ok(brightness);
    assert.equal(brightness.id, 'readproperty-status-brightness');
    assert.equal(brightness.name, 'testReadProperty_status_brightness');
    assert.equal(brightness.httpMethod, 'GET');
    assert.equal(brightness.url, 'https://mylamp.example.com/status');
    assert.equal(brightness.propertyPath, 'brightness');

    assert.ok(rgb);
    assert.equal(rgb.id, 'readproperty-status-rgb');
    assert.equal(rgb.name, 'testReadProperty_status_rgb');
    assert.equal(rgb.httpMethod, 'GET');
    assert.equal(rgb.url, 'https://mylamp.example.com/status');
    assert.equal(rgb.propertyPath, 'rgb');
  });

  it('explodes an object property with sub-properties into one write test per leaf', () => {
    const td: ThingDescription = {
      title: 'ObjectProp',
      security: 'nosec',
      base: 'https://mylamp.example.com',
      properties: {
        status: {
          type: 'object',
          properties: {
            brightness: { type: 'number', minimum: 0, maximum: 100 },
            rgb: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
          },
          forms: [{ href: '/status', op: 'writeproperty' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 2);

    const [brightness, rgb] = suite.testCases;
    assert.ok(brightness);
    assert.equal(brightness.id, 'writeproperty-status-brightness');
    assert.equal(brightness.name, 'testWriteProperty_status_brightness');
    assert.equal(brightness.httpMethod, 'PUT');
    assert.equal(brightness.url, 'https://mylamp.example.com/status');
    assert.equal(brightness.propertyPath, 'brightness');
    assert.deepEqual(brightness.dataSchema, { type: 'number', minimum: 0, maximum: 100 });

    assert.ok(rgb);
    assert.equal(rgb.id, 'writeproperty-status-rgb');
    assert.equal(rgb.propertyPath, 'rgb');
    assert.deepEqual(rgb.dataSchema, { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 });
  });

  it('produces both read and write tests per leaf for a readable+writable object property', () => {
    const td: ThingDescription = {
      title: 'RW',
      security: 'nosec',
      base: 'https://mylamp.example.com',
      properties: {
        status: {
          type: 'object',
          properties: {
            brightness: { type: 'number', minimum: 0, maximum: 100 },
            rgb: { type: 'array', items: { type: 'number' }, minItems: 3, maxItems: 3 },
          },
          forms: [{ href: '/status' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    // 2 reads + 2 writes = 4
    assert.equal(suite.testCases.length, 4);
    assert.equal(suite.testCases.filter(tc => tc.httpMethod === 'GET').length, 2);
    assert.equal(suite.testCases.filter(tc => tc.httpMethod === 'PUT').length, 2);
    // All point to the same URL
    assert.ok(suite.testCases.every(tc => tc.url === 'https://mylamp.example.com/status'));
  });

  it('recurses into deeply nested object sub-properties', () => {
    const td: ThingDescription = {
      title: 'Deep',
      security: 'nosec',
      properties: {
        device: {
          type: 'object',
          properties: {
            status: {
              type: 'object',
              properties: {
                brightness: { type: 'number' },
              },
            },
          },
          forms: [{ href: '/device', op: 'readproperty' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [tc] = suite.testCases;
    assert.ok(tc);
    assert.equal(tc.id, 'readproperty-device-status-brightness');
    assert.equal(tc.propertyPath, 'status.brightness');
  });

  it('uses htv:methodName from readproperty form when specified', () => {
    const td: ThingDescription = {
      title: 'BindingRead',
      security: 'nosec',
      properties: {
        status: {
          type: 'string',
          forms: [{ href: '/status', 'htv:methodName': 'POST', op: 'readproperty' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    assert.equal(suite.testCases[0]?.httpMethod, 'POST');
  });

  it('uses htv:methodName from writeproperty form and preserves dataSchema', () => {
    const td: ThingDescription = {
      title: 'BindingWrite',
      security: 'nosec',
      properties: {
        actuator: {
          type: 'boolean',
          forms: [{ href: '/act', 'htv:methodName': 'POST', op: 'writeproperty' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [tc] = suite.testCases;
    assert.ok(tc);
    assert.equal(tc.httpMethod, 'POST');
    assert.ok(tc.dataSchema !== undefined);
  });

  it('normalizes lowercase htv:methodName to uppercase', () => {
    const td: ThingDescription = {
      title: 'LowercaseMethod',
      security: 'nosec',
      properties: {
        temp: {
          type: 'number',
          forms: [{ href: '/temp', 'htv:methodName': 'get', op: 'readproperty' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.httpMethod, 'GET');
  });

  it('htv:methodName PATCH with no op produces a single write test case', () => {
    const td: ThingDescription = {
      title: 'BindingPatch',
      security: 'nosec',
      properties: {
        actuator: {
          type: 'boolean',
          forms: [{ href: '/act', 'htv:methodName': 'PATCH' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    assert.equal(suite.testCases[0]?.httpMethod, 'PATCH');
    assert.equal(suite.testCases[0]?.id, 'writeproperty-actuator');
  });

  it('htv:methodName GET with no op produces a single read test case (ignores readOnly/writeOnly defaults)', () => {
    const td: ThingDescription = {
      title: 'BindingGet',
      security: 'nosec',
      properties: {
        status: {
          type: 'string',
          forms: [{ href: '/status', 'htv:methodName': 'GET' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    assert.equal(suite.testCases[0]?.httpMethod, 'GET');
    assert.equal(suite.testCases[0]?.id, 'readproperty-status');
  });

  it('orders property cases before action cases', () => {
    const td: ThingDescription = {
      title: 'MixedThing',
      security: 'nosec',
      properties: { temp: { type: 'number', forms: [{ href: '/temp', op: 'readproperty' }] } },
      actions: { toggle: { forms: [{ href: '/toggle' }] } },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 2);
    assert.equal(suite.testCases[0]?.interactionType, 'property');
    assert.equal(suite.testCases[1]?.interactionType, 'action');
  });

  it('sets securityScheme to nosec when root security references a nosec definition', () => {
    const td: ThingDescription = {
      title: 'SecThing',
      securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
      security: 'nosec_sc',
      properties: { temp: { type: 'number', forms: [{ href: '/temp', op: 'readproperty' }] } },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.securityScheme, 'nosec');
  });

  it('resolves scheme type from securityDefinitions, not the reference key name', () => {
    const td: ThingDescription = {
      title: 'SecThing',
      securityDefinitions: { my_custom_key: { scheme: 'nosec' } },
      security: 'my_custom_key',
      properties: { temp: { type: 'number', forms: [{ href: '/temp', op: 'readproperty' }] } },
    };
    const suite = createTestSuiteMetamodel(td);
    // scheme is 'nosec', not 'my_custom_key'
    assert.equal(suite.testCases[0]?.securityScheme, 'nosec');
  });

  it('uses form-level security when it overrides root-level security', () => {
    const td: ThingDescription = {
      title: 'FormSecThing',
      securityDefinitions: {
        nosec_sc: { scheme: 'nosec' },
        bearer_sc: { scheme: 'bearer' },
      },
      security: 'nosec_sc',
      properties: {
        temp: { type: 'number', forms: [{ href: '/temp', op: 'readproperty', security: 'bearer_sc' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.securityScheme, 'bearer');
  });

  it('falls back to root security when a form has no security override', () => {
    const td: ThingDescription = {
      title: 'FallbackThing',
      securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
      security: 'nosec_sc',
      properties: {
        temp: { type: 'number', forms: [{ href: '/temp', op: 'readproperty' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.securityScheme, 'nosec');
  });

  it('resolves security on write test cases using the same priority rules', () => {
    const td: ThingDescription = {
      title: 'WriteSecThing',
      securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
      security: 'nosec_sc',
      properties: {
        actuator: { type: 'boolean', forms: [{ href: '/act', op: 'writeproperty' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.securityScheme, 'nosec');
  });

  it('resolves security on action test cases from the action form, falling back to root', () => {
    const td: ThingDescription = {
      title: 'ActionSecThing',
      securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
      security: 'nosec_sc',
      actions: {
        toggle: { forms: [{ href: '/toggle' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.securityScheme, 'nosec');
  });

  it('defaults securityScheme to nosec when securityDefinitions is absent', () => {
    const td: ThingDescription = {
      title: 'NoDefsThing',
      security: 'nosec',
      properties: { temp: { type: 'number', forms: [{ href: '/temp', op: 'readproperty' }] } },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases[0]?.securityScheme, 'nosec');
  });

  it('generates POST for action with form and no idempotent or htv:methodName', () => {
    const td: ThingDescription = {
      title: 'ActionPost',
      security: 'nosec',
      actions: {
        toggle: { forms: [{ href: '/toggle' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [testCase] = suite.testCases;
    assert.ok(testCase);
    assert.equal(testCase.httpMethod, 'POST');
    assert.equal(testCase.url, '/toggle');
  });

  it('generates PUT for action with idempotent: true and no htv:methodName', () => {
    const td: ThingDescription = {
      title: 'ActionPut',
      security: 'nosec',
      actions: {
        reset: { idempotent: true, forms: [{ href: '/reset' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [testCase] = suite.testCases;
    assert.ok(testCase);
    assert.equal(testCase.httpMethod, 'PUT');
    assert.equal(testCase.url, '/reset');
  });

  it('uses htv:methodName when specified, ignoring idempotent', () => {
    const td: ThingDescription = {
      title: 'ActionMethod',
      security: 'nosec',
      actions: {
        toggle: { idempotent: true, forms: [{ href: '/toggle', 'htv:methodName': 'PATCH' }] },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [testCase] = suite.testCases;
    assert.ok(testCase);
    assert.equal(testCase.httpMethod, 'PATCH');
    assert.equal(testCase.url, '/toggle');
  });

  it('attaches input schema as dataSchema for action test case', () => {
    const td: ThingDescription = {
      title: 'ActionInput',
      security: 'nosec',
      actions: {
        setTemp: {
          input: { type: 'number', minimum: 0 },
          forms: [{ href: '/setTemp' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [testCase] = suite.testCases;
    assert.ok(testCase);
    assert.deepEqual(testCase.dataSchema, { type: 'number', minimum: 0 });
    assert.equal(testCase.responseSchema, undefined);
  });

  it('attaches output schema as responseSchema for action test case', () => {
    const td: ThingDescription = {
      title: 'ActionOutput',
      security: 'nosec',
      actions: {
        getStatus: {
          output: { type: 'boolean' },
          forms: [{ href: '/status' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [testCase] = suite.testCases;
    assert.ok(testCase);
    assert.deepEqual(testCase.responseSchema, { type: 'boolean' });
    assert.equal(testCase.dataSchema, undefined);
  });

  it('appends a form index to test case ids when an action has multiple forms', () => {
    const td: ThingDescription = {
      title: 'MultiFormAction',
      security: 'nosec',
      actions: {
        trigger: {
          forms: [
            { href: '/trigger/primary' },
            { href: '/trigger/secondary' },
          ],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 2);
    const [first, second] = suite.testCases;
    assert.ok(first);
    assert.ok(second);
    assert.equal(first.id, 'invokeaction-trigger-0');
    assert.equal(second.id, 'invokeaction-trigger-1');
    assert.equal(first.url, '/trigger/primary');
    assert.equal(second.url, '/trigger/secondary');
  });

  it('generates a test case for an action form with explicit invokeaction op', () => {
    const td: ThingDescription = {
      title: 'ExplicitOpAction',
      security: 'nosec',
      actions: {
        activate: {
          forms: [{ href: '/activate', op: 'invokeaction' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [testCase] = suite.testCases;
    assert.ok(testCase);
    assert.equal(testCase.id, 'invokeaction-activate');
    assert.equal(testCase.url, '/activate');
    assert.equal(testCase.httpMethod, 'POST');
  });

  it('generates stub action test case when no forms', () => {
    const td: ThingDescription = {
      title: 'ActionNoForms',
      security: 'nosec',
      actions: {
        toggle: {},
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [testCase] = suite.testCases;
    assert.ok(testCase);
    assert.equal(testCase.id, 'invokeaction-toggle');
    assert.equal(testCase.url, undefined);
    assert.equal(testCase.httpMethod, undefined);
  });

  it('carries action output schema as responseSchema on the test case', () => {
    const td: ThingDescription = {
      title: 'OutputAction',
      security: 'nosec',
      actions: {
        getLevel: {
          output: { type: 'integer', minimum: 0, maximum: 100 },
          forms: [{ href: '/getLevel' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [testCase] = suite.testCases;
    assert.ok(testCase);
    assert.deepEqual(testCase.responseSchema, { type: 'integer', minimum: 0, maximum: 100 });
  });

  it('does not set responseSchema when action has no output', () => {
    const td: ThingDescription = {
      title: 'NoOutputAction',
      security: 'nosec',
      actions: {
        toggle: {
          forms: [{ href: '/toggle' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    const [testCase] = suite.testCases;
    assert.ok(testCase);
    assert.equal(testCase.responseSchema, undefined);
  });

  it('produces a fallback stub test case when a property has forms with non-read/write operations', () => {
    const td: ThingDescription = {
      title: 'ObserveThing',
      security: 'nosec',
      properties: {
        temperature: {
          type: 'number',
          forms: [{ href: '/temperature', op: 'observeproperty' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    assert.equal(suite.testCases.length, 1);
    const [testCase] = suite.testCases;
    assert.ok(testCase);
    assert.equal(testCase.id, 'readproperty-temperature');
    assert.equal(testCase.url, undefined);
    assert.equal(testCase.httpMethod, undefined);
  });

  it('defaults securityScheme to nosec when root security is an empty array', () => {
    const td: ThingDescription = {
      title: 'NoSecThing',
      security: [],
      properties: {
        level: {
          type: 'integer',
          forms: [{ href: '/level' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    const [testCase] = suite.testCases;
    assert.ok(testCase);
    assert.equal(testCase.securityScheme, 'nosec');
  });

  it('returns a single read test case for an object property with no properties defined', () => {
    const td: ThingDescription = {
      title: 'UnstructuredObject',
      security: 'nosec',
      properties: {
        payload: {
          type: 'object',
          forms: [{ href: '/payload' }],
        },
      },
    };
    const suite = createTestSuiteMetamodel(td);
    const readCase = suite.testCases.find(tc => tc.id === 'readproperty-payload');
    assert.ok(readCase);
    assert.equal(readCase.url, '/payload');
    assert.equal(readCase.propertyPath, undefined);
  });
});

describe('enumerateLeafSubProperties', () => {
  it('returns a single entry for a primitive schema with no sub-properties', () => {
    const result = enumerateLeafSubProperties({ type: 'number' });
    assert.deepEqual(result, [{ path: '', schema: { type: 'number' } }]);
  });
});
