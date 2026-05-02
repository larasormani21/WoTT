export const VALID_TD = JSON.stringify({
  "@context": ['https://www.w3.org/ns/wot-next/td'],
  title: 'MyThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  properties: {
    temperature: { type: 'number', forms: [{ href: '/temp' }] }
  },
  actions: {
    toggle: { forms: [{ href: '/toggle' }] }
  }
}, null, 2)

export const EMPTY_TD = JSON.stringify({
  "@context": ['https://www.w3.org/ns/wot-next/td'],
  title: 'MyThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc'
}, null, 2)

export const TD_WITH_READ_PROPERTY = JSON.stringify({
  "@context": ['https://www.w3.org/ns/wot-next/td'],
  title: 'MyThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  properties: {
    temperature: {
      type: 'number',
      forms: [{ href: '/temp', op: 'readproperty' }],
    },
  },
}, null, 2)

export const TD_WITH_WRITE_ONLY_PROPERTIES = JSON.stringify({
  "@context": ['https://www.w3.org/ns/wot-next/td'],
  title: 'MyThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  properties: {
    actuator: {
      type: 'boolean',
      writeOnly: true,
      forms: [{ href: '/act', op: 'writeproperty' }],
    },
  },
}, null, 2)

export const TD_WITH_NOSEC = JSON.stringify({
  "@context": ['https://www.w3.org/ns/wot-next/td'],
  title: 'NoSecThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  properties: {
    temperature: { type: 'number', forms: [{ href: '/temp' }] },
  },
}, null, 2)

export const TD_WITH_WRITE_PROPERTY = JSON.stringify({
  '@context': ['https://www.w3.org/ns/wot-next/td'],
  title: 'WriteThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  properties: {
    actuator: {
      type: 'boolean',
      forms: [{ href: '/act', op: 'writeproperty' }],
    },
  },
}, null, 2)

export const TD_WITH_READ_ONLY_PROPERTIES = JSON.stringify({
  '@context': ['https://www.w3.org/ns/wot-next/td'],
  title: 'ReadOnlyThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  properties: {
    temperature: {
      type: 'number',
      readOnly: true,
      forms: [{ href: '/temp', op: 'readproperty' }],
    },
  },
}, null, 2)

export const TD_WITH_INVOKE_ACTION_WITH_BINDING = JSON.stringify({
  '@context': ['https://www.w3.org/ns/wot-next/td'],
  title: 'InvokeThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  actions: {
    toggle: {
      forms: [{
        href: '/toggle', op: 'invokeaction', 
        'htv:methodName': 'GET', contentType: "application/json"
      }],
    },
  },
}, null, 2)

export const TD_WITH_INVOKE_ACTION_WITHOUT_BINDING = JSON.stringify({
  '@context': ['https://www.w3.org/ns/wot-next/td'],
  title: 'InvokeThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  actions: {
    toggle: {
      input: { type: 'boolean' },
      forms: [{
        href: '/toggle'
      }],
    },
  },
}, null, 2)

export const TD_WITH_NUMERIC_BOUNDS_PROPERTY = JSON.stringify({
  '@context': ['https://www.w3.org/ns/wot-next/td'],
  title: 'BoundaryThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  properties: {
    brightness: {
      type: 'integer',
      minimum: 10,
      maximum: 100,
      forms: [{ href: '/brightness', op: 'writeproperty' }],
    },
  },
}, null, 2)

export const TD_WITH_NUMERIC_PROPERTY_NO_BOUNDS = JSON.stringify({
  '@context': ['https://www.w3.org/ns/wot-next/td'],
  title: 'NoBoundaryThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  properties: {
    count: {
      type: 'integer',
      forms: [{ href: '/count', op: 'writeproperty' }],
    },
  },
}, null, 2)

export const TD_WITH_DATA_LENGTH_BOUNDS_PROPERTY = JSON.stringify({
  '@context': ['https://www.w3.org/ns/wot-next/td'],
  title: 'BoundaryThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  properties: {
    name: {
      type: 'string',
      minLength: 5,
      maxLength: 20,
      forms: [{ href: '/name', op: 'writeproperty' }],
    },
  },
}, null, 2)

export const TD_WITH_STRING_PROPERTY_NO_BOUNDS = JSON.stringify({
  '@context': ['https://www.w3.org/ns/wot-next/td'],
  title: 'NoBoundaryThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  properties: {
    name: {
      type: 'string',
      forms: [{ href: '/name', op: 'writeproperty' }],
    },
  },
}, null, 2)


export const TD_WITH_PROPERTIES_DATA_TYPES = JSON.stringify({
  '@context': ['https://www.w3.org/ns/wot-next/td'],
  title: 'DataTypeThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  properties: {
    readProperty: { type: 'string', readOnly: true, 
      forms: [{ href: '/readString', op: 'readproperty' }] },
    writeProperty: { type: 'number', writeOnly: true, 
      forms: [{ href: '/writeNumber', op: 'writeproperty' }] }}}, null, 2)
      
export const TD_WITH_ACTIONS_INPUT_DATA_TYPES = JSON.stringify({
  '@context': ['https://www.w3.org/ns/wot-next/td'],
  title: 'DataTypeThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  actions: {
    actionWithInput: { 
      input: { type: 'boolean' },
      forms: [{ href: '/actionWithBooleanInput'}] }}}, null, 2)

export const TD_WITH_ACTIONS_OUTPUT_DATA_TYPES = JSON.stringify({
  '@context': ['https://www.w3.org/ns/wot-next/td'],
  title: 'DataTypeThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  actions: {
    actionWithOutput: {
      input: { type: 'number' },
      output: { type: 'string' },
      forms: [{ href: '/actionWithStringOutput'}] }}}, null, 2)

export const TD_WITH_NO_DATA_TYPES = JSON.stringify({
  '@context': ['https://www.w3.org/ns/wot-next/td'],
  title: 'DataTypeThing',
  base: 'http://example.com',
  securityDefinitions: { nosec_sc: { scheme: 'nosec' } },
  security: 'nosec_sc',
  properties: {
    readProperty: { readOnly: true, 
      forms: [{ href: '/readString', op: 'readproperty' }] },
    writeProperty: { writeOnly: true, 
      forms: [{ href: '/writeNumber', op: 'writeproperty' }] }}}, null, 2)
      