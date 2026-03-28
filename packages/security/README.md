[Leer en Español](./README.es.md)

🌐 **Documentation & Demo**: https://gaspar1992.github.io/angular-helpers/

# Angular Security Helpers

Security package for Angular applications that prevents common attacks like ReDoS (Regular Expression Denial of Service) using Web Workers for safe execution.

## 🛡️ Features

### **ReDoS Prevention**

- **Web Worker Execution**: Regular expressions are executed in a separate thread.
- **Configurable Timeout**: Prevents infinite executions.
- **Complexity Analysis**: Detects dangerous patterns before execution.
- **Safe Mode**: Only allows patterns verified as safe.

### **Builder Pattern**

- **Fluent API**: Intuitively build regular expressions.
- **Method Chaining**: `.pattern().group().quantifier()`
- **Real-time Validation**: Security analysis during construction.

## 📦 Installation

```bash
npm install @angular-helpers/security
```

## 🚀 Basic Usage

### **Configuration**

```typescript
import { provideSecurity } from '@angular-helpers/security';

bootstrapApplication(AppComponent, {
  providers: [
    provideSecurity({
      enableRegexSecurity: true,
      defaultTimeout: 5000,
      safeMode: false,
    }),
  ],
});
```

### **Service Injection**

```typescript
import { RegexSecurityService, inject } from '@angular-helpers/security';

@Component({...})
export class MyComponent {
  private regexSecurity = inject(RegexSecurityService);
}
```

## 📖 Usage Examples

### **1. Basic Regular Expression Test**

```typescript
async testEmail(email: string): Promise<boolean> {
  const result = await this.regexSecurity.testRegex(
    '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    email,
    { timeout: 3000 }
  );

  return result.match;
}
```

### **2. Builder Pattern**

```typescript
import { RegexSecurityService } from '@angular-helpers/security';

// Fluent regular expression construction
const { pattern, security } = RegexSecurityService.builder()
  .startOfLine()
  .characterSet('a-zA-Z0-9._%+-')
  .quantifier('+')
  .append('@')
  .characterSet('a-zA-Z0-9.-')
  .quantifier('+')
  .append('\\.')
  .characterSet('a-zA-Z')
  .quantifier('{2,}')
  .endOfLine()
  .timeout(5000)
  .safeMode()
  .build();

// Direct execution
const result = await RegexSecurityService.builder()
  .pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
  .timeout(3000)
  .execute(email, this.regexSecurity);
```

### **3. Security Analysis**

```typescript
async analyzePattern(pattern: string): Promise<void> {
  const analysis = await this.regexSecurity.analyzePatternSecurity(pattern);

  if (!analysis.safe) {
    console.warn('⚠️ Pattern not safe:', analysis.warnings);
    console.info('💡 Recommendations:', analysis.recommendations);

    if (analysis.risk === 'critical') {
      throw new Error('Pattern rejected due to critical security risk');
    }
  }

  console.log(`✅ Pattern complexity: ${analysis.complexity}`);
  console.log(`🎯 Risk level: ${analysis.risk}`);
}
```

### **4. Form Validation**

```typescript
@Component({...})
export class FormValidationComponent {
  constructor(private regexSecurity: RegexSecurityService) {}

  async validateUsername(username: string): Promise<boolean> {
    const result = await this.regexSecurity.testRegex(
      '^[a-zA-Z0-9_]{3,20}$',
      username,
      { timeout: 1000, safeMode: true }
    );

    if (result.timeout) {
      throw new Error('Username validation timeout - possible ReDoS attack');
    }

    if (result.error) {
      console.error('Validation error:', result.error);
      return false;
    }

    return result.match;
  }

  async validateComplexInput(input: string): Promise<boolean> {
    // Builder pattern for complex validation
    const result = await RegexSecurityService
      .builder()
      .startOfLine()
      .nonCapturingGroup('[a-zA-Z]') // First letter
      .characterSet('a-zA-Z0-9_') // Allowed characters
      .quantifier('{2,19}') // Between 3 and 20 characters total
      .endOfLine()
      .timeout(2000)
      .execute(input, this.regexSecurity);

    return result.match;
  }
}
```

## 🔧 Advanced Configuration

### **Security Options**

```typescript
interface RegexSecurityConfig {
  timeout?: number; // Timeout in ms (default: 5000)
  maxComplexity?: number; // Max complexity (default: 10)
  allowBacktracking?: boolean; // Allow backtracking (default: false)
  safeMode?: boolean; // Safe mode (default: false)
}
```

### **Builder Options**

```typescript
interface RegexBuilderOptions {
  global?: boolean; // 'g' flag
  ignoreCase?: boolean; // 'i' flag
  multiline?: boolean; // 'm' flag
  dotAll?: boolean; // 's' flag
  unicode?: boolean; // 'u' flag
  sticky?: boolean; // 'y' flag
}
```

