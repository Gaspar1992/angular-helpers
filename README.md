# 🚀 Angular Helpers

Suite de librerías Angular especializadas para potenciar tus aplicaciones con seguridad, acceso a APIs del navegador y utilidades avanzadas.

---

## 📦 **Packages Disponibles**

### 🔐 **@angular-helpers/security**  
*Seguridad avanzada para expresiones regulares y prevención de ataques ReDoS*

**🎯 Problema que resuelve:**
- **ReDoS (Regular Expression Denial of Service)** - Ataques que pueden colapsar tu servidor con patrones maliciosos
- **Validación de patrones complejos** sin comprometer el rendimiento
- **Ejecución segura** de expresiones regulares con timeout y análisis de seguridad

**✨ Características principales:**
- 🛡️ **Prevención de ReDoS** - Análisis automático de patrones peligrosos
- ⚡ **Ejecución con Web Workers** - Sin bloqueo del hilo principal
- 🕐 **Timeout configurable** - Protección contra patrones lentos
- 📊 **Análisis de complejidad** - Métricas de riesgo y recomendaciones
- 🏗️ **Builder Pattern** - API fluida para construcción de patrones seguros

**💡 Casos de uso:**
```typescript
// Validación segura de input de usuario
const result = await securityService.testRegex(userInput, text, {
  timeout: 5000,
  safeMode: true
});

// Builder pattern para patrones complejos
const pattern = RegexSecurityService.builder()
  .pattern('\\d+')
  .timeout(3000)
  .safeMode(true)
  .build();
```

**📥 Instalación:**
```bash
npm install @angular-helpers/security
```

---

### 🌐 **@angular-helpers/browser-web-apis**  
*Acceso unificado y seguro a las APIs del navegador con soporte para permisos y gestión de errores*

**🎯 Problema que resuelve:**
- **Fragmentación de APIs** - Cada navegador implementa las APIs de manera diferente
- **Gestión de permisos** - Proceso complejo y repetitivo para solicitar permisos
- **Detección de compatibilidad** - Código boilerplate para verificar soporte
- **Manejo de errores** - Diferentes tipos de errores entre navegadores

**✨ Características principales:**
- 📸 **Cámara** - Captura de fotos y video con gestión de permisos
- 🗺️ **Geolocalización** - GPS y watch position con manejo de errores
- 🔔 **Notificaciones** - Sistema de notificaciones del navegador
- 📋 **Clipboard** - Copiar/pegar texto e imágenes
- 🎥 **Media Devices** - Enumeración de cámaras y micrófonos
- 🔐 **Gestión de permisos** - API centralizada para todos los permisos
- 📱 **Sensores** - Orientación, movimiento y batería
- 🌍 **Soporte universal** - Detección automática de compatibilidad

**💡 Casos de uso:**
```typescript
// Acceso a cámara con permisos automáticos
async takePhoto() {
  if (await this.cameraService.requestPermission()) {
    const photo = await this.cameraService.capturePhoto();
    console.log('Foto capturada:', photo);
  }
}

// Geolocalización con watch
this.geolocationService.watchPosition({
  enableHighAccuracy: true,
  timeout: 10000
}).subscribe(position => {
  console.log('Ubicación actual:', position);
});
```

**📥 Instalación:**
```bash
npm install @angular-helpers/browser-web-apis
```

---

## 🎯 **¿Por qué Angular Helpers?**

### ⚡ **Productividad Inmediata**
- **APIs unificadas** - No más código boilerplate para cada navegador
- **TypeScript completo** - Tipado estricto y autocompletado
- **Documentación integrada** - Cada método incluye ejemplos y casos de uso
- **Testing incluido** - Suite de tests completa para cada package

### 🛡️ **Seguridad por Defecto**
- **Prevención de ataques** - Protección contra ReDoS y otras vulnerabilidades
- **Validación de permisos** - Gestión segura de APIs sensibles
- **Contextos aislados** - Ejecución segura con Web Workers
- **Manejo de errores** - Gestión robusta de casos límite

### 🔄 **Actualizaciones Constantes**
- **Angular moderno** - Compatible con las últimas versiones de Angular
- **Navegadores actuales** - Soporte para Chrome, Firefox, Safari, Edge
- **Mantenimiento activo** - Corrección de bugs y nuevas funcionalidades

