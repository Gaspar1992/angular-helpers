import '@angular/compiler';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { RegexSecurityService } from './regex-security.service';
import { RegexAnalyzerService } from './regex-analyzer.service';
import { RegexWorkerPoolService } from './regex-worker-pool.service';

describe('RegexSecurityService', () => {
  let service: RegexSecurityService;
  let mockAnalyzer: {
    analyzePatternSecurity: ReturnType<typeof vi.fn>;
  };
  let mockWorkerPool: {
    executeInWorker: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockAnalyzer = {
      analyzePatternSecurity: vi.fn().mockResolvedValue({
        safe: true,
        complexity: 1,
        risk: 'low',
        warnings: [],
        recommendations: [],
      }),
    };

    mockWorkerPool = {
      executeInWorker: vi.fn().mockResolvedValue({
        match: true,
        executionTime: 2,
        timeout: false,
      }),
    };

    TestBed.configureTestingModule({
      providers: [
        RegexSecurityService,
        { provide: RegexAnalyzerService, useValue: mockAnalyzer },
        { provide: RegexWorkerPoolService, useValue: mockWorkerPool },
      ],
    });
    service = TestBed.inject(RegexSecurityService);
  });

  describe('analyzePatternSecurity', () => {
    it('delegates to RegexAnalyzerService', async () => {
      const res = await service.analyzePatternSecurity('^[a-z]+$');
      expect(mockAnalyzer.analyzePatternSecurity).toHaveBeenCalledWith('^[a-z]+$');
      expect(res.safe).toBe(true);
    });
  });

  describe('testRegex', () => {
    it('executes safe regex in worker pool', async () => {
      const res = await service.testRegex('^[a-z]+$', 'hello');
      expect(mockAnalyzer.analyzePatternSecurity).toHaveBeenCalledWith('^[a-z]+$');
      expect(mockWorkerPool.executeInWorker).toHaveBeenCalledWith(
        '^[a-z]+$',
        'hello',
        expect.objectContaining({
          timeout: 5000,
          maxComplexity: 10,
          allowBacktracking: false,
          safeMode: false,
        }),
      );
      expect(res.match).toBe(true);
      expect(res.timeout).toBe(false);
      expect(res.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('rejects unsafe pattern when safeMode is false without running in worker', async () => {
      mockAnalyzer.analyzePatternSecurity.mockResolvedValue({
        safe: false,
        complexity: 15,
        risk: 'high',
        warnings: ['Nested quantifiers (catastrophic backtracking)'],
        recommendations: [],
      });

      const res = await service.testRegex('(a**)+', 'aaaaaaaa');
      expect(res.match).toBe(false);
      expect(res.error).toContain(
        'Pattern rejected: Nested quantifiers (catastrophic backtracking)',
      );
      expect(mockWorkerPool.executeInWorker).not.toHaveBeenCalled();
    });

    it('runs unsafe pattern in worker when safeMode is explicitly true', async () => {
      mockAnalyzer.analyzePatternSecurity.mockResolvedValue({
        safe: false,
        complexity: 15,
        risk: 'high',
        warnings: ['Nested quantifiers'],
        recommendations: [],
      });

      const res = await service.testRegex('(a**)+', 'aaaaaaaa', { safeMode: true });
      expect(mockWorkerPool.executeInWorker).toHaveBeenCalled();
      expect(res.match).toBe(true);
    });

    it('handles worker execution errors gracefully', async () => {
      mockWorkerPool.executeInWorker.mockRejectedValue(new Error('Worker crashed'));

      const res = await service.testRegex('^[a-z]+$', 'test');
      expect(res.match).toBe(false);
      expect(res.error).toBe('Worker crashed');
    });

    it('handles non-Error objects thrown gracefully', async () => {
      mockWorkerPool.executeInWorker.mockRejectedValue('String error');

      const res = await service.testRegex('^[a-z]+$', 'test');
      expect(res.match).toBe(false);
      expect(res.error).toBe('Unknown error');
    });
  });
});
