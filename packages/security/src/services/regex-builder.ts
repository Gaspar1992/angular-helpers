import { RegexSecurityConfig, RegexBuilderOptions, RegexTestResult } from './regex-types';
import type { RegexSecurityService } from './regex-security.service';

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
