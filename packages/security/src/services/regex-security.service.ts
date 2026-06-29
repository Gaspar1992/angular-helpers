import { Injectable, inject } from '@angular/core';
import type { RegexSecurityConfig, RegexTestResult, RegexSecurityResult } from './regex-types';
import { RegexAnalyzerService } from './regex-analyzer.service';
import { RegexWorkerPoolService } from './regex-worker-pool.service';

export * from './regex-types';

/**
 * Security service for regular expressions that prevents ReDoS
 * Facade pattern that delegates to Analyzer and Worker Pool.
 */
@Injectable()
export class RegexSecurityService {
  private analyzer = inject(RegexAnalyzerService);
  private workerPool = inject(RegexWorkerPoolService);

  /**
   * Executes a regular expression safely with a timeout
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

      // Execute in Web Worker with timeout
      const result = await this.workerPool.executeInWorker(pattern, text, finalConfig);

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
    return this.analyzer.analyzePatternSecurity(pattern);
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
}
