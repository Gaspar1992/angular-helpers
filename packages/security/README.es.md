[Read in English](./README.md)

🌐 **Documentación y Demo**: https://gaspar1992.github.io/angular-helpers/

# Angular Security Helpers

Paquete de seguridad para aplicaciones Angular que previene ataques comunes como ReDoS (Regular Expression Denial of Service) usando Web Workers para ejecución segura.

## 🛡️ Características

### **Prevención de ReDoS**

- **Ejecución en Web Worker**: Las expresiones regulares se ejecutan en un hilo separado.
- **Timeout Configurable**: Previene ejecuciones infinitas.
- **Análisis de Complejidad**: Detecta patrones peligrosos antes de la ejecución.
- **Modo Seguro**: Solo permite patrones verificados como seguros.

### **Patrón Builder**

- **API Fluida**: Construye expresiones regulares de forma intuitiva.
- **Encadenamiento de Métodos**: `.pattern().group().quantifier()`
- **Validación en Tiempo Real**: Análisis de seguridad durante la construcción.

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
      safeMode: false,
    }),
  ],
});
```

### **Inyección de Servicios**

```typescript
import { RegexSecurityService } from '@angular-helpers/security';

export class MyComponent {
  private securityService = inject(RegexSecurityService);

  async validateInput() {
    const pattern = '(.+)+'; // Patrón potencialmente peligroso
    const text = 'texto de prueba';

    try {
      const result = await this.securityService.testRegex(pattern, text, {
        timeout: 5000,
        safeMode: true,
      });

      console.log('Coincidencia:', result.match);
      console.log('Tiempo de ejecución:', result.executionTime);
    } catch (error) {
      console.error('Error de validación:', error);
    }
  }
}
```

### **Uso del Builder**

```typescript
import { RegexSecurityService } from '@angular-helpers/security';

const { pattern, security } = RegexSecurityService.builder()
  .startOfLine()
  .characterSet('0-9')
  .quantifier('+')
  .endOfLine()
  .timeout(3000)
  .safeMode()
  .build();

// Ejecutar usando el servicio
const result = await RegexSecurityService.builder()
  .pattern('\\d+')
  .timeout(3000)
  .execute('12345', this.securityService);
```

## 📊 Niveles de Riesgo

| Nivel          | Descripción          | Acción                                   |
| -------------- | -------------------- | ---------------------------------------- |
| 🟢 **Bajo**    | Patrones seguros     | Ejecución normal                         |
| 🟡 **Medio**   | Posible riesgo       | Advertencia + timeout                    |
| 🟠 **Alto**    | Riesgo significativo | Timeout estricto + safe mode recomendado |
| 🔴 **Crítico** | Patrones peligrosos  | Bloqueo por defecto                      |

## 🔧 Configuración Avanzada

```typescript
provideSecurity({
  enableRegexSecurity: true,
  defaultTimeout: 5000,
  safeMode: false,
  maxComplexity: 1000,
  allowCatastrophicPatterns: false,
});
```

## 📄 Licencia

MIT
