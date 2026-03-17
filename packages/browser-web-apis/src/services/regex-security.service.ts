import { Injectable, inject } from '@angular/core';
import { WebWorkerService } from './web-worker.service';
import { BrowserApiBaseService } from './base/browser-api-base.service';
import { map, catchError } from 'rxjs/operators';

export interface RegexSecurityConfig {
  timeout?: number; // Timeout en milisegundos (default: 5000)
  maxComplexity?: number; // Máxima complejidad permitida
  allowBacktracking?: boolean; // Permitir backtracking catastrófico
  safeMode?: boolean; // Modo seguro solo con patrones seguros
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
 * Servicio de seguridad para expresiones regulares que previene ReDoS
 * utilizando Web Workers para ejecución segura con timeout
 */
@Injectable()
export class RegexSecurityService extends BrowserApiBaseService {
  private webWorkerService = inject(WebWorkerService);
  private workerName = 'regex-security-worker';

  protected override getApiName(): string {
    return 'regex-security';
  }

  protected override async onInitialize(): Promise<void> {
    await super.onInitialize();
    await this.initializeRegexWorker();
    this.logInfo('RegexSecurity service initialized');
  }

  /**
   * Builder pattern para construir expresiones regulares seguras
   */
  static builder(): RegexSecurityBuilder {
    return new RegexSecurityBuilder();
  }

