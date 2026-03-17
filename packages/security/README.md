# Angular Security Helpers

Paquete de seguridad para aplicaciones Angular que previene ataques comunes como ReDoS (Regular Expression Denial of Service) utilizando Web Workers para ejecución segura.

## 🛡️ Características

### **Prevención de ReDoS**
- **Ejecución en Web Worker**: Las expresiones regulares se ejecutan en un thread separado
- **Timeout configurable**: Previene ejecuciones infinitas
- **Análisis de complejidad**: Detecta patrones peligrosos antes de ejecutar
- **Modo seguro**: Solo permite patrones verificados como seguros

### **Builder Pattern**
- **API fluida**: Construye expresiones regulares de forma intuitiva
- **Encadenamiento de métodos**: `.pattern().group().quantifier()`
- **Validación en tiempo real**: Análisis de seguridad durante la construcción

## 📦 Instalación

```bash
npm install @angular-helpers/security
```

## 🚀 Uso Básico

### **Configuración**

```typescript
import { provideSecurity } from '@angular-helpers/security';

bootstrapApplication(AppComponent, {
  providers: [
    provideSecurity({
      enableRegexSecurity: true,
      defaultTimeout: 5000,
      safeMode: false
    })
  ]
});
```

### **Inyección del Servicio**

```typescript
import { RegexSecurityService } from '@angular-helpers/security';

@Component({...})
export class MyComponent {
  constructor(private regexSecurity: RegexSecurityService) {}
}
```

## 📖 Ejemplos de Uso

### **1. Test Básico de Expresión Regular**

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
import { RegexSecurityBuilder } from '@angular-helpers/security';

// Construcción fluida de expresión regular
const emailRegex = RegexSecurityBuilder
  .builder()
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

// Ejecución directa
const result = await RegexSecurityBuilder
  .builder()
  .pattern('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$')
  .timeout(3000)
  .execute(email, this.regexSecurity);
```

### **3. Análisis de Seguridad**

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

### **4. Validación de Formularios**

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
    // Builder pattern para validación compleja
    const result = await RegexSecurityBuilder
      .builder()
      .startOfLine()
      .nonCapturingGroup('[a-zA-Z]') // Primer letra
      .characterSet('a-zA-Z0-9_') // Caracteres permitidos
      .quantifier('{2,19}') // Entre 3 y 20 caracteres total
      .endOfLine()
      .timeout(2000)
      .execute(input, this.regexSecurity);
    
    return result.match;
  }
}
```

## 🔧 Configuración Avanzada

### **Opciones de Seguridad**

```typescript
interface RegexSecurityConfig {
  timeout?: number;        // Timeout en ms (default: 5000)
  maxComplexity?: number;  // Complejidad máxima (default: 10)
  allowBacktracking?: boolean; // Permitir backtracking (default: false)
  safeMode?: boolean;      // Modo seguro (default: false)
}
```

### **Builder Options**

```typescript
interface RegexBuilderOptions {
  global?: boolean;      // Flag 'g'
  ignoreCase?: boolean;  // Flag 'i'
  multiline?: boolean;   // Flag 'm'
  dotAll?: boolean;      // Flag 's'
  unicode?: boolean;     // Flag 'u'
  sticky?: boolean;      // Flag 'y'
}
```

## 🛡️ Características de Seguridad

### **Detección de Patrones Peligrosos**

El servicio detecta automáticamente:

- **Cuantificadores anidados**: `**`, `++` (catastrófico backtracking)
- **Lookaheads/lookbehinds**: `(?=)`, `(?!)`, `(?<=)`, `(?<!)`
- **Grupos atómicos**: `(?>)`
- **Patrones recursivos**: Anidación profunda de grupos
- **Cuantificadores complejos**: `{n,m}` con valores altos
- **Comodines codiciosos**: `.*`, `.+` con caracteres variables

### **Niveles de Riesgo**

- **🟢 Low**: Patrones simples y seguros
- **🟡 Medium**: Patrones con lookahead/lookbehind
- **🟠 High**: Patrones con cuantificadores complejos
- **🔴 Critical**: Patrones con backtracking catastrófico

### **Prevención de Ataques**

- **Timeout**: Detiene ejecución después del tiempo límite
- **Web Worker**: Aísla la ejecución del thread principal
- **Análisis previo**: Rechaza patrones peligrosos antes de ejecutar
- **Límite de matches**: Previene bucles infinitos

## 📊 Métricas y Monitoreo

### **Resultados de Ejecución**

```typescript
interface RegexTestResult {
  match: boolean;           // Si hubo match
  matches?: RegExpMatchArray[]; // Todos los matches encontrados
  groups?: { [key: string]: string }; // Grupos capturados
  executionTime: number;    // Tiempo de ejecución en ms
  timeout: boolean;         // Si hubo timeout
  error?: string;          // Error si ocurrió
}
```

### **Análisis de Seguridad**

```typescript
interface RegexSecurityResult {
  safe: boolean;           // Si el patrón es seguro
  complexity: number;      // Nivel de complejidad (0-∞)
  risk: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];      // Advertencias de seguridad
  recommendations: string[]; // Recomendaciones de mejora
}
```

## 🔄 Integración con Formularios

### **Validadores Angular**

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
        return { securePattern: { value, reason: error.message } };
      }
    };
  }
}
```

### **Uso en Template Forms**

```typescript
@Component({...})
export class SecureFormComponent {
  constructor(
    private regexSecurity: RegexSecurityService,
    private securityValidators: SecurityValidators
  ) {}
  
  emailValidator = this.securityValidators.securePattern(
    '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    { timeout: 3000, safeMode: true }
  );
}
```

## 🚨 Mejores Prácticas

### **1. Usar Safe Mode en Producción**

```typescript
// En producción, siempre usa safeMode
const config = { safeMode: true, timeout: 3000 };
```

### **2. Timeout Apropiado**

```typescript
// Para validaciones de formulario: 1-3 segundos
// Para procesamiento de texto: 5-10 segundos
// Nunca más de 30 segundos
```

### **3. Análisis Previo**

```typescript
// Siempre analiza patrones用户提供
const analysis = await this.regexSecurity.analyzePatternSecurity(pattern);
if (!analysis.safe) {
  // Considera usar un patrón alternativo más seguro
}
```

### **4. Manejo de Errores**

```typescript
try {
  const result = await this.regexSecurity.testRegex(pattern, text, config);
  // Procesar resultado
} catch (error) {
  // Manejar error de forma segura
  console.error('Regex security error:', error);
  // Fallback a validación más simple
}
```

## 🔍 Depuración

### **Logging de Seguridad**

El servicio incluye logging automático:

```typescript
// Habilita logging detallado
console.log('Regex security initialized');
console.log('Pattern analysis completed:', analysis);
console.log('Pattern execution completed:', result);
```

### **Monitoreo de Performance**

```typescript
// Monitorea tiempos de ejecución
if (result.executionTime > 1000) {
  console.warn('Slow regex pattern:', pattern, result.executionTime + 'ms');
}
```

## 📝 Licencia

MIT License - ver archivo LICENSE para detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Crea un issue para discutir cambios
2. Haz fork del repositorio
3. Crea una rama feature
4. Envía un pull request

## 📚 Recursos Adicionales

- [OWASP Regular Expression Denial of Service](https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS)
- [MDN Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [Angular Security Best Practices](https://angular.io/guide/security)

---

**⚠️ Advertencia**: Este paquete ayuda a prevenir ReDoS pero no reemplaza otras prácticas de seguridad. Siempre valida y sanea las entradas de usuario.
