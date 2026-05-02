import type { FastifyInstance, FastifyReply } from 'fastify';
import type { ThingDescription } from '../model/index.js';
import type { Language } from '../model/index.js';
import { isSupportedLanguage, DEFAULT_LANGUAGE } from '../model/index.js';
import { generateTestSuiteMetamodel, validateThingDescription } from '../td-processing/td-processing-controller.js';
import { generateGenericTestSuite } from '../test-generation/test-generator.js';
import { generateTestSuiteCode } from '../code-generators/code-generation-controller.js';


/** Registers the TD test-generation route (`POST /api/td/generate`). */
export async function tdRoutes(server: FastifyInstance): Promise<void> {
  server.post(
    '/api/td/generate',
    async (request, reply: FastifyReply) => {
      const query = request.query as Record<string, string | undefined>;
      const rawLanguage = query['language'];

      let language: Language;
      if (rawLanguage === undefined) {
        language = DEFAULT_LANGUAGE;
      } else if (isSupportedLanguage(rawLanguage)) {
        language = rawLanguage;
      } else {
        return reply.status(400).send({
          error: `Unsupported language: "${rawLanguage}". Supported languages: javascript.`,
        });
      }

      const thingDescription = request.body as ThingDescription;
      const testSuiteMetamodelResult = generateTestSuiteMetamodel(thingDescription);
      if (!testSuiteMetamodelResult.validationResult.valid) {
        return reply.status(400).send({
          error: 'Invalid Thing Description',
          errors: testSuiteMetamodelResult.validationResult.errors,
        });
      }
      const genericTestSuite = generateGenericTestSuite(testSuiteMetamodelResult.testSuite);
      
      const testSuite = generateTestSuiteCode(genericTestSuite, language);
      return reply.type('text/plain').send(testSuite);
    },
  );

  /** Registers the TD test-validation route (`POST /api/td/validate`). */
  server.post(
    '/api/td/validate',
    async (request, reply: FastifyReply) => {
      const thingDescription = request.body as ThingDescription;
      const result = validateThingDescription(thingDescription);
      return reply.send(result);
    },
  );
}