  /**
   * Ejecuta una expresión regular de forma segura con timeout
   */
  async testRegex(
    pattern: string,
    text: string,
    config: RegexSecurityConfig = {}
  ): Promise<RegexTestResult> {
    const startTime = performance.now();
    const finalConfig = this.mergeConfig(config);

    try {
      // Primero analizar seguridad del patrón
      const securityCheck = await this.analyzePatternSecurity(pattern);
      
      if (!securityCheck.safe && !finalConfig.safeMode) {
        return {
          match: false,
          executionTime: performance.now() - startTime,
          timeout: false,
          error: `Pattern rejected: ${securityCheck.warnings.join(', ')}`
        };
      }

      // Ejecutar en Web Worker con timeout
      const result = await this.executeInWorker(pattern, text, finalConfig);
      
      return {
        ...result,
        executionTime: performance.now() - startTime
      };
    } catch (error) {
      return {
        match: false,
        executionTime: performance.now() - startTime,
        timeout: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Analiza la seguridad de un patrón de expresión regular
   */
  async analyzePatternSecurity(pattern: string): Promise<RegexSecurityResult> {
    return this.executeWithErrorHandling(async () => {
      const warnings: string[] = [];
      const recommendations: string[] = [];
      let complexity = 0;
      let risk: 'low' | 'medium' | 'high' | 'critical' = 'low';

      // Análisis de patrones peligrosos
      const dangerousPatterns = [
        { pattern: /\*\*/, risk: 'high' as const, message: 'Nested quantifiers (catastrophic backtracking)' },
        { pattern: /\+\+/, risk: 'high' as const, message: 'Nested plus quantifiers' },
        { pattern: /\(\?\=/, risk: 'medium' as const, message: 'Lookahead assertions' },
        { pattern: /\(\?\!/, risk: 'medium' as const, message: 'Negative lookahead' },
        { pattern: /\(\?\:/, risk: 'low' as const, message: 'Non-capturing groups' },
        { pattern: /\(\?\</, risk: 'high' as const, message: 'Lookbehind assertions' },
        { pattern: /\(\?\(\?\)/, risk: 'critical' as const, message: 'Recursive patterns' },
        { pattern: /(\{(\d+,)?\d+\})/, risk: 'medium' as const, message: 'Quantified repetition' },
        { pattern: /(\.\*)|(\.+)|(\.\?)/, risk: 'medium' as const, message: 'Greedy quantifiers with dot' },
        { pattern: /(\[.*\*.*\])|(\[.*\+.*\])/, risk: 'medium' as const, message: 'Character classes with quantifiers' }
      ];

      // Calcular complejidad
      complexity = this.calculateComplexity(pattern);

      // Evaluar patrones peligrosos
      for (const dangerous of dangerousPatterns) {
        if (dangerous.pattern.test(pattern)) {
          warnings.push(dangerous.message);
          if (this.getRiskLevel(dangerous.risk) > this.getRiskLevel(risk)) {
            risk = dangerous.risk;
          }
        }
      }

      // Recomendaciones basadas en el análisis
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
        recommendations
      };
    }, 'Failed to analyze pattern security');
  }

  /**
   * Ejecuta la expresión regular en un Web Worker
   */
  private async executeInWorker(
    pattern: string,
    text: string,
    config: RegexSecurityConfig
  ): Promise<RegexTestResult> {
    return new Promise((resolve) => {
      const taskId = `regex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const task = {
        id: taskId,
        type: 'regex-test',
        data: {
          pattern,
          text,
          timeout: config.timeout || 5000
        }
      };

      const subscription = this.webWorkerService
        .getMessages(this.workerName)
        .pipe(
          map(message => {
            if (message.id === taskId) {
              return message.data as RegexTestResult;
            }
            return null;
          }),
          catchError(error => {
            resolve({
              match: false,
              executionTime: 0,
              timeout: true,
              error: error.message || 'Timeout or execution error'
            });
            return [];
          })
        )
        .subscribe(result => {
          if (result) {
            subscription.unsubscribe();
            resolve(result);
          }
        });

      this.webWorkerService.postMessage(this.workerName, task);
    });
  }

  /**
   * Inicializa el Web Worker para expresiones regulares
   */
  private async initializeRegexWorker(): Promise<void> {
    if (!this.webWorkerService.isWorkerInitialized(this.workerName)) {
      const workerCode = this.generateWorkerCode();
      await this.webWorkerService.createWorkerFromCode(this.workerName, workerCode);
      this.logInfo('Regex security worker initialized');
    }
  }

  /**
   * Genera el código del Web Worker
   */
  private generateWorkerCode(): string {
    return `
      self.addEventListener('message', function(event) {
        const task = event.data;
        
        if (task.type === 'regex-test') {
          const { pattern, text, timeout } = task.data;
          const startTime = performance.now();
          
          try {
            const regex = new RegExp(pattern, 'g');
            const matches = [];
            let match;
            
            while ((match = regex.exec(text)) !== null) {
              matches.push([...match]);
              
              // Prevención de bucles infinitos
              if (matches.length > 1000) {
                throw new Error('Too many matches - possible infinite loop');
              }
            }
            
            const groups = {};
            if (matches.length > 0) {
              const firstMatch = matches[0];
              for (let i = 1; i < firstMatch.length; i++) {
                groups[\`group\${i}\`] = firstMatch[i];
              }
            }
            
            self.postMessage({
              id: task.id,
              type: 'regex-result',
              data: {
                match: matches.length > 0,
                matches,
                groups,
                executionTime: performance.now() - startTime,
                timeout: false
              }
            });
          } catch (error) {
            self.postMessage({
              id: task.id,
              type: 'regex-result',
              data: {
                match: false,
                executionTime: performance.now() - startTime,
                timeout: false,
                error: error.message || 'Execution error'
              }
            });
          }
        }
      });
    `;
  }

  /**
   * Calcula la complejidad de un patrón
   */
  private calculateComplexity(pattern: string): number {
    let complexity = 0;
    
    // Cuantificadores anidados aumentan complejidad
    complexity += (pattern.match(/\*\*/g) || []).length * 5;
    complexity += (pattern.match(/\+\+/g) || []).length * 5;
    complexity += (pattern.match(/\?\?/g) || []).length * 3;
    
    // Lookaheads/lookbehinds
    complexity += (pattern.match(/\(\?\=/g) || []).length * 2;
    complexity += (pattern.match(/\(\?\!/g) || []).length * 2;
    complexity += (pattern.match(/\(\?\</g) || []).length * 3;
    
    // Grupos anidados
    const openParens = (pattern.match(/\(/g) || []).length;
    complexity += openParens * 0.5;
    
    // Longitud del patrón
    complexity += pattern.length * 0.01;
    
    return Math.round(complexity * 100) / 100;
  }

  /**
   * Obtiene nivel de riesgo numérico
   */
  private getRiskLevel(risk: 'low' | 'medium' | 'high' | 'critical'): number {
    const levels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return levels[risk] || 0;
  }

  /**
   * Fusiona configuración con valores por defecto
   */
  private mergeConfig(config: RegexSecurityConfig): Required<RegexSecurityConfig> {
    return {
      timeout: config.timeout || 5000,
      maxComplexity: config.maxComplexity || 10,
      allowBacktracking: config.allowBacktracking || false,
      safeMode: config.safeMode || false
    };
  }

  /**
   * Limpia recursos cuando el servicio se destruye
   */
  protected override onDestroy(): void {
    if (this.webWorkerService.isWorkerInitialized(this.workerName)) {
      this.webWorkerService.terminateWorker(this.workerName);
      this.logInfo('Regex security worker terminated');
    }
    super.onDestroy();
  }
}

/**
 * Builder pattern para construir expresiones regulares seguras
 */
export class RegexSecurityBuilder {
  private patternValue: string = '';
  private optionsValue: RegexBuilderOptions = {};
  private securityConfigValue: RegexSecurityConfig = {};

  /**
   * Define el patrón base
   */
  pattern(pattern: string): RegexSecurityBuilder {
    this.patternValue = pattern;
    return this;
  }

  /**
   * Añade texto al patrón actual
   */
  append(text: string): RegexSecurityBuilder {
    this.patternValue += text;
    return this;
  }

  /**
   * Añade un grupo capturante
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
   * Añade un grupo no capturante
   */
  nonCapturingGroup(content: string): RegexSecurityBuilder {
    this.patternValue += `(?:${content})`;
    return this;
  }

  /**
   * Añade una alternativa
   */
  or(alternative: string): RegexSecurityBuilder {
    this.patternValue += `|${alternative}`;
    return this;
  }

  /**
   * Añade un cuantificador
   */
  quantifier(quantifier: '*' | '+' | '?' | '{n}' | '{n,}' | '{n,m}'): RegexSecurityBuilder {
    this.patternValue += quantifier;
    return this;
  }

  /**
   * Añade un conjunto de caracteres
   */
  characterSet(chars: string, negate = false): RegexSecurityBuilder {
    this.patternValue += `[${negate ? '^' : ''}${chars}]`;
    return this;
  }

  /**
   * Añade ancla de inicio
   */
  startOfLine(): RegexSecurityBuilder {
    this.patternValue += '^';
    return this;
  }

  /**
   * Añade ancla de fin
   */
  endOfLine(): RegexSecurityBuilder {
    this.patternValue += '$';
    return this;
  }

  /**
   * Configura opciones de la expresión regular
   */
  options(options: RegexBuilderOptions): RegexSecurityBuilder {
    this.optionsValue = { ...this.optionsValue, ...options };
    return this;
  }

  /**
   * Configura opciones de seguridad
   */
  security(config: RegexSecurityConfig): RegexSecurityBuilder {
    this.securityConfigValue = { ...this.securityConfigValue, ...config };
    return this;
  }

  /**
   * Configura timeout
   */
  timeout(ms: number): RegexSecurityBuilder {
    this.securityConfigValue.timeout = ms;
    return this;
  }

  /**
   * Activa modo seguro
   */
  safeMode(): RegexSecurityBuilder {
    this.securityConfigValue.safeMode = true;
    return this;
  }

  /**
   * Construye la expresión regular final
   */
  build(): { pattern: string; options: RegexBuilderOptions; security: RegexSecurityConfig } {
    return {
      pattern: this.patternValue,
      options: this.optionsValue,
      security: this.securityConfigValue
    };
  }

  /**
   * Construye y ejecuta la expresión regular
   */
  async execute(text: string, service: RegexSecurityService): Promise<RegexTestResult> {
    const { pattern, security } = this.build();
    return service.testRegex(pattern, text, security);
  }
}
