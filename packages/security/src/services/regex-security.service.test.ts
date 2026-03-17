import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RegexSecurityService, RegexSecurityBuilder } from './regex-security.service';

// Mock Worker and URL for testing
const mockWorker = {
  postMessage: vi.fn(),
  terminate: vi.fn(),
  onmessage: null as any,
  onerror: null as any,
};

const mockURL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
};

// Mock performance.now for timing tests
const mockPerformanceNow = vi.fn(() => 100);

describe('RegexSecurityService', () => {
  let service: RegexSecurityService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Mock global objects
    global.Worker = vi.fn(() => mockWorker) as any;
    global.URL = mockURL as any;
    global.Blob = vi.fn((content, options) => ({ content, options })) as any;
    global.performance = { now: mockPerformanceNow } as any;
    
    // Create service instance
    service = new RegexSecurityService();
  });

  afterEach(() => {
    // Clean up workers
    service.ngOnDestroy();
  });

  describe('Basic Service Functionality', () => {
    it('should create service instance', () => {
      expect(service).toBeTruthy();
    });

    it('should have static builder method', () => {
      expect(RegexSecurityService.builder).toBeTypeOf('function');
      expect(RegexSecurityService.builder()).toBeInstanceOf(RegexSecurityBuilder);
    });
  });

  describe('Pattern Security Analysis', () => {
    it('should analyze safe pattern correctly', async () => {
      const result = await service.analyzePatternSecurity('test.*pattern');
      
      expect(result.safe).toBe(true);
      expect(result.risk).toBe('low');
      expect(result.warnings).toHaveLength(0);
      expect(result.complexity).toBeGreaterThan(0);
    });

    it('should detect dangerous nested quantifiers', async () => {
      const result = await service.analyzePatternSecurity('test**pattern');
      
      expect(result.safe).toBe(false);
      expect(result.risk).toBe('high');
      expect(result.warnings).toContain('Nested quantifiers (catastrophic backtracking)');
    });

    it('should detect nested plus quantifiers', async () => {
      const result = await service.analyzePatternSecurity('test++pattern');
      
      expect(result.safe).toBe(false);
      expect(result.risk).toBe('high');
      expect(result.warnings).toContain('Nested plus quantifiers');
    });

    it('should detect lookahead assertions', async () => {
      const result = await service.analyzePatternSecurity('test(?=ahead)pattern');
      
      expect(result.warnings).toContain('Lookahead assertions');
      expect(result.risk).toBe('medium');
    });

    it('should detect negative lookahead', async () => {
      const result = await service.analyzePatternSecurity('test(?!ahead)pattern');
      
      expect(result.warnings).toContain('Negative lookahead');
      expect(result.risk).toBe('medium');
    });

    it('should detect lookbehind assertions', async () => {
      const result = await service.analyzePatternSecurity('test(?<=behind)pattern');
      
      expect(result.warnings).toContain('Lookbehind assertions');
      expect(result.risk).toBe('high');
    });

    it('should detect recursive patterns', async () => {
      const result = await service.analyzePatternSecurity('test(?((?))pattern');
      
      expect(result.warnings).toContain('Recursive patterns');
      expect(result.risk).toBe('critical');
    });

    it('should calculate complexity correctly', async () => {
      // Simple pattern
      const simpleResult = await service.analyzePatternSecurity('test');
      expect(simpleResult.complexity).toBeLessThan(1);

      // Complex pattern with multiple risk factors
      const complexPattern = '(test(?=ahead)**pattern){2,}';
      const complexResult = await service.analyzePatternSecurity(complexPattern);
      expect(complexResult.complexity).toBeGreaterThan(simpleResult.complexity);
    });

    it('should provide recommendations for complex patterns', async () => {
      const result = await service.analyzePatternSecurity('(very(complex(pattern){10,20}))');
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(r => r.includes('simplifying'))).toBe(true);
    });

    it('should provide recommendations for long patterns', async () => {
      const longPattern = 'a'.repeat(150);
      const result = await service.analyzePatternSecurity(longPattern);
      
      expect(result.recommendations.some(r => r.includes('Long patterns'))).toBe(true);
    });
  });

  describe('Regex Testing with Worker', () => {
    beforeEach(() => {
      // Mock successful worker execution
      mockWorker.onmessage = null;
      mockWorker.onerror = null;
    });

    it('should test simple regex successfully', async () => {
      const mockResult = {
        match: true,
        matches: [['test', 'test']],
        groups: { group1: 'test' },
        executionTime: 50,
        timeout: false
      };

      // Simulate worker response by calling the handler directly
      const testPromise = service.testRegex('test.*', 'test string');
      
      // Get the worker instance that was created
      const workerCalls = (global.Worker as any).mock.calls;
      if (workerCalls.length > 0) {
        const createdWorker = workerCalls[workerCalls.length - 1][0];
        // Simulate the worker response
        setTimeout(() => {
          if (createdWorker.onmessage) {
            createdWorker.onmessage({
              data: {
                id: expect.any(String),
                type: 'regex-result',
                data: mockResult
              }
            });
          }
        }, 0);
      }

      const result = await testPromise;
      
      expect(result.match).toBe(true);
      expect(result.executionTime).toBeGreaterThan(0);
      expect(result.timeout).toBe(false);
    });

    it('should handle worker timeout', async () => {
      // Don't simulate worker response to trigger timeout
      const result = await service.testRegex('complex.*', 'test string', { timeout: 100 });
      
      expect(result.match).toBe(false);
      expect(result.timeout).toBe(true);
      expect(result.error).toBe('Execution timeout');
    });

    it('should handle worker errors', async () => {
      const testPromise = service.testRegex('test.*', 'test string');
      
      // Get the worker instance and simulate error
      const workerCalls = (global.Worker as any).mock.calls;
      if (workerCalls.length > 0) {
        const createdWorker = workerCalls[workerCalls.length - 1][0];
        setTimeout(() => {
          if (createdWorker.onerror) {
            const error = new Error('Worker error occurred');
            createdWorker.onerror({ message: 'Worker error occurred', error });
          }
        }, 0);
      }

      const result = await testPromise;
      
      expect(result.match).toBe(false);
      expect(result.error).toContain('Worker error');
    });

    it('should reject unsafe patterns when not in safe mode', async () => {
      const result = await service.testRegex('test**', 'test string');
      
      expect(result.match).toBe(false);
      expect(result.error).toContain('Pattern rejected');
    });

    it('should allow unsafe patterns in safe mode', async () => {
      const mockResult = {
        match: true,
        matches: [],
        groups: {},
        executionTime: 50,
        timeout: false
      };

      const testPromise = service.testRegex('test**', 'test string', { safeMode: false });
      
      // Get the worker instance and simulate response
      const workerCalls = (global.Worker as any).mock.calls;
      if (workerCalls.length > 0) {
        const createdWorker = workerCalls[workerCalls.length - 1][0];
        setTimeout(() => {
          if (createdWorker.onmessage) {
            createdWorker.onmessage({
              data: {
                id: expect.any(String),
                type: 'regex-result',
                data: mockResult
              }
            });
          }
        }, 0);
      }

      const result = await testPromise;
      
      expect(result.match).toBe(true);
    });

    it('should handle Worker creation errors', async () => {
      // Mock Worker constructor to throw error
      global.Worker = vi.fn(() => {
        throw new Error('Worker creation failed');
      }) as any;

      const result = await service.testRegex('test.*', 'test string');
      
      expect(result.match).toBe(false);
      expect(result.error).toContain('Failed to create worker');
    });
  });

  describe('Configuration Handling', () => {
    it('should use default configuration when none provided', async () => {
      const mockResult = {
        match: true,
        matches: [],
        groups: {},
        executionTime: 50,
        timeout: false
      };

      const testPromise = service.testRegex('test.*', 'test string');
      
      // Get the worker instance and simulate response
      const workerCalls = (global.Worker as any).mock.calls;
      if (workerCalls.length > 0) {
        const createdWorker = workerCalls[workerCalls.length - 1][0];
        setTimeout(() => {
          if (createdWorker.onmessage) {
            createdWorker.onmessage({
              data: {
                id: expect.any(String),
                type: 'regex-result',
                data: mockResult
              }
            });
          }
        }, 0);
      }

      await testPromise;
      
      // Verify Worker was called with default timeout
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timeout: 5000 // Default timeout
          })
        })
      );
    });

    it('should use custom configuration', async () => {
      const mockResult = {
        match: true,
        matches: [],
        groups: {},
        executionTime: 50,
        timeout: false
      };

      const testPromise = service.testRegex('test.*', 'test string', { timeout: 1000 });
      
      // Get the worker instance and simulate response
      const workerCalls = (global.Worker as any).mock.calls;
      if (workerCalls.length > 0) {
        const createdWorker = workerCalls[workerCalls.length - 1][0];
        setTimeout(() => {
          if (createdWorker.onmessage) {
            createdWorker.onmessage({
              data: {
                id: expect.any(String),
                type: 'regex-result',
                data: mockResult
              }
            });
          }
        }, 0);
      }

      await testPromise;
      
      expect(mockWorker.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            timeout: 1000
          })
        })
      );
    });
  });

  describe('Resource Management', () => {
    it('should terminate workers on destroy', () => {
      service.ngOnDestroy();
      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should clean up resources properly', () => {
      // Create some workers first
      service.testRegex('test.*', 'test');
      service.testRegex('another.*', 'test');
      
      service.ngOnDestroy();
      expect(mockWorker.terminate).toHaveBeenCalledTimes(2);
    });
  });
});

