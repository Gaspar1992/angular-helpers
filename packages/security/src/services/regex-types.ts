export interface RegexSecurityConfig {
  timeout?: number; // Timeout in milliseconds (default: 5000)
  maxComplexity?: number; // Maximum complexity allowed
  allowBacktracking?: boolean; // Allow catastrophic backtracking
  safeMode?: boolean; // Safe mode with secure patterns only
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
