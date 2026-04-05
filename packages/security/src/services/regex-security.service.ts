import { Injectable, inject, OnDestroy } from '@angular/core';
import {
  WorkerPoolService,
  type WorkerPoolConfig,
} from '../../../browser-web-apis/src/services/worker-pool.service';

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

/**
 * Security service for regular expressions that prevents ReDoS
 * using Web Workers for safe execution with timeout
 * Now uses WorkerPoolService for efficient worker management
 */
@Injectable()
export class RegexSecurityService implements OnDestroy {
  private workerPool = inject(WorkerPoolService);
  private readonly POOL_NAME = 'regex-security';
  private readonly POOL_CONFIG: WorkerPoolConfig = {
    maxWorkers: 2, // Max 2 workers for regex processing
    taskTimeout: 5000,
    lazy: true,
  };

  /**
   * Builder pattern to construct safe regular expressions
   */
  static builder(): RegexSecurityBuilder {
    return new RegexSecurityBuilder();
  }

  /**
   * Executes a regular expression safely with a timeout using worker pool
   */
  async testRegex(
    pattern: string,
    text: string,
    config: RegexSecurityConfig = {},
  ): Promise<RegexTestResult> {
    const startTime = performance.now();
    const finalConfig = this.mergeConfig(config);

    try {
      // First, analyze pattern security
      const securityCheck = await this.analyzePatternSecurity(pattern);

      if (!securityCheck.safe && !finalConfig.safeMode) {
        return {
          match: false,
          executionTime: performance.now() - startTime,
          timeout: false,
          error: `Pattern rejected: ${securityCheck.warnings.join(', ')}`,
        };
      }

      // Execute in pooled Web Worker
      const result = await this.executeInWorker(pattern, text, finalConfig);

      return {
        ...result,
        executionTime: performance.now() - startTime,
      };
    } catch (error) {
      return {
        match: false,
        executionTime: performance.now() - startTime,
        timeout: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Analyzes the security of a regular expression pattern
   */
  async analyzePatternSecurity(pattern: string): Promise<RegexSecurityResult> {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let complexity = 0;
    let risk: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Analysis of dangerous patterns
    const dangerousPatterns = [
      {
        pattern: /\*\*/,
        risk: 'high' as const,
        message: 'Nested quantifiers (catastrophic backtracking)',
      },
      { pattern: /\+\+/, risk: 'high' as const, message: 'Nested plus quantifiers' },
      { pattern: /\(\?\=/, risk: 'medium' as const, message: 'Lookahead assertions' },
      { pattern: /\(\?\!/, risk: 'medium' as const, message: 'Negative lookahead' },
      { pattern: /\(\?\:/, risk: 'low' as const, message: 'Non-capturing groups' },
      { pattern: /\(\?\</, risk: 'high' as const, message: 'Lookbehind assertions' },
      { pattern: /\(\?\(\?\)/, risk: 'critical' as const, message: 'Recursive patterns' },
      { pattern: /(\{(\d+,)?\d+\})/, risk: 'medium' as const, message: 'Quantified repetition' },
      {
        pattern: /(\.\*)|(\.+)|(\.\?)/,
        risk: 'medium' as const,
        message: 'Greedy quantifiers with dot',
      },
      {
        pattern: /(\[.*\*.*\])|(\[.*\+.*\])/,
        risk: 'medium' as const,
        message: 'Character classes with quantifiers',
      },
    ];

    // Calculate complexity
    complexity = this.calculateComplexity(pattern);

    // Evaluate dangerous patterns
    for (const dangerous of dangerousPatterns) {
      if (dangerous.pattern.test(pattern)) {
        warnings.push(dangerous.message);
        if (this.getRiskLevel(dangerous.risk) > this.getRiskLevel(risk)) {
          risk = dangerous.risk;
        }
      }
    }

    // Recommendations based on the analysis
    if (complexity > 10) {
      recommendations.push('Consider simplifying the pattern');
      risk = this.getRiskLevel(risk) > this.getRiskLevel('high') ? risk : 'high';
    }

    if (pattern.includes('**') || pattern.includes('++')) {
      recommendations.push('Avoid nested quantifiers to prevent catastrophic backtracking');
    }

    if (pattern.length > 100) {
      recommendations.push('Long patterns are harder to maintain and may impact performance');
    }

    const safe = risk !== 'critical' && warnings.length === 0;

    return {
      safe,
      complexity,
      risk,
      warnings,
      recommendations,
    };
  }

  /**
   * Executes the regular expression in a pooled Web Worker
   */
  private async executeInWorker(
    pattern: string,
    text: string,
    config: RegexSecurityConfig,
  ): Promise<RegexTestResult> {
    const workerFactory = () => {
      const workerCode = this.generateWorkerCode();
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      return new Worker(URL.createObjectURL(blob));
    };

    return this.workerPool.execute(
      this.POOL_NAME,
      workerFactory,
      {
        type: 'regex-test',
        payload: { pattern, text },
      },
      { ...this.POOL_CONFIG, taskTimeout: config.timeout },
    );
  }

  /**
   * Generates the Web Worker code
   */
  private generateWorkerCode(): string {
    return `
      self.addEventListener('message', function(event) {
        const task = event.data;
        
        if (task.type === 'regex-test') {
          const { pattern, text } = task.payload;
          const startTime = performance.now();
          
          try {
            const regex = new RegExp(pattern, 'g');
            const matches = [];
            let match;
            
            while ((match = regex.exec(text)) !== null) {
              matches.push([...match]);
              
              // Prevention of infinite loops
              if (matches.length > 1000) {
                throw new Error('Too many matches - possible infinite loop');
              }
            }
            
            const groups = {};
            if (matches.length > 0) {
              const firstMatch = matches[0];
              for (let i = 1; i < firstMatch.length; i++) {
                groups['group' + i] = firstMatch[i];
              }
            }
            
            self.postMessage({
              taskId: task.id,
              result: {
                match: matches.length > 0,
                matches,
                groups,
                executionTime: performance.now() - startTime,
                timeout: false
              }
            });
          } catch (error) {
            self.postMessage({
              taskId: task.id,
              result: {
                match: false,
                executionTime: performance.now() - startTime,
                timeout: false,
                error: error.message || 'Execution error'
              }
            });
          }
        }
      });
    `;
  }

  /**
   * Calculates the complexity of a pattern
   */
  private calculateComplexity(pattern: string): number {
    let complexity = 0;

    // Nested quantifiers increase complexity
    complexity += (pattern.match(/\*\*/g) || []).length * 5;
    complexity += (pattern.match(/\+\+/g) || []).length * 5;
    complexity += (pattern.match(/\?\?/g) || []).length * 3;

    // Lookaheads/lookbehinds
    complexity += (pattern.match(/\(\?\=/g) || []).length * 2;
    complexity += (pattern.match(/\(\?\!/g) || []).length * 2;
    complexity += (pattern.match(/\(\?\</g) || []).length * 3;

    // Nested groups
    const openParens = (pattern.match(/\(/g) || []).length;
    complexity += openParens * 0.5;

    // Pattern length
    complexity += pattern.length * 0.01;

    return Math.round(complexity * 100) / 100;
  }

  /**
   * Gets numeric risk level
   */
  private getRiskLevel(risk: 'low' | 'medium' | 'high' | 'critical'): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[risk] || 0;
  }

  /**
   * Merges configuration with default values
   */
  private mergeConfig(config: RegexSecurityConfig): Required<RegexSecurityConfig> {
    return {
      timeout: config.timeout || 5000,
      maxComplexity: config.maxComplexity || 10,
      allowBacktracking: config.allowBacktracking || false,
      safeMode: config.safeMode || false,
    };
  }

  /**
   * Cleans up resources when the service is destroyed
   */
  ngOnDestroy(): void {
    // WorkerPoolService handles cleanup of its pools
  }
}

/**
 * Builder pattern to construct safe regular expressions
 */
export class RegexSecurityBuilder {
  private patternValue: string = '';
  private optionsValue: RegexBuilderOptions = {};
  private securityConfigValue: RegexSecurityConfig = {};

  /**
   * Defines the base pattern
   */
  pattern(pattern: string): RegexSecurityBuilder {
    this.patternValue = pattern;
    return this;
  }

  /**
   * Appends text to the current pattern
   */
  append(text: string): RegexSecurityBuilder {
    this.patternValue += text;
    return this;
  }

  /**
   * Adds a capturing group
   */
  group(content: string, name?: string): RegexSecurityBuilder {
    if (name) {
      this.patternValue += `(?<${name}>${content})`;
    } else {
      this.patternValue += `(${content})`;
    }
    return this;
  }

  /**
   * Adds a non-capturing group
   */
  nonCapturingGroup(content: string): RegexSecurityBuilder {
    this.patternValue += `(?:${content})`;
    return this;
  }

  /**
   * Adds an alternative
   */
  or(alternative: string): RegexSecurityBuilder {
    this.patternValue += `|${alternative}`;
    return this;
  }

  /**
   * Adds a quantifier
   */
  quantifier(quantifier: '*' | '+' | '?' | '{n}' | '{n,}' | '{n,m}'): RegexSecurityBuilder {
    this.patternValue += quantifier;
    return this;
  }

  /**
   * Adds a character set
   */
  characterSet(chars: string, negate = false): RegexSecurityBuilder {
    this.patternValue += `[${negate ? '^' : ''}${chars}]`;
    return this;
  }

  /**
   * Adds a start of line anchor
   */
  startOfLine(): RegexSecurityBuilder {
    this.patternValue += '^';
    return this;
  }

  /**
   * Adds an end of line anchor
   */
  endOfLine(): RegexSecurityBuilder {
    this.patternValue += '$';
    return this;
  }

  /**
   * Configures regular expression options
   */
  options(options: RegexBuilderOptions): RegexSecurityBuilder {
    this.optionsValue = { ...this.optionsValue, ...options };
    return this;
  }

  /**
   * Configures security options
   */
  security(config: RegexSecurityConfig): RegexSecurityBuilder {
    this.securityConfigValue = { ...this.securityConfigValue, ...config };
    return this;
  }

  /**
   * Configures timeout
   */
  timeout(ms: number): RegexSecurityBuilder {
    this.securityConfigValue.timeout = ms;
    return this;
  }

  /**
   * Activates safe mode
   */
  safeMode(): RegexSecurityBuilder {
    this.securityConfigValue.safeMode = true;
    return this;
  }

  /**
   * Builds the final regular expression
   */
  build(): { pattern: string; options: RegexBuilderOptions; security: RegexSecurityConfig } {
    return {
      pattern: this.patternValue,
      options: this.optionsValue,
      security: this.securityConfigValue,
    };
  }

  /**
   * Builds and executes the regular expression
   */
  async execute(text: string, service: RegexSecurityService): Promise<RegexTestResult> {
    const { pattern, security } = this.build();
    return service.testRegex(pattern, text, security);
  }
}
