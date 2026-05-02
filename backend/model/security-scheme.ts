export interface NoSecurityScheme {
  scheme: 'nosec';
}

export type SecurityScheme = NoSecurityScheme | { scheme: string };
