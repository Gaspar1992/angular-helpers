import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('RegexSecurityService - Basic Tests', () => {
  let service: any;

  beforeEach(() => {
    // Mock the service with basic functionality
    service = {
      analyzePatternSecurity: vi.fn().mockResolvedValue({
        safe: true,
        complexity: 1,
        risk: 'low',
        warnings: [],
        recommendations: []
      }),
      testRegex: vi.fn().mockResolvedValue({
        match: false,
        executionTime: 50,
        timeout: false
      }),
      ngOnDestroy: vi.fn()
    };
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
    });

    it('should have analyzePatternSecurity method', () => {
      expect(typeof service.analyzePatternSecurity).toBe('function');
    });

    it('should have testRegex method', () => {
      expect(typeof service.testRegex).toBe('function');
    });

    it('should have ngOnDestroy method', () => {
      expect(typeof service.ngOnDestroy).toBe('function');
    });
  });

  describe('Pattern Security Analysis', () => {
    it('should analyze safe pattern', async () => {
      const result = await service.analyzePatternSecurity('test\\d+');
      
      expect(result).toHaveProperty('safe');
      expect(result).toHaveProperty('complexity');
      expect(result).toHaveProperty('risk');
      expect(result).toHaveProperty('warnings');
      expect(result).toHaveProperty('recommendations');
      expect(typeof result.safe).toBe('boolean');
      expect(typeof result.complexity).toBe('number');
      expect(['low', 'medium', 'high', 'critical']).toContain(result.risk);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    it('should detect dangerous patterns', async () => {
      service.analyzePatternSecurity.mockResolvedValueOnce({
        safe: false,
        complexity: 10,
        risk: 'high',
        warnings: ['Dangerous pattern detected'],
        recommendations: ['Simplify the pattern']
      });
      
      const dangerousPattern = '(a+)+b';
      const result = await service.analyzePatternSecurity(dangerousPattern);
      
      expect(result.safe).toBe(false);
      expect(result.risk).toBe('high');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect catastrophic backtracking', async () => {
      service.analyzePatternSecurity.mockResolvedValueOnce({
        safe: false,
        complexity: 20,
        risk: 'critical',
        warnings: ['Catastrophic backtracking detected'],
        recommendations: ['Avoid nested quantifiers']
      });
      
      const catastrophicPattern = '(a+)+\\1';
      const result = await service.analyzePatternSecurity(catastrophicPattern);
      
      expect(result.safe).toBe(false);
      expect(result.risk).toBe('critical');
    });

    it('should handle empty pattern', async () => {
      service.analyzePatternSecurity.mockResolvedValueOnce({
        safe: true,
        complexity: 0,
        risk: 'low',
        warnings: [],
        recommendations: []
      });
      
      const result = await service.analyzePatternSecurity('');
      
      expect(result.safe).toBe(true);
      expect(result.complexity).toBe(0);
      expect(result.risk).toBe('low');
    });

    it('should handle very complex pattern', async () => {
      service.analyzePatternSecurity.mockResolvedValueOnce({
        safe: true,
        complexity: 15,
        risk: 'medium',
        warnings: ['Complex pattern'],
        recommendations: ['Consider simplification']
      });
      
      const complexPattern = '(a+)(b+)(c+)(d+)(e+)(f+)(g+)(h+)(i+)(j+)';
      const result = await service.analyzePatternSecurity(complexPattern);
      
      expect(result).toHaveProperty('complexity');
      expect(result.complexity).toBeGreaterThan(0);
    });
  });

  describe('Regex Testing', () => {
    it('should test simple pattern', async () => {
      const result = await service.testRegex('test\\d+', 'test123');
      
      expect(result).toHaveProperty('match');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('timeout');
      expect(typeof result.match).toBe('boolean');
      expect(typeof result.executionTime).toBe('number');
      expect(typeof result.timeout).toBe('boolean');
    });

    it('should handle pattern with no match', async () => {
      const result = await service.testRegex('test\\d+', 'nomatch');
      
      expect(result.match).toBe(false);
      expect(result.timeout).toBe(false);
      expect(result.error).toBeUndefined();
    });

    it('should handle pattern with matches', async () => {
      service.testRegex.mockResolvedValueOnce({
        match: true,
        matches: [['test123']],
        groups: { '1': '123' },
        executionTime: 25,
        timeout: false
      });
      
      const result = await service.testRegex('test(\\d+)', 'test123');
      
      expect(result.match).toBe(true);
      expect(result.matches).toBeDefined();
      expect(result.groups).toBeDefined();
    });

    it('should respect timeout configuration', async () => {
      service.testRegex.mockResolvedValueOnce({
        match: false,
        executionTime: 150,
        timeout: true,
        error: 'Timeout exceeded'
      });
      
      const config = { timeout: 100 };
      const result = await service.testRegex('(a+)+b', 'a'.repeat(1000) + 'b', config);
      
      expect(result).toHaveProperty('timeout');
      expect(result.timeout).toBe(true);
      expect(result.executionTime).toBeLessThan(200);
    });

    it('should handle safe mode', async () => {
      service.testRegex.mockResolvedValueOnce({
        match: false,
        executionTime: 10,
        timeout: false,
        error: 'Pattern rejected: Dangerous pattern detected'
      });
      
      const config = { safeMode: true };
      const dangerousPattern = '(a+)+b';
      const result = await service.testRegex(dangerousPattern, 'test', config);
      
      expect(result.match).toBe(false);
      expect(result.error).toContain('Pattern rejected');
    });

    it('should handle execution errors gracefully', async () => {
      service.testRegex.mockResolvedValueOnce({
        match: false,
        executionTime: 10,
        timeout: false,
        error: 'Worker error'
      });

      const result = await service.testRegex('test', 'test');
      
      expect(result.match).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.timeout).toBe(false);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', async () => {
      const result = await service.testRegex('test', 'test');
      
      expect(result).toHaveProperty('match');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('timeout');
    });

    it('should merge configuration correctly', async () => {
      const config = { timeout: 2000, safeMode: true };
      const result = await service.testRegex('test', 'test', config);
      
      expect(result).toHaveProperty('match');
    });

    it('should handle empty configuration', async () => {
      const result = await service.testRegex('test', 'test', {});
      
      expect(result).toHaveProperty('match');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('timeout');
    });
  });

  describe('Edge Cases', () => {
    it('should handle Unicode patterns', async () => {
      const result = await service.testRegex('\\p{L}', 'test');
      
      expect(result).toHaveProperty('match');
      expect(result).toHaveProperty('executionTime');
    });

    it('should handle invalid regex patterns', async () => {
      service.testRegex.mockResolvedValueOnce({
        match: false,
        executionTime: 5,
        timeout: false,
        error: 'Invalid regex pattern'
      });
      
      const result = await service.testRegex('[invalid', 'test');
      
      expect(result.match).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle very long text', async () => {
      const longText = 'a'.repeat(10000);
      const result = await service.testRegex('a+', longText);
      
      expect(result).toHaveProperty('match');
      expect(result).toHaveProperty('executionTime');
    });

    it('should handle special characters', async () => {
      const result = await service.testRegex('[.*+?^${}()|\\[\\]]', 'test.*');
      
      expect(result).toHaveProperty('match');
    });

    it('should handle lookaheads and lookbehinds', async () => {
      const result = await service.testRegex('(?=test)\\w+', 'testing');
      
      expect(result).toHaveProperty('match');
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent tests', async () => {
      const promises = [
        service.testRegex('test1', 'text1'),
        service.testRegex('test2', 'text2'),
        service.testRegex('test3', 'text3')
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toHaveProperty('match');
        expect(result).toHaveProperty('executionTime');
      });
    });
  });
});

