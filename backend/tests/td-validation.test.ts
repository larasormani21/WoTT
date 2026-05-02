import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { ThingDescription } from '../model/index.js';
import { validateTD } from '../td-processing/td-validation.js';

const VALID_TD: ThingDescription = {
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
};

const INVALID_TD_NO_TESTABLE_ELEMENTS: ThingDescription = {
  "@context": ["https://www.w3.org/ns/wot-next/td"],
  title: 'MyThing',
  base: 'http://example.com',
  securityDefinitions: {
    "nosec_sc": {
      "scheme": "nosec"
    }
  },
  security: 'nosec_sc'}
describe('validateTD', () => {
    it('returns valid for a valid TD', () => {
        const result = validateTD(VALID_TD);
        assert.equal(result.valid, true);
        assert.equal(result.errors, undefined);
    });

    it('returns invalid for a TD without required fields', () => {
        const td = {"title" : "value", "security" : "nosec"} as ThingDescription;
        const result = validateTD(td);
        assert.equal(result.valid, false);
    });

    it('returns invalid for empty TD', () => {
        const td = {} as ThingDescription;
        const result = validateTD(td);
        assert.equal(result.valid, false);
    });

    it('returns invalid for a TD without testable elements', () => {
        const result = validateTD(INVALID_TD_NO_TESTABLE_ELEMENTS);
        assert.equal(result.valid, false);
        assert.ok(result.errors);
        assert.ok(result.errors?.some(err => err.keyword === 'testableElements'));
    });

    it('returns invalid when root security references a key not in securityDefinitions', () => {
        const td: ThingDescription = {
            "@context": ["https://www.w3.org/ns/wot-next/td"],
            title: 'BadRef',
            securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
            security: 'nonexistent',
            properties: { temp: { type: 'number', forms: [{ href: '/temp' }] } },
        };
        const result = validateTD(td);
        assert.equal(result.valid, false);
        assert.ok(result.errors?.some(err => err.keyword === 'securityReference'));
    });

    it('returns invalid when a property form security references an undefined key', () => {
        const td: ThingDescription = {
            "@context": ["https://www.w3.org/ns/wot-next/td"],
            title: 'BadFormRef',
            securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
            security: 'nosec_sc',
            properties: {
                temp: { type: 'number', forms: [{ href: '/temp', security: 'undefined_sc' }] },
            },
        };
        const result = validateTD(td);
        assert.equal(result.valid, false);
        assert.ok(result.errors?.some(err => err.keyword === 'securityReference'));
    });

    it('returns invalid when an action form security references an undefined key', () => {
        const td: ThingDescription = {
            "@context": ["https://www.w3.org/ns/wot-next/td"],
            title: 'BadActionRef',
            securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
            security: 'nosec_sc',
            actions: {
                toggle: { forms: [{ href: '/toggle', security: 'undefined_sc' }] },
            },
        };
        const result = validateTD(td);
        assert.equal(result.valid, false);
        assert.ok(result.errors?.some(err => err.keyword === 'securityReference'));
    });

    it('returns valid when all security references match securityDefinitions keys', () => {
        const td: ThingDescription = {
            "@context": ["https://www.w3.org/ns/wot-next/td"],
            title: 'AllValid',
            securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
            security: 'nosec_sc',
            properties: {
                temp: { type: 'number', forms: [{ href: '/temp', security: 'nosec_sc' }] },
            },
        };
        const result = validateTD(td);
        assert.equal(result.valid, true);
    });

    it('returns invalid when security is an array and one element references an undefined key', () => {
        const td: ThingDescription = {
            "@context": ["https://www.w3.org/ns/wot-next/td"],
            title: 'ArrayRef',
            securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
            security: ['nosec_sc', 'missing_sc'],
            properties: { temp: { type: 'number', forms: [{ href: '/temp' }] } },
        };
        const result = validateTD(td);
        assert.equal(result.valid, false);
        assert.ok(result.errors?.some(err => err.keyword === 'securityReference'));
    });

    it('returns invalid when a property form security is an array containing an undefined key', () => {
        const td: ThingDescription = {
            "@context": ["https://www.w3.org/ns/wot-next/td"],
            title: 'PropertyArrayBadRef',
            securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
            security: 'nosec_sc',
            properties: {
                temp: { type: 'number', forms: [{ href: '/temp', security: ['nosec_sc', 'missing_sc'] }] },
            },
        };
        const result = validateTD(td);
        assert.equal(result.valid, false);
        assert.ok(result.errors?.some(err => err.keyword === 'securityReference'));
    });

    it('returns invalid when an action form security is an array containing an undefined key', () => {
        const td: ThingDescription = {
            "@context": ["https://www.w3.org/ns/wot-next/td"],
            title: 'ActionArrayBadRef',
            securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
            security: 'nosec_sc',
            actions: {
                toggle: { forms: [{ href: '/toggle', security: ['nosec_sc', 'missing_sc'] }] },
            },
        };
        const result = validateTD(td);
        assert.equal(result.valid, false);
        assert.ok(result.errors?.some(err => err.keyword === 'securityReference'));
    });

    it('returns valid when action form security is a string matching a securityDefinitions key', () => {
        const td: ThingDescription = {
            "@context": ["https://www.w3.org/ns/wot-next/td"],
            title: 'ActionValidRef',
            securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
            security: 'nosec_sc',
            actions: {
                toggle: { forms: [{ href: '/toggle', security: 'nosec_sc' }] },
            },
        };
        const result = validateTD(td);
        assert.equal(result.valid, true);
    });
});