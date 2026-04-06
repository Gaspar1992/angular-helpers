[Read in English](./README.md)

🌐 **Documentación y Demo**: https://gaspar1992.github.io/angular-helpers/

# Angular Security Helpers

Paquete de seguridad para aplicaciones Angular que previene ataques comunes como ReDoS (Regular Expression Denial of Service), XSS, y proporciona utilidades criptográficas usando Web Workers y Web Crypto API para ejecución segura.

> **Versión**: 21.2.0 — [CHANGELOG](./CHANGELOG.md)

---

## 🛡️ Características

### **Prevención de ReDoS**

- **Ejecución en Web Worker**: Las expresiones regulares se ejecutan en un hilo separado.
- **Timeout Configurable**: Previene ejecuciones infinitas.
- **Análisis de Complejidad**: Detecta patrones peligrosos antes de la ejecución.
- **Modo Seguro**: Solo permite patrones verificados como seguros.

### **Web Crypto API**

- **Cifrado/Descifrado**: Soporte AES-GCM para manejo seguro de datos
- **Firmas HMAC**: Firmar y verificar datos con HMAC-SHA256/384/512
- **Hashing**: SHA-256 y otros algoritmos
- **Gestión de Claves**: Generar, importar y exportar claves criptográficas
- **Aleatorio Seguro**: Valores aleatorios criptográficamente seguros
- **Generación UUID**: UUIDs RFC4122 v4

### **Almacenamiento Seguro**

- **Cifrado Transparente**: Almacenamiento cifrado AES-GCM sobre localStorage/sessionStorage
- **Modo Efímero**: Claves en memoria para seguridad de sesión única
- **Modo Passphrase**: Claves derivadas PBKDF2 para persistencia entre sesiones
- **Aislamiento por Namespace**: Organiza datos almacenados con prefijos

### **Sanitización de Input**

- **Prevención XSS**: Limpieza de HTML con lista de permitidos
- **Validación de URLs**: Esquemas de URL seguros
- **Escape de HTML**: Caracteres especiales para interpolación segura
- **JSON Seguro**: Parseo seguro sin eval

### **Fuerza de Contraseña**

- **Puntuación basada en Entropía**: Calcular fuerza en bits de entropía
- **Detección de Contraseñas Comunes**: Bloquear contraseñas débiles conocidas
- **Detección de Patrones**: Detectar patrones de teclado y secuencias
- **Feedback Accionable**: Sugerencias específicas para mejorar

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
      // Servicios core (habilitados por defecto)
      enableRegexSecurity: true,
      enableWebCrypto: true,

      // Nuevos servicios (opt-in, deshabilitados por defecto)
      enableSecureStorage: true,
      enableInputSanitizer: true,
      enablePasswordStrength: true,

      // Configuración global
      defaultTimeout: 5000,
      safeMode: false,
    }),
  ],
});
```

### **Providers Individuales**

```typescript
import {
  provideRegexSecurity,
  provideWebCrypto,
  provideSecureStorage,
  provideInputSanitizer,
  providePasswordStrength,
} from '@angular-helpers/security';

// Usar solo los servicios que necesites
bootstrapApplication(AppComponent, {
  providers: [
    provideSecureStorage({ storage: 'session', pbkdf2Iterations: 600_000 }),
    provideInputSanitizer({ allowedTags: ['b', 'i', 'em', 'strong'] }),
    providePasswordStrength(),
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

  async signAndVerify(data: string): Promise<boolean> {
    // Generar clave HMAC para SHA-256
    const key = await this.cryptoService.generateHmacKey('HMAC-SHA-256');

    // Firmar los datos
    const signature = await this.cryptoService.sign(key, data);

    // Verificar la firma
    return await this.cryptoService.verify(key, data, signature);
  }
}
```

### **SecureStorageService — Almacenamiento Cifrado**

```typescript
import { SecureStorageService } from '@angular-helpers/security';

export class UserSettingsComponent {
  private storage = inject(SecureStorageService);

  async saveUserToken(token: string): Promise<void> {
    // Modo efímero (por defecto): datos sobreviven solo esta sesión
    await this.storage.set('authToken', { token, createdAt: Date.now() });
  }

  async getUserToken(): Promise<{ token: string; createdAt: number } | null> {
    return await this.storage.get<{ token: string; createdAt: number }>('authToken');
  }

  async initWithPassphrase(passphrase: string): Promise<void> {
    // Modo passphrase: datos sobreviven recargas de página
    await this.storage.initWithPassphrase(passphrase);
  }

  async saveWithNamespace(userId: string, data: unknown): Promise<void> {
    // Aislamiento por namespace
    await this.storage.set('profile', data, `user:${userId}`);
  }

  clearUserData(userId: string): void {
    // Limpiar solo los datos de este usuario
    this.storage.clear(`user:${userId}`);
  }
}
```

### **InputSanitizerService — Prevención XSS**

```typescript
import { InputSanitizerService } from '@angular-helpers/security';

export class CommentComponent {
  private sanitizer = inject(InputSanitizerService);

  sanitizeUserComment(html: string): string {
    // Limpiar tags peligrosos, mantener seguros (b, i, em, a, etc.)
    return this.sanitizer.sanitizeHtml(html);
    // Ejemplo: '<b>Hola</b><script>alert(1)</script>' → '<b>Hola</b>'
  }

  validateUserLink(url: string): string | null {
    // Solo permitir URLs http/https
    return this.sanitizer.sanitizeUrl(url);
    // Ejemplo: 'javascript:alert(1)' → null
    // Ejemplo: 'https://example.com' → 'https://example.com/'
  }

  escapeForDisplay(text: string): string {
    // Seguro para nodos de texto HTML
    return this.sanitizer.escapeHtml(text);
    // Ejemplo: '<b>hola</b>' → '&lt;b&gt;hola&lt;/b&gt;'
  }

  parseUserJson(json: string): unknown | null {
    // Parseo seguro de JSON sin eval
    return this.sanitizer.sanitizeJson(json);
  }
}
```

### **PasswordStrengthService — Evaluación de Contraseñas**

```typescript
import { PasswordStrengthService } from '@angular-helpers/security';

export class RegistrationComponent {
  private passwordStrength = inject(PasswordStrengthService);

  checkPasswordStrength(password: string): void {
    const result = this.passwordStrength.assess(password);

    console.log(`Score: ${result.score}/4`); // 0-4
    console.log(`Label: ${result.label}`); // 'very-weak' a 'very-strong'
    console.log(`Entropía: ${result.entropy} bits`); // entropía calculada
    console.log('Feedback:', result.feedback); // sugerencias de mejora

    // Ejemplos de resultados:
    // 'password' → score: 0, label: 'very-weak', feedback: ['Contraseña común']
    // 'P@ssw0rd!' → score: 2, label: 'fair', feedback: ['Evita patrones de teclado']
    // 'xK#9mZ$vLq2@rBnT7' → score: 4, label: 'very-strong', feedback: []
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