describe('RegexSecurityBuilder', () => {
  let builder: RegexSecurityBuilder;

  beforeEach(() => {
    builder = RegexSecurityService.builder();
  });

  describe('Builder Pattern', () => {
    it('should create builder instance', () => {
      expect(builder).toBeInstanceOf(RegexSecurityBuilder);
    });

    it('should build pattern correctly', () => {
      const result = builder
        .pattern('test')
        .build();
      
      expect(result.pattern).toBe('test');
      expect(result.options).toEqual({});
      expect(result.security).toEqual({});
    });

    it('should append text to pattern', () => {
      const result = builder
        .pattern('test')
        .append('.*pattern')
        .build();
      
      expect(result.pattern).toBe('test.*pattern');
    });

    it('should add capturing groups', () => {
      const result = builder
        .pattern('test')
        .group('(.*)')
        .build();
      
      expect(result.pattern).toBe('test((.*))');
    });

    it('should add named capturing groups', () => {
      const result = builder
        .pattern('test')
        .group('.*', 'name')
        .build();
      
      expect(result.pattern).toBe('test(?<name>.*)');
    });

    it('should add non-capturing groups', () => {
      const result = builder
        .pattern('test')
        .nonCapturingGroup('.*')
        .build();
      
      expect(result.pattern).toBe('test(?:.*)');
    });

    it('should add alternatives', () => {
      const result = builder
        .pattern('test')
        .or('alternative')
        .build();
      
      expect(result.pattern).toBe('test|alternative');
    });

    it('should add quantifiers', () => {
      const result = builder
        .pattern('test')
        .quantifier('*')
        .build();
      
      expect(result.pattern).toBe('test*');
    });

    it('should add character sets', () => {
      const result = builder
        .pattern('test')
        .characterSet('abc')
        .build();
      
      expect(result.pattern).toBe('test[abc]');
    });

    it('should add negated character sets', () => {
      const result = builder
        .pattern('test')
        .characterSet('abc', true)
        .build();
      
      expect(result.pattern).toBe('test[^abc]');
    });

    it('should add anchors', () => {
      const result = builder
        .pattern('test')
        .startOfLine()
        .endOfLine()
        .build();
      
      expect(result.pattern).toBe('^test$');
    });

    it('should configure regex options', () => {
      const result = builder
        .pattern('test')
        .options({ global: true, ignoreCase: true })
        .build();
      
      expect(result.options).toEqual({ global: true, ignoreCase: true });
    });

    it('should configure security options', () => {
      const result = builder
        .pattern('test')
        .security({ timeout: 1000, safeMode: true })
        .build();
      
      expect(result.security).toEqual({ timeout: 1000, safeMode: true });
    });

    it('should chain timeout configuration', () => {
      const result = builder
        .pattern('test')
        .timeout(2000)
        .build();
      
      expect(result.security.timeout).toBe(2000);
    });

    it('should chain safe mode configuration', () => {
      const result = builder
        .pattern('test')
        .safeMode()
        .build();
      
      expect(result.security.safeMode).toBe(true);
    });

    it('should merge configurations properly', () => {
      const result = builder
        .pattern('test')
        .options({ global: true })
        .options({ ignoreCase: true })
        .security({ timeout: 1000 })
        .security({ safeMode: true })
        .build();
      
      expect(result.options).toEqual({ global: true, ignoreCase: true });
      expect(result.security).toEqual({ timeout: 1000, safeMode: true });
    });
  });

  describe('Complex Pattern Building', () => {
    it('should build email regex pattern', () => {
      const result = builder
        .startOfLine()
        .characterSet('a-zA-Z0-9._%+-')
        .quantifier('+')
        .append('@')
        .characterSet('a-zA-Z0-9.-')
        .quantifier('+')
        .append('\\.')
        .characterSet('a-zA-Z')
        .append('{2,}')
        .endOfLine()
        .build();
      
      expect(result.pattern).toBe('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
    });

    it('should build phone number pattern', () => {
      const result = builder
        .startOfLine()
        .characterSet('0-9')
        .append('{3}')
        .append('[-. ]?')
        .characterSet('0-9')
        .append('{3}')
        .append('[-. ]?')
        .characterSet('0-9')
        .append('{4}')
        .endOfLine()
        .build();
      
      expect(result.pattern).toBe('^[0-9]{3}[-. ]?[0-9]{3}[-. ]?[0-9]{4}$');
    });
  });

  describe('Builder Execution', () => {
    it('should execute built pattern', async () => {
      // Mock service for execution test
      const mockService = {
        testRegex: vi.fn().mockResolvedValue({
          match: true,
          matches: [],
          groups: {},
          executionTime: 50,
          timeout: false
        })
      };

      const result = await builder
        .pattern('test.*')
        .execute('test string', mockService as any);
      
      expect(result.match).toBe(true);
      expect(mockService.testRegex).toHaveBeenCalledWith('test.*', 'test string', {});
    });

    it('should execute with security configuration', async () => {
      const mockService = {
        testRegex: vi.fn().mockResolvedValue({
          match: true,
          matches: [],
          groups: {},
          executionTime: 50,
          timeout: false
        })
      };

      await builder
        .pattern('test**')
        .safeMode()
        .execute('test string', mockService as any);
      
      expect(mockService.testRegex).toHaveBeenCalledWith(
        'test**',
        'test string',
        { safeMode: true }
      );
    });
  });
});
