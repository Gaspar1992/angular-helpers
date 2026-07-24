import { Injectable } from '@angular/core';
import type { RegexSecurityResult } from './regex-types';

/**
 * Service responsible for statically analyzing regular expressions
 * to detect ReDoS vulnerabilities and complexity issues.
 */
@Injectable()
export class RegexAnalyzerService {
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
      { pattern: /\(\?=/, risk: 'medium' as const, message: 'Lookahead assertions' },
      { pattern: /\(\?!/, risk: 'medium' as const, message: 'Negative lookahead' },
      { pattern: /\(\?:/, risk: 'low' as const, message: 'Non-capturing groups' },
      { pattern: /\(\?</, risk: 'high' as const, message: 'Lookbehind assertions' },
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
   * Calculates the complexity of a pattern
   */
  private calculateComplexity(pattern: string): number {
    let complexity = 0;

    // Nested quantifiers increase complexity
    complexity += (pattern.match(/\*\*/g) || []).length * 5;
    complexity += (pattern.match(/\+\+/g) || []).length * 5;
    complexity += (pattern.match(/\?\?/g) || []).length * 3;

    // Lookaheads/lookbehinds
    complexity += (pattern.match(/\(\?=/g) || []).length * 2;
    complexity += (pattern.match(/\(\?!/g) || []).length * 2;
    complexity += (pattern.match(/\(\?</g) || []).length * 3;

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
}
