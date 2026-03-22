import { Injectable, inject } from '@angular/core';
import { WebWorkerService, WorkerMessage } from './web-worker.service';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import { firstValueFrom } from 'rxjs';

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
 */
@Injectable()
export class RegexSecurityService extends BrowserApiBaseService {
  private webWorkerService = inject(WebWorkerService);
  private readonly workerName = 'regex-security-worker';

  protected override getApiName(): string {
    return 'regex-security';
  }

  /**
   * Builder pattern to construct safe regular expressions
   */
  static builder(): RegexSecurityBuilder {
    return new RegexSecurityBuilder();
  }

  /**
   * Executes a regular expression safely with a timeout
   */
  async testRegex(
    pattern: string,
    text: string,
    config: RegexSecurityConfig = {}
  ): Promise<RegexTestResult> {
    // Verificar soporte directamente
    if (!this.isWebWorkerSupported()) {
      throw new Error('Web Workers not supported in this browser');
    }

    const startTime = performance.now();
    const finalConfig = this.mergeConfig(config);

    try {
      // First, analyze pattern security
      const securityResult = await this.analyzePattern(pattern);
      if (!securityResult.safe && !finalConfig.allowBacktracking) {
        return {
          match: false,
          executionTime: performance.now() - startTime,
          timeout: false,
          error: 'Pattern contains potential ReDoS vulnerabilities'
        };
      }

      // Execute in Web Worker with timeout
      const result = await this.executeInWorker(pattern, text, finalConfig);
      
      return {
        ...result,
        executionTime: performance.now() - startTime
      };
    } catch (error) {
      console.error('[RegexSecurityService] Error testing regex:', error);
      return {
        match: false,
        executionTime: performance.now() - startTime,
        timeout: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analyzes a regex pattern for potential security issues
   */
  async analyzePattern(pattern: string): Promise<RegexSecurityResult> {
    // Verificar soporte directamente
    if (!this.isWebWorkerSupported()) {
      throw new Error('Web Workers not supported in this browser');
    }

    try {
      const result = await this.executeInWorker(pattern, '', { 
        timeout: 1000,
        maxComplexity: 1000,
        allowBacktracking: false,
        safeMode: true
      }, 'analyze');
      
      return ((result as RegexTestResult & { security?: RegexSecurityResult }).security) || this.getDefaultSecurityResult();
    } catch (error) {
      console.error('[RegexSecurityService] Error analyzing pattern:', error);
      return this.getDefaultSecurityResult();
    }
  }

  private isWebWorkerSupported(): boolean {
    return this.isBrowserEnvironment() && typeof Worker !== 'undefined';
  }

  private mergeConfig(config: RegexSecurityConfig): Required<RegexSecurityConfig> {
    return {
      timeout: config.timeout ?? 5000,
      maxComplexity: config.maxComplexity ?? 1000,
      allowBacktracking: config.allowBacktracking ?? false,
      safeMode: config.safeMode ?? true
    };
  }

  private async executeInWorker(
    pattern: string,
    text: string,
    config: Required<RegexSecurityConfig>,
    action: 'test' | 'analyze' = 'test'
  ): Promise<RegexTestResult> {
    // Initialize worker if needed
    await this.initializeRegexWorker();

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Regex execution timeout', { cause: 'timeout' }));
      }, config.timeout);

      const message = {
        id: `regex-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: action,
        data: {
          pattern,
          text,
          config
        }
      };

      this.webWorkerService.postMessage(this.workerName, message);
      
      // Subscribe to responses
      const subscription = this.webWorkerService.getMessages(this.workerName)
        .subscribe({
          next: (response: WorkerMessage) => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
            
            if (response.type === action) {
              if (action === 'analyze') {
                // For analysis, return a default test result with security info
                resolve({
                  match: false,
                  executionTime: 0,
                  timeout: false,
                  security: (response.data as { security: RegexSecurityResult }).security
                } as RegexTestResult & { security: RegexSecurityResult });
              } else {
                resolve(response.data as RegexTestResult);
              }
            }
          },
          error: (error: unknown) => {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
            reject(new Error('Worker execution failed', { cause: error }));
          }
        });
    });
  }

  private async initializeRegexWorker(): Promise<void> {
    try {
      await firstValueFrom(this.webWorkerService.createWorker(this.workerName, '/assets/workers/regex-security.worker.js'));
    } catch (error) {
      console.error('[RegexSecurityService] Failed to initialize worker:', error);
      throw new Error('Failed to initialize regex security worker', { cause: error });
    }
  }

  private getDefaultSecurityResult(): RegexSecurityResult {
    return {
      safe: false,
      complexity: 0,
      risk: 'high',
      warnings: ['Unable to analyze pattern security'],
      recommendations: ['Use simpler patterns or enable safe mode']
    };
  }

  // Direct access to native regex API with safety checks
  createSafeRegex(pattern: string, options?: RegexBuilderOptions): RegExp {
    try {
      const flags = this.buildFlags(options);
      return new RegExp(pattern, flags);
    } catch (error) {
      console.error('[RegexSecurityService] Error creating regex:', error);
      throw new Error('Invalid regex pattern', { cause: error });
    }
  }

  private buildFlags(options?: RegexBuilderOptions): string {
    const flags: string[] = [];
    
    if (options?.global) flags.push('g');
    if (options?.ignoreCase) flags.push('i');
    if (options?.multiline) flags.push('m');
    if (options?.dotAll) flags.push('s');
    if (options?.unicode) flags.push('u');
    if (options?.sticky) flags.push('y');
    
    return flags.join('');
  }
}

/**
 * Builder class for creating secure regular expressions
 */
export class RegexSecurityBuilder {
  private regexPattern: string = '';
  private options: RegexBuilderOptions = {};
  private config: RegexSecurityConfig = {};

  pattern(regex: string): this {
    this.regexPattern = regex;
    return this;
  }

  global(enabled = true): this {
    this.options.global = enabled;
    return this;
  }

  ignoreCase(enabled = true): this {
    this.options.ignoreCase = enabled;
    return this;
  }

  multiline(enabled = true): this {
    this.options.multiline = enabled;
    return this;
  }

  timeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  safeMode(enabled = true): this {
    this.config.safeMode = enabled;
    return this;
  }

  build(): RegExp {
    const flags = this.buildFlags();
    return new RegExp(this.regexPattern, flags);
  }

  private buildFlags(): string {
    const flags: string[] = [];
    
    if (this.options.global) flags.push('g');
    if (this.options.ignoreCase) flags.push('i');
    if (this.options.multiline) flags.push('m');
    if (this.options.dotAll) flags.push('s');
    if (this.options.unicode) flags.push('u');
    if (this.options.sticky) flags.push('y');
    
    return flags.join('');
  }
}
