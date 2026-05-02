import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { tdRoutes } from '../routes/td-routes.js';

const VALID_TD = JSON.stringify({
  "@context": ["https://www.w3.org/ns/wot-next/td"],
  title: 'MyThing',
  base: 'http://example.com',
  securityDefinitions: {
    "nosec_sc": {
      "scheme": "nosec"
    }
  },
  security: 'nosec_sc',
  properties: {
    temperature: { type: 'number', forms: [{ href: '/temp' }] },
  },
  actions: {
    toggle: { forms: [{ href: '/toggle' }] },
  },
});

const EMPTY_TD = JSON.stringify({ title: 'EmptyThing' });

let server: FastifyInstance;

before(async () => {
  server = fastify();
  await server.register(tdRoutes);
  await server.ready();
});

after(async () => {
  await server.close();
});

describe('POST /api/td/generate', () => {
  it('returns 200 with generated JS code for a valid TD', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/td/generate',
      headers: { 'content-type': 'application/json' },
      body: VALID_TD,
    });
    assert.equal(res.statusCode, 200);
    assert.ok(res.headers['content-type']?.includes('text/plain'));
    assert.ok(res.body.includes('describe('));
    assert.ok(res.body.includes("import { describe, it } from 'node:test';"));
  });

  it('returns 400 when the TD is invalid', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/td/generate',
      headers: { 'content-type': 'application/json' },
      body: EMPTY_TD,
    });
    assert.equal(res.statusCode, 400);
  });

  it('returns code containing it() blocks for each property', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/td/generate',
      headers: { 'content-type': 'application/json' },
      body: VALID_TD,
    });
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.includes("it('testReadProperty_temperature'"));
  });

  it('returns 200 with JS code when language=javascript is specified', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/td/generate?language=javascript',
      headers: { 'content-type': 'application/json' },
      body: VALID_TD,
    });
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.includes("import { describe, it } from 'node:test';"));
  });

  it('returns 400 when an unsupported language is specified', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/td/generate?language=cobol',
      headers: { 'content-type': 'application/json' },
      body: VALID_TD,
    });
    assert.equal(res.statusCode, 400);
  });

  it('returns code with PUT request and body for a TD with writeproperty', async () => {
    const td = JSON.stringify({
      '@context': ['https://www.w3.org/ns/wot-next/td'],
      title: 'WriteThing',
      base: 'http://example.com',
      securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
      security: 'nosec_sc',
      properties: {
        actuator: { type: 'boolean', forms: [{ href: '/act', op: 'writeproperty' }] },
      },
    });
    const res = await server.inject({
      method: 'POST',
      url: '/api/td/generate',
      headers: { 'content-type': 'application/json' },
      body: td,
    });
    assert.equal(res.statusCode, 200);
    assert.ok(res.body.includes("method: 'PUT'"), `Expected PUT method in: ${res.body}`);
    assert.ok(res.body.includes('body: JSON.stringify('), `Expected body in: ${res.body}`);
  });
});

describe('POST /api/td/validate', () => {
  it('returns 200 with valid result for a valid TD', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/td/validate',
      headers: { 'content-type': 'application/json' },
      body: VALID_TD,
    });
    assert.equal(res.statusCode, 200);
    const result = JSON.parse(res.body);
    assert.equal(result.valid, true);
    assert.equal(result.errors, undefined);
  });
});
