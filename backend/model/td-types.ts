export interface TdForm {
  href: string;
  op?: string | string[];
  contentType?: string;
  'htv:methodName'?: string;
  security?: string | string[];
}

export interface TdDataSchema {
  type?: string;
  title?: string;
  description?: string;
  unit?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  const?: unknown;
  default?: unknown;
  enum?: unknown[];
  format?: string;
  oneOf?: TdDataSchema[];
  properties?: Record<string, TdDataSchema>;
  required?: string[];
  items?: TdDataSchema;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
  multipleOf?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  contentEncoding?: string;
  contentMediaType?: string;
  minItems?: number;
  maxItems?: number;
}

export interface TdPropertyAffordance extends TdDataSchema {
  forms?: TdForm[];
  observable?: boolean;
}

export interface TdActionAffordance {
  title?: string;
  description?: string;
  input?: TdDataSchema;
  output?: TdDataSchema;
  forms?: TdForm[];
  safe?: boolean;
  idempotent?: boolean;
  synchronous?: boolean;
}

export interface ThingDescription {
  '@context'?: string | unknown[];
  id?: string;
  '@type'?: string | string[];
  title: string;
  description?: string;
  securityDefinitions?: Record<string, unknown>;
  security: string | string[];
  base?: string;
  properties?: Record<string, TdPropertyAffordance>;
  actions?: Record<string, TdActionAffordance>;
  events?: Record<string, unknown>;
}
