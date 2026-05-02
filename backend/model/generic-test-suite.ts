import type { TdDataSchema } from "./td-types.js";

export type GenericInteractionType = 'property' | 'action';

export interface GenericTestCase {
  id: string;
  functionName: string;
  description: string;
  interactionType: GenericInteractionType;
  interactionName: string;
  httpMethod?: string;
  url?: string;
  requestBody?: string;
  responseSchema?: TdDataSchema;
  propertyPath?: string;
  securityScheme?: string;
  expectedStatus?: number;
  expectedResponseBodyMinimum?: number;
  expectedResponseBodyMaximum?: number;
  expectedResponseBodyMinLength?: number;
  expectedResponseBodyMaxLength?: number;
  expectedResponseBodyMinItems?: number;
  expectedResponseBodyMaxItems?: number;
}

export interface GenericTestSuite {
  thingId: string;
  suiteName: string;
  testCases: GenericTestCase[];
}
