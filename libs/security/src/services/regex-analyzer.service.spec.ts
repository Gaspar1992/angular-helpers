import '@angular/compiler';
import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RegexAnalyzerService } from './regex-analyzer.service';

describe('RegexAnalyzerService', () => {
  let service: RegexAnalyzerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RegexAnalyzerService],
    });
    service = TestBed.inject(RegexAnalyzerService);
  });

  describe('analyzePatternSecurity', () => {
    it('analyzes safe simple regex', async () => {
      const result = await service.analyzePatternSecurity('^[a-zA-Z0-9]+$');
      expect(result.safe).toBe(true);
      expect(result.risk).toBe('low');
      expect(result.warnings).toHaveLength(0);
      expect(result.complexity).toBeGreaterThanOrEqual(0);
    });

    it('detects nested star quantifiers (**)', async () => {
      const result = await service.analyzePatternSecurity('(a**)+');
      expect(result.safe).toBe(false);
      expect(result.risk).toBe('high');
      expect(result.warnings).toContain('Nested quantifiers (catastrophic backtracking)');
      expect(result.recommendations).toContain(
        'Avoid nested quantifiers to prevent catastrophic backtracking',
      );
    });

    it('detects nested plus quantifiers (++)', async () => {
      const result = await service.analyzePatternSecurity('(a++)+');
      expect(result.safe).toBe(false);
      expect(result.risk).toBe('high');
      expect(result.warnings).toContain('Nested plus quantifiers');
    });

    it('detects lookaheads and negative lookaheads', async () => {
      const lookahead = await service.analyzePatternSecurity('(?=.*[0-9])');
      expect(lookahead.warnings).toContain('Lookahead assertions');

      const negLookahead = await service.analyzePatternSecurity('(?!.*[0-9])');
      expect(negLookahead.warnings).toContain('Negative lookahead');
    });

    it('detects non-capturing groups and lookbehinds', async () => {
      const nonCapturing = await service.analyzePatternSecurity('(?:abc)');
      expect(nonCapturing.warnings).toContain('Non-capturing groups');

      const lookbehind = await service.analyzePatternSecurity('(?<=abc)');
      expect(lookbehind.warnings).toContain('Lookbehind assertions');
    });

    it('detects recursive patterns and flags critical risk', async () => {
      const recursive = await service.analyzePatternSecurity('(?())(?(?))');
      expect(recursive.safe).toBe(false);
      expect(recursive.risk).toBe('critical');
      expect(recursive.warnings).toContain('Recursive patterns');
    });

    it('detects quantified repetitions and greedy dot quantifiers', async () => {
      const quantified = await service.analyzePatternSecurity('a{1,5}');
      expect(quantified.warnings).toContain('Quantified repetition');

      const greedy = await service.analyzePatternSecurity('.*');
      expect(greedy.warnings).toContain('Greedy quantifiers with dot');
    });

    it('detects character classes with quantifiers', async () => {
      const charClass = await service.analyzePatternSecurity('[a-z*]');
      expect(charClass.warnings).toContain('Character classes with quantifiers');
    });

    it('calculates high complexity and adds recommendation for complex patterns', async () => {
      const complexPattern = '(((((a**)**)**)**)??)(?=foo)(?!bar)(?<=baz)';
      const result = await service.analyzePatternSecurity(complexPattern);
      expect(result.complexity).toBeGreaterThan(10);
      expect(result.recommendations).toContain('Consider simplifying the pattern');
    });

    it('adds recommendation for long patterns (>100 characters)', async () => {
      const longPattern = 'a'.repeat(105);
      const result = await service.analyzePatternSecurity(longPattern);
      expect(result.recommendations).toContain(
        'Long patterns are harder to maintain and may impact performance',
      );
    });
  });
});
