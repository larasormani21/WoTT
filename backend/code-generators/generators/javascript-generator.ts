import type { GenericTestSuite, GenericTestCase, GenericInteractionType, TdDataSchema } from '../../model/index.js';

const DESCRIBE_BLOCK_LABEL: Record<GenericInteractionType, string> = {
  property: 'Properties',
  action: 'Actions',
};

function createSecurityComment(securityScheme: string | undefined): string {
  if (securityScheme === undefined || securityScheme === 'nosec') {
    return `        // No security required`;
  }
  return `        // TODO: ${securityScheme} security scheme not yet supported`;
}

function createResponseBodyBoundaryAssertions(tc: GenericTestCase): string[] {
  const lines: string[] = [];
  if (tc.expectedResponseBodyMinimum !== undefined) {
    lines.push(`        assert.ok(body >= ${tc.expectedResponseBodyMinimum}, 'Response body below minimum bound (${tc.expectedResponseBodyMinimum})');`);
  }
  if (tc.expectedResponseBodyMaximum !== undefined) {
    lines.push(`        assert.ok(body <= ${tc.expectedResponseBodyMaximum}, 'Response body above maximum bound (${tc.expectedResponseBodyMaximum})');`);
  }
  if (tc.expectedResponseBodyMinLength !== undefined) {
    lines.push(`        assert.ok(body.length >= ${tc.expectedResponseBodyMinLength}, 'Response body shorter than minLength');`);
  }

  if (tc.expectedResponseBodyMaxLength !== undefined) {
    lines.push(`        assert.ok(body.length <= ${tc.expectedResponseBodyMaxLength}, 'Response body longer than maxLength');`);
  }

  if (tc.expectedResponseBodyMinItems !== undefined) {
    lines.push(`        assert.ok(body.length >= ${tc.expectedResponseBodyMinItems}, 'Array has fewer items than minItems');`);
  }

  if (tc.expectedResponseBodyMaxItems !== undefined) {
    lines.push(`        assert.ok(body.length <= ${tc.expectedResponseBodyMaxItems}, 'Array has more items than maxItems');`);
  }
  return lines;
}

function createTypeAssertionLines(responseSchema: TdDataSchema): string[] {
  const schema = responseSchema as { type?: string };
  switch (schema.type) {
    case 'integer':
    case 'number':
      return [
        `        assert.strictEqual(typeof body, 'number');`,
        schema.type === 'integer'
          ? `        assert.ok(Number.isInteger(body), 'Expected integer response');`
          : `        assert.ok(!Number.isNaN(body), 'Expected numeric response');`,
      ];
    case 'boolean':
      return [`        assert.strictEqual(typeof body, 'boolean');`];
    case 'string':
      return [`        assert.strictEqual(typeof body, 'string');`];
    case 'array':
      return [`        assert.ok(Array.isArray(body), 'Expected array response');`];
    case 'object':
      return [
        `        assert.strictEqual(typeof body, 'object');`,
        `        assert.ok(body !== null && !Array.isArray(body), 'Expected object response');`,
      ];
    case 'null':
      return [`        assert.strictEqual(body, null);`];
    default:
      return [`        assert.ok(body !== undefined, 'Expected response body');`];
  }
}

function createTestCase(tc: GenericTestCase): string {
  if (tc.url !== undefined && tc.httpMethod !== undefined) {
    const securityComment = createSecurityComment(tc.securityScheme);
    const bodyBoundaryAssertions = createResponseBodyBoundaryAssertions(tc);
    const isNegativeTest = tc.expectedStatus !== undefined && tc.expectedStatus >= 400;
    const typeAssertionLines = !isNegativeTest && tc.responseSchema !== undefined ? createTypeAssertionLines(tc.responseSchema) : [];
    const needsBodyParse = bodyBoundaryAssertions.length > 0 || typeAssertionLines.length > 0;
    const bodyParseStatement = needsBodyParse ? [`        const body = await response.json();`] : [];
    const bodyAssertions = [...bodyParseStatement, ...bodyBoundaryAssertions, ...typeAssertionLines];

    if (tc.requestBody !== undefined) {
      return [
        `      it('${tc.functionName}', async () => {`,
        securityComment,
        `        const response = await fetch('${tc.url}', {`,
        `          method: '${tc.httpMethod}',`,
        `          headers: { 'Content-Type': 'application/json' },`,
        `          body: JSON.stringify(${tc.requestBody}),`,
        `        });`,
        `        assert.strictEqual(response.status, ${tc.expectedStatus ?? 200});`,
        ...bodyAssertions,
        `      });`,
      ].join('\n');
    }

    return [
      `      it('${tc.functionName}', async () => {`,
      securityComment,
      `        const response = await fetch('${tc.url}');`,
      `        assert.strictEqual(response.status, ${tc.expectedStatus ?? 200});`,
      ...bodyAssertions,
      `      });`,
    ].join('\n');
  }
  return [
    `      it('${tc.functionName}', () => {`,
    `        // TODO: implement`,
    `      });`,
  ].join('\n');
}

function groupByInteractionName(testCases: GenericTestCase[]): Map<string, GenericTestCase[]> {
  const groups = new Map<string, GenericTestCase[]>();
  for (const testCase of testCases) {
    const existing = groups.get(testCase.interactionName);
    if (existing !== undefined) {
      existing.push(testCase);
    } else {
      groups.set(testCase.interactionName, [testCase]);
    }
  }
  return groups;
}

function createInteractionDescribeBlock(interactionName: string, testCases: GenericTestCase[]): string {
  const body = testCases.map(createTestCase).join('\n\n');
  return [`    describe('${interactionName}', () => {`, body, `    });`].join('\n');
}

function createDescribeBlock(interactionType: GenericInteractionType, genericTestCases: GenericTestCase[]): string {
  if (genericTestCases.length === 0) return '';
  const label = DESCRIBE_BLOCK_LABEL[interactionType];
  const groups = groupByInteractionName(genericTestCases);
  const body = Array.from(groups.entries())
    .map(([interactionName, tests]) => createInteractionDescribeBlock(interactionName, tests))
    .join('\n\n');
  return [`  describe('${label}', () => {`, body, `  });`].join('\n');
}

function hasHttpTestCases(suite: GenericTestSuite): boolean {
  return suite.testCases.some(tc => tc.url !== undefined && tc.httpMethod !== undefined);
}

/** Generates a JavaScript test file from a GenericTestSuite using node:test. */
export function generateJavaScriptTestSuite(suite: GenericTestSuite): string {
  const interactionTypes: GenericInteractionType[] = ['property', 'action'];

  const describeBlocks = interactionTypes
    .map(type => createDescribeBlock(type, suite.testCases.filter(tc => tc.interactionType === type)))
    .filter(block => block.length > 0)
    .join('\n\n');

  const imports = hasHttpTestCases(suite)
    ? [`import { describe, it } from 'node:test';`, `import assert from 'node:assert/strict';`]
    : [`import { describe, it } from 'node:test';`];

  return [
    ...imports,
    ``,
    `describe('${suite.suiteName}', () => {`,
    describeBlocks,
    `});`,
    ``,
  ].join('\n');
}
