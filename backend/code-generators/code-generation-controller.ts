import type { GenericTestSuite } from '../model/index.js';
import type { Language } from '../model/index.js';
import { generateJavaScriptTestSuite } from './generators/javascript-generator.js';

export function generateTestSuiteCode(genericTestSuite: GenericTestSuite, language: Language): string {
  switch (language) {
    case 'javascript':
      return generateJavaScriptTestSuite(genericTestSuite);
  }
}
