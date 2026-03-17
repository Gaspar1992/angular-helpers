export interface RegexSecurityConfig {
  timeout?: number; // Timeout en milisegundos (default: 5000)
  maxComplexity?: number; // Máxima complejidad permitida
  allowBacktracking?: boolean; // Permitir backtracking catastrófico
  safeMode?: boolean; // Modo seguro solo con patrones seguros
}

export interface RegexTestResult {
  match: boolean;
  matches?: RegExpMatchArray[];
  groups?: { [key: string]: string };
  executionTime: number;
  timeout: boolean;
  error?: string;
}

export interface RegexSecurityResult {
  safe: boolean;
  complexity: number;
  risk: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
  recommendations: string[];
}

export interface RegexBuilderOptions {
  global?: boolean;
  ignoreCase?: boolean;
  multiline?: boolean;
  dotAll?: boolean;
  unicode?: boolean;
  sticky?: boolean;
}
