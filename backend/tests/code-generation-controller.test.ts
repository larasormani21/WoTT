import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { GenericTestSuite } from '../model/index.js';
import { generateTestSuiteCode } from '../code-generators/code-generation-controller.js';

const suite: GenericTestSuite = {
  thingId: 'urn:x:y:thing',
  suiteName: 'thingTestSuite',
  testCases: [
    {
      id: 'property-temp',
      functionName: 'testProperty_temp',
      description: 'testProperty_temp',
      interactionType: 'property',
      interactionName: 'temp',
    },
  ],
};

describe('generateCode', () => {
  it('generates JavaScript code for a suite with a property', () => {
    const code = generateTestSuiteCode(suite, 'javascript');
    assert.ok(typeof code === 'string' && code.length > 0);
    assert.ok(code.includes("describe('thingTestSuite'"));
    assert.ok(code.includes("it('testProperty_temp'"));
  });

  it('generates empty describe block for a suite with no test cases', () => {
    const empty: GenericTestSuite = { thingId: 'x', suiteName: 'xTestSuite', testCases: [] };
    const code = generateTestSuiteCode(empty, 'javascript');
    assert.ok(code.includes("describe('xTestSuite'"));
  });
});