---

## 🚀 **Empezar Rápido**

### **Instalación del Workspace**
```bash
# Clonar el repositorio
git clone https://github.com/angular-helpers/angular-helpers
cd angular-helpers

# Instalar dependencias
npm install

# Iniciar demo
npm run start:https
```

### **Uso en tu Proyecto**
```bash
# Instalar packages deseados
npm install @angular-helpers/security
npm install @angular-helpers/browser-web-apis

# Importar en tu módulo
import { SecurityModule } from '@angular-helpers/security';
import { BrowserWebApisModule } from '@angular-helpers/browser-web-apis';

@NgModule({
  imports: [SecurityModule, BrowserWebApisModule]
})
export class AppModule {}
```

---

## 📊 **Comparativa con Alternativas**

| Característica | Angular Helpers | Implementación Manual | Otras Librerías |
|----------------|------------------|---------------------|------------------|
| **ReDoS Protection** | ✅ Integrado | ❌ Manual | ⚠️ Parcial |
| **Browser APIs** | ✅ Unificadas | ❌ Fragmentadas | ⚠️ Limitadas |
| **TypeScript** | ✅ Completo | ⚠️ Parcial | ❌ Mínimo |
| **Testing** | ✅ Incluido | ❌ Manual | ⚠️ Básico |
| **Documentación** | ✅ Completa | ❌ Inexistente | ⚠️ Básica |
| **Soporte** | ✅ Activo | ❌ Propio | ⚠️ Variable |

---

## 🛠️ **Desarrollo**

### **Scripts Disponibles**
```bash
# Desarrollo con HTTPS (requerido para APIs del navegador)
npm run start:https

# Build de todos los packages
npm run build:packages

# Testing completo
npm run test:packages

# Linting del workspace
npm run lint
```

### **Estructura del Proyecto**
```
angular-helpers/
├── packages/
│   ├── security/           # 📦 @angular-helpers/security
│   └── browser-web-apis/  # 📦 @angular-helpers/browser-web-apis
├── src/                   # 🚀 Aplicación demo
├── docs/                  # 📚 Documentación completa
└── scripts/              # 🔧 Scripts de automatización
```

---

## 📈 **Roadmap**

### **Próximamente** 🚧
- **@angular-helpers/storage** - APIs de almacenamiento unificadas
- **@angular-helpers/network** - Conectividad y estado de red
- **@angular-helpers/performance** - Monitoreo y optimización
- **@angular-helpers/pwa** - Service Workers y características PWA

### **En Desarrollo** 🔄
- **Mejoras de performance** - Optimización de bundle y runtime
- **Más ejemplos** - Casos de uso reales y demos interactivas
- **Integración CLI** - Scaffolding automático para nuevos proyectos

---

## 🤝 **Contribuir**

¡Nos encantaría tu contribución! 

### **Cómo Empezar**
```bash
# Fork del repositorio
git clone https://github.com/tu-usuario/angular-helpers
cd angular-helpers

# Crear rama de feature
git checkout -b feature/nueva-funcionalidad

# Hacer cambios y commits
git commit -m "feat: agregar nueva funcionalidad"

# Push y PR
git push origin feature/nueva-funcionalidad
```

### **Guías de Contribución**
- 📖 [Guía de Desarrollo](./docs/CONTRIBUTING.md)
- 🧪 [Guía de Testing](./docs/testing-guide.md)
- 📦 [Guía de Packages](./docs/package-development.md)

---

## 📄 **Licencia**

MIT License - Ver [LICENSE](./LICENSE) para detalles

---

## 🔗 **Enlaces Útiles**

- **📚 Documentación Completa**: [docs.angular-helpers.dev](https://docs.angular-helpers.dev)
- **🐛 Issues y Feature Requests**: [GitHub Issues](https://github.com/angular-helpers/angular-helpers/issues)
- **💬 Discusiones**: [GitHub Discussions](https://github.com/angular-helpers/angular-helpers/discussions)
- **📦 NPM Packages**: [npmjs.com/org/angular-helpers](https://www.npmjs.com/org/angular-helpers)

---

<div align="center">

**⭐ Si Angular Helpers te ayuda, danos una estrella!**

Made with ❤️ by the Angular Helpers Team

</div>
