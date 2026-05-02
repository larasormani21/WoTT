export type {
  TestSuite,
  TestSuiteResult,
  TestCase,
  InteractionType,
  ValidationResult,
} from './test-suite.js';

export type {
  ThingDescription,
  TdPropertyAffordance,
  TdActionAffordance,
  TdForm,
  TdDataSchema,
} from './td-types.js';

export type {
  GenericTestSuite,
  GenericTestCase,
  GenericInteractionType,
} from './generic-test-suite.js';

export type { Language } from './language.js';
export { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, isSupportedLanguage } from './language.js';

export type { SecurityScheme, NoSecurityScheme } from './security-scheme.js';