import { Ajv } from "ajv";
import type { ErrorObject } from "ajv";
import type { ThingDescription, ValidationResult } from '../model/index.js';
import schema from '../schemas/wot-td-schema.json' with { type: 'json' };

function hasTestableElements(thingDescription: ThingDescription): boolean {
    return (
        Object.keys(thingDescription.properties ?? {}).length > 0 ||
        Object.keys(thingDescription.actions ?? {}).length > 0
    );
}

function securityReferenceError(instancePath: string, reference: string): ErrorObject {
    return {
        instancePath,
        schemaPath: '',
        params: { reference },
        keyword: 'securityReference',
        message: `Security reference "${reference}" does not match any key in securityDefinitions`,
    };
}

function validateSecurityReferences(td: ThingDescription): ErrorObject[] {
    const errors: ErrorObject[] = [];
    const definitionKeys = Object.keys(td.securityDefinitions!);

    const rootRefs = Array.isArray(td.security) ? td.security : [td.security];
    for (const ref of rootRefs) {
        if (!definitionKeys.includes(ref)) {
            errors.push(securityReferenceError('/security', ref));
        }
    }

    for (const [propertyName, property] of Object.entries(td.properties ?? {})) {
        for (const [formIndex, form] of property.forms!.entries()) {
            if (form.security === undefined) continue;
            const formRefs = Array.isArray(form.security) ? form.security : [form.security];
            for (const ref of formRefs) {
                if (!definitionKeys.includes(ref)) {
                    errors.push(securityReferenceError(`/properties/${propertyName}/forms/${formIndex}/security`, ref));
                }
            }
        }
    }

    for (const [actionName, action] of Object.entries(td.actions ?? {})) {
        for (const [formIndex, form] of action.forms!.entries()) {
            if (form.security === undefined) continue;
            const formRefs = Array.isArray(form.security) ? form.security : [form.security];
            for (const ref of formRefs) {
                if (!definitionKeys.includes(ref)) {
                    errors.push(securityReferenceError(`/actions/${actionName}/forms/${formIndex}/security`, ref));
                }
            }
        }
    }

    return errors;
}

export function validateTD(td: ThingDescription): ValidationResult {
    const ajv = new Ajv({ strict: false });
    const validate = ajv.compile(schema);
    const valid = validate(td);

    if (!valid) {
        // AJV always populates errors when validation fails
        return { valid: false, errors: validate.errors! };
    }

    const securityErrors = validateSecurityReferences(td);
    if (securityErrors.length > 0) {
        return { valid: false, errors: securityErrors };
    }

    if (!hasTestableElements(td)) {
        return {
            valid: false,
            errors: [{
                instancePath: "",
                schemaPath: "",
                params: {},
                keyword: "testableElements",
                message: "Thing Description must have at least one property or action to be testable."
            }]
        };
    }
    return { valid: true };
}