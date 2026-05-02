import type { ThingDescription, TdPropertyAffordance,TdActionAffordance, TdDataSchema, TdForm, TestSuite, TestCase } from '../model/index.js';

const ABSOLUTE_URL_PATTERN = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//;

function formOperations(form: TdForm): string[] {
  if (form.op === undefined) return [];
  return Array.isArray(form.op) ? form.op : [form.op];
}

/**
 * Determines whether a form exposes the `readproperty` operation.
 *
 * Per the WoT spec, when a form has no explicit `op`, the default operation
 * for a property form is `readproperty` (and optionally `writeproperty`).
 * The only exception is when the parent property is marked `writeOnly: true`,
 * in which case reading is not allowed even without an explicit op.
 */
function isReadableForm(form: TdForm, property: TdPropertyAffordance): boolean {
  const ops = formOperations(form);
  if (ops.length === 0) {
    // Per WoT TD 2.0: an explicit binding method takes precedence over readOnly/writeOnly defaults.
    // GET unambiguously means readproperty; any other method means writeproperty.
    if (form['htv:methodName'] !== undefined) return form['htv:methodName'].toUpperCase() === 'GET';
    return !property.writeOnly;
  }
  return ops.map(op => op.toLowerCase()).includes('readproperty');
}

function isWritableForm(form: TdForm, property: TdPropertyAffordance): boolean {
  const ops = formOperations(form);
  if (ops.length === 0) {
    if (form['htv:methodName'] !== undefined) return form['htv:methodName'].toUpperCase() !== 'GET';
    return !property.readOnly;
  }
  return ops.map(op => op.toLowerCase()).includes('writeproperty');
}

function findReadableForm(property: TdPropertyAffordance): TdForm | undefined {
  return (property.forms ?? []).find(form => isReadableForm(form, property));
}

function findWritableForm(property: TdPropertyAffordance): TdForm | undefined {
  return (property.forms ?? []).find(form => isWritableForm(form, property));
}

function resolveHttpMethod(form: TdForm, defaultMethod: string): string {
  return form['htv:methodName']?.toUpperCase() ?? defaultMethod;
}

/**
 * Recursively enumerates leaf sub-properties of an object schema.
 * For a primitive schema (or an object with no nested `properties`), returns
 * a single entry with an empty path and the schema itself.
 * For `type: object` schemas with `properties`, recurses into each child,
 * joining names with `.` to produce dot-paths for each leaf.
 */
export function enumerateLeafSubProperties(
  schema: TdDataSchema,
  prefix: string = '',
): Array<{ path: string; schema: TdDataSchema }> {
  if (schema.type === 'object' && schema.properties !== undefined) {
    return Object.entries(schema.properties).flatMap(([key, childSchema]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return enumerateLeafSubProperties(childSchema, path);
    });
  }
  return [{ path: prefix, schema }];
}

function buildReadPropertyTestId(propertyName: string, subPropertyPath?: string): string {
  return subPropertyPath
    ? `readproperty-${propertyName}-${subPropertyPath.replace(/\./g, '-')}`
    : `readproperty-${propertyName}`;
}

function buildReadPropertyTestName(propertyName: string, subPropertyPath?: string): string {
  return subPropertyPath
    ? `testReadProperty_${propertyName}_${subPropertyPath.replace(/\./g, '_')}`
    : `testReadProperty_${propertyName}`;
}

function buildWritePropertyTestId(propertyName: string, subPropertyPath?: string): string {
  return subPropertyPath
    ? `writeproperty-${propertyName}-${subPropertyPath.replace(/\./g, '-')}`
    : `writeproperty-${propertyName}`;
}

function buildWritePropertyTestName(propertyName: string, subPropertyPath?: string): string {
  return subPropertyPath
    ? `testWriteProperty_${propertyName}_${subPropertyPath.replace(/\./g, '_')}`
    : `testWriteProperty_${propertyName}`;
}

/**
 * Resolves the security scheme type for a form, applying form-level override over root-level default.
 * Form-level security takes precedence; if absent, root-level security applies.
 * The resolved reference key is then looked up in securityDefinitions to return the scheme type.
 */
function resolveSecuritySchemeForForm(
  form: TdForm,
  rootSecurity: string | string[],
  securityDefinitions: Record<string, unknown>,
): string {
  const securityReference = form.security ?? rootSecurity;
  const firstReference = Array.isArray(securityReference) ? securityReference[0] : securityReference;
  if (firstReference === undefined) return 'nosec';
  const definition = securityDefinitions[firstReference] as { scheme?: string } | undefined;
  return definition?.scheme ?? 'nosec';
}

function resolveEndpointUrl(base: string | undefined, href: string): string {
  if (!base) return href;
  if (ABSOLUTE_URL_PATTERN.test(href)) return href;
  const baseWithoutTrailingSlash = base.endsWith('/') ? base.slice(0, -1) : base;
  const hrefWithLeadingSlash = href.startsWith('/') ? href : '/' + href;
  return baseWithoutTrailingSlash + hrefWithLeadingSlash;
}

function toReadPropertyTestCase(
  name: string,
  property: TdPropertyAffordance,
  base: string | undefined,
  rootSecurity: string | string[],
  securityDefinitions: Record<string, unknown>,
): TestCase[] {
  const form = findReadableForm(property);
  if (form === undefined) return [];
  const url = resolveEndpointUrl(base, form.href);
  const httpMethod = resolveHttpMethod(form, 'GET');
  const securityScheme = resolveSecuritySchemeForForm(form, rootSecurity, securityDefinitions);

  if (property.type === 'object' && property.properties !== undefined) {
    return enumerateLeafSubProperties(property).map(({ path, schema }) => ({
      id: buildReadPropertyTestId(name, path),
      name: buildReadPropertyTestName(name, path),
      interactionType: 'property',
      interactionName: name,
      httpMethod,
      url,
      responseSchema: schema,
      propertyPath: path,
      securityScheme,
    }));
  }

  return [{
    id: buildReadPropertyTestId(name),
    name: buildReadPropertyTestName(name),
    interactionType: 'property',
    interactionName: name,
    httpMethod,
    url,
    responseSchema: property,
    securityScheme,
  }];
}

function toWritePropertyTestCase(
  name: string,
  property: TdPropertyAffordance,
  base: string | undefined,
  rootSecurity: string | string[],
  securityDefinitions: Record<string, unknown>,
): TestCase[] {
  const form = findWritableForm(property);
  if (form === undefined) return [];
  const url = resolveEndpointUrl(base, form.href);
  const httpMethod = resolveHttpMethod(form, 'PUT');
  const securityScheme = resolveSecuritySchemeForForm(form, rootSecurity, securityDefinitions);

  if (property.type === 'object' && property.properties !== undefined) {
    return enumerateLeafSubProperties(property).map(({ path, schema }) => ({
      id: buildWritePropertyTestId(name, path),
      name: buildWritePropertyTestName(name, path),
      interactionType: 'property',
      interactionName: name,
      httpMethod,
      url,
      dataSchema: schema,
      propertyPath: path,
      securityScheme,
    }));
  }

  return [{
    id: buildWritePropertyTestId(name),
    name: buildWritePropertyTestName(name),
    interactionType: 'property',
    interactionName: name,
    httpMethod,
    url,
    dataSchema: property,
    securityScheme,
  }];
}

function isInvokableForm(form: TdForm): boolean {
  const ops = formOperations(form);
  if (ops.length === 0) return true;
  return ops.map(op => op.toLowerCase()).includes('invokeaction');
}

function findInvokableForms(action: TdActionAffordance): TdForm[] {
  return (action.forms ?? []).filter(isInvokableForm);
}

function resolveHttpMethodForAction(form: TdForm, action: TdActionAffordance): string {
  if (form['htv:methodName'] !== undefined) {
    return form['htv:methodName'].toUpperCase();
  }
  return action.idempotent ? 'PUT' : 'POST';
}

function buildInvokeActionTestId(actionName: string, formIndex?: number): string {
  return formIndex !== undefined ? `invokeaction-${actionName}-${formIndex}` : `invokeaction-${actionName}`;
}

function buildInvokeActionTestName(actionName: string): string {
  return `testAction_${actionName}`;
}

function toInvokeActionTestCase(
  name: string,
  action: TdActionAffordance,
  base: string | undefined,
  rootSecurity: string | string[],
  securityDefinitions: Record<string, unknown>,
): TestCase[] {
  const forms = findInvokableForms(action);
  if (forms.length === 0) {
    return [{
      id: buildInvokeActionTestId(name),
      name: buildInvokeActionTestName(name),
      interactionType: 'action',
      interactionName: name,
    }];
  }

  return forms.map((form, index) => {
    const url = resolveEndpointUrl(base, form.href);
    const httpMethod = resolveHttpMethodForAction(form, action);
    const securityScheme = resolveSecuritySchemeForForm(form, rootSecurity, securityDefinitions);
    return {
      id: buildInvokeActionTestId(name, forms.length > 1 ? index : undefined),
      name: buildInvokeActionTestName(name),
      interactionType: 'action',
      interactionName: name,
      httpMethod,
      url,
      securityScheme,
      ...(action.input !== undefined ? { dataSchema: action.input } : {}),
      ...(action.output !== undefined ? { responseSchema: action.output } : {}),
    };
  });
}

export function createTestSuiteMetamodel(thingDescription: ThingDescription): TestSuite {
  const properties = thingDescription.properties ?? {};
  const actions = thingDescription.actions ?? {};
  const securityDefinitions = (thingDescription.securityDefinitions ?? {}) as Record<string, unknown>;
  const rootSecurity = thingDescription.security;

  const propertyCases = Object.entries(properties).flatMap(([name, property]) => {
    const cases: TestCase[] = [
      ...toReadPropertyTestCase(name, property, thingDescription.base, rootSecurity, securityDefinitions),
      ...toWritePropertyTestCase(name, property, thingDescription.base, rootSecurity, securityDefinitions),
    ];
    if (cases.length === 0) {
      const fallbackScheme = resolveSecuritySchemeForForm({ href: '' }, rootSecurity, securityDefinitions);
      cases.push({
        id: buildReadPropertyTestId(name),
        name: buildReadPropertyTestName(name),
        interactionType: 'property',
        interactionName: name,
        securityScheme: fallbackScheme,
      });
    }
    return cases;
  });

  const actionCases = Object.entries(actions).flatMap(([name, action]) =>
    toInvokeActionTestCase(name, action, thingDescription.base, rootSecurity, securityDefinitions),
  );

  return {
    thingId: thingDescription.id ?? thingDescription.title,
    testCases: [...propertyCases, ...actionCases],
  };
}
