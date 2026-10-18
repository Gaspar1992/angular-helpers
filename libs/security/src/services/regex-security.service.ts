import { Injectable, inject } from '@angular/core';
import { injectErrorBoundaryReporter } from '@angular-helpers/core';
import {
  REGEX_SECURITY_DEFAULTS,
  type RegexSecurityConfig,
  type RegexTestResult,
  type RegexSecurityResult,
} from './regex-types';
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
  private defaults = inject(REGEX_SECURITY_DEFAULTS, { optional: true });
  private errorReporter = injectErrorBoundaryReporter({ rethrow: false });

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
        const errorMsg = `Pattern rejected: ${securityCheck.warnings.join(', ')}`;
        if (finalConfig.reportToBoundary) {
          this.errorReporter(new Error(`[RegexSecurity] ${errorMsg}`));
        }
        return {
          match: false,
          executionTime: performance.now() - startTime,
          timeout: false,
          error: errorMsg,
        };
      }

      // Execute in Web Worker with timeout
      const result = await this.workerPool.executeInWorker(pattern, text, finalConfig);

      if (result.timeout && finalConfig.reportToBoundary) {
        this.errorReporter(
          new Error(
            '[RegexSecurity] Regular expression execution timed out (ReDoS threshold exceeded)',
          ),
        );
      }

      return {
        ...result,
        executionTime: performance.now() - startTime,
      };
    } catch (error) {
      if (finalConfig.reportToBoundary) {
        this.errorReporter(error);
      }
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
      timeout: config.timeout || this.defaults?.defaultTimeout || 5000,
      maxComplexity: config.maxComplexity || 10,
      allowBacktracking: config.allowBacktracking || false,
      safeMode: config.safeMode ?? this.defaults?.safeMode ?? false,
      reportToBoundary: config.reportToBoundary ?? false,
    };
  }
}