## 🛡️ Security Features

### **Dangerous Pattern Detection**

The service automatically detects:

- **Nested quantifiers**: `**`, `++` (catastrophic backtracking)
- **Lookaheads/lookbehinds**: `(?=)`, `(?!)`, `(?<=)`, `(?<!)`
- **Atomic groups**: `(?>)`
- **Recursive patterns**: Deeply nested groups
- **Complex quantifiers**: `{n,m}` with high values
- **Greedy wildcards**: `.*`, `.+` with variable characters

### **Risk Levels**

- **🟢 Low**: Simple and safe patterns
- **🟡 Medium**: Patterns with lookahead/lookbehind
- **🟠 High**: Patterns with complex quantifiers
- **🔴 Critical**: Patterns with catastrophic backtracking

### **Attack Prevention**

- **Timeout**: Stops execution after the time limit
- **Web Worker**: Isolates execution from the main thread
- **Pre-analysis**: Rejects dangerous patterns before execution
- **Match limit**: Prevents infinite loops

## 📊 Metrics and Monitoring

### **Execution Results**

```typescript
interface RegexTestResult {
  match: boolean; // If there was a match
  matches?: RegExpMatchArray[]; // All matches found
  groups?: { [key: string]: string }; // Captured groups
  executionTime: number; // Execution time in ms
  timeout: boolean; // If there was a timeout
  error?: string; // Error if one occurred
}
```

### **Security Analysis**

```typescript
interface RegexSecurityResult {
  safe: boolean; // If the pattern is safe
  complexity: number; // Complexity level (0-∞)
  risk: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[]; // Security warnings
  recommendations: string[]; // Improvement recommendations
}
```

## 🔄 Form Integration

### **Angular Validators**

```typescript
import { AbstractControl, ValidationErrors } from '@angular/forms';

export class SecurityValidators {
  constructor(private regexSecurity: RegexSecurityService) {}

  async securePattern(pattern: string, config?: RegexSecurityConfig) {
    return async (control: AbstractControl): Promise<ValidationErrors | null> => {
      const value = control.value;

      if (!value) return null;

      try {
        const result = await this.regexSecurity.testRegex(pattern, value, config);

        if (!result.match) {
          return { securePattern: { value, reason: 'Pattern does not match' } };
        }

        if (result.timeout) {
          return { securePattern: { value, reason: 'Pattern execution timeout' } };
        }

        return null;
      } catch (error) {
        return { securePattern: { value, reason: (error as Error).message } };
      }
    };
  }
}
```

### **Usage in Template Forms**

```typescript
@Component({...})
export class SecureFormComponent {
  private regexSecurity = inject(RegexSecurityService);
  private securityValidators = inject(SecurityValidators);

  emailValidator = this.securityValidators.securePattern(
    '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    { timeout: 3000, safeMode: true }
  );
}
```

## 🚨 Best Practices

### **1. Use Safe Mode in Production**

```typescript
// In production, always use safeMode
const config = { safeMode: true, timeout: 3000 };
```

### **2. Appropriate Timeout**

```typescript
// For form validations: 1-3 seconds
// For text processing: 5-10 seconds
// Never more than 30 seconds
```

### **3. Pre-analysis**

```typescript
// Always analyze user-provided patterns
const analysis = await this.regexSecurity.analyzePatternSecurity(pattern);
if (!analysis.safe) {
  // Consider using a safer alternative pattern
}
```

### **4. Error Handling**

```typescript
try {
  const result = await this.regexSecurity.testRegex(pattern, text, config);
  // Process result
} catch (error) {
  // Handle error safely
  console.error('Regex security error:', error);
  // Fallback to a simpler validation
}
```

## 🔍 Debugging

### **Security Logging**

The service includes automatic logging:

```typescript
// Enables detailed logging
console.log('Regex security initialized');
console.log('Pattern analysis completed:', analysis);
console.log('Pattern execution completed:', result);
```

### **Performance Monitoring**

```typescript
// Monitor execution times
if (result.executionTime > 1000) {
  console.warn('Slow regex pattern:', pattern, result.executionTime + 'ms');
}
```

## 📝 License

MIT License - see the LICENSE file for details.

## 🤝 Contributions

Contributions are welcome. Please:

1. Create an issue to discuss changes
2. Fork the repository
3. Create a feature branch
4. Send a pull request

## 📚 Additional Resources

- [OWASP Regular Expression Denial of Service](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)
- [MDN Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Angular Security Best Practices](https://angular.io/guide/security)

---

**⚠️ Warning**: This package helps prevent ReDoS but does not replace other security practices. Always validate and sanitize user inputs.