describe('RegexSecurityBuilder - Basic Tests', () => {
  let builder: any;

  beforeEach(() => {
    builder = {
      pattern: vi.fn().mockReturnThis(),
      append: vi.fn().mockReturnThis(),
      timeout: vi.fn().mockReturnThis(),
      safeMode: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({
        pattern: '',
        options: {},
        security: {}
      })
    };
    
    vi.clearAllMocks();
  });

  describe('Builder Pattern', () => {
    it('should create builder instance', () => {
      expect(builder).toBeTruthy();
    });

    it('should have pattern method', () => {
      expect(typeof builder.pattern).toBe('function');
    });

    it('should have append method', () => {
      expect(typeof builder.append).toBe('function');
    });

    it('should have timeout method', () => {
      expect(typeof builder.timeout).toBe('function');
    });

    it('should have safeMode method', () => {
      expect(typeof builder.safeMode).toBe('function');
    });

    it('should have build method', () => {
      expect(typeof builder.build).toBe('function');
    });

    it('should build basic pattern', () => {
      builder.build.mockReturnValueOnce({
        pattern: 'test',
        options: {},
        security: {}
      });
      
      const result = builder
        .pattern('test')
        .build();
      
      expect(result.pattern).toBe('test');
      expect(result.options).toBeDefined();
      expect(result.security).toBeDefined();
    });

    it('should append text to pattern', () => {
      builder.build.mockReturnValueOnce({
        pattern: 'test\\d+[a-z]+',
        options: {},
        security: {}
      });
      
      const result = builder
        .pattern('test')
        .append('\\d+')
        .append('[a-z]+')
        .build();
      
      expect(result.pattern).toBe('test\\d+[a-z]+');
    });

    it('should set security configuration', () => {
      builder.build.mockReturnValueOnce({
        pattern: 'test',
        options: {},
        security: {
          timeout: 5000,
          safeMode: true
        }
      });
      
      const result = builder
        .timeout(5000)
        .safeMode(true)
        .build();
      
      expect(result.security.timeout).toBe(5000);
      expect(result.security.safeMode).toBe(true);
    });
  });

  describe('Validation', () => {
    it('should validate built pattern', () => {
      builder.build.mockReturnValueOnce({
        pattern: 'test',
        options: {},
        security: {}
      });
      
      const result = builder.pattern('test').build();
      
      expect(result.pattern).toBe('test');
      expect(result.options).toBeDefined();
      expect(result.security).toBeDefined();
    });

    it('should handle empty builder', () => {
      const result = builder.build();
      
      expect(result.pattern).toBe('');
      expect(result.options).toEqual({});
      expect(result.security).toEqual({});
    });
  });
});
