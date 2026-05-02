export type Language = 'javascript';

export const SUPPORTED_LANGUAGES: Language[] = ['javascript'];

export const DEFAULT_LANGUAGE: Language = 'javascript';

export function isSupportedLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as string[]).includes(value);
}
