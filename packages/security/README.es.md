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

### **Web Crypto API**

- **Cifrado/Descifrado**: Soporte AES-GCM para manejo seguro de datos
- **Hashing**: SHA-256 y otros algoritmos
- **Gestión de Claves**: Generar, importar y exportar claves criptográficas
- **Aleatorio Seguro**: Valores aleatorios criptográficamente seguros

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

### **WebCryptoService**

```typescript
import { WebCryptoService } from '@angular-helpers/security';

export class SecureStorageComponent {
  private cryptoService = inject(WebCryptoService);

  async hashPassword(password: string): Promise<string> {
    return await this.cryptoService.hash(password, 'SHA-256');
  }

  async encryptData(
    data: string,
  ): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array; key: CryptoKey }> {
    const key = await this.cryptoService.generateAesKey(256);
    const { ciphertext, iv } = await this.cryptoService.encryptAes(key, data);
    return { ciphertext, iv, key };
  }

  async decryptData(ciphertext: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<string> {
    return await this.cryptoService.decryptAes(key, ciphertext, iv);
  }

  async exportKeyForStorage(key: CryptoKey): Promise<JsonWebKey> {
    return await this.cryptoService.exportKey(key);
  }

  async importKeyFromStorage(jwk: JsonWebKey): Promise<CryptoKey> {
    return await this.cryptoService.importAesKey(jwk);
  }

  generateSecureToken(length: number = 32): string {
    const bytes = this.cryptoService.generateRandomBytes(length);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  generateUUID(): string {
    return this.cryptoService.randomUUID();
  }
}
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
