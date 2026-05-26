# Filosofía de Diseño: Accesibilidad Universal y Abstracciones de Alto Nivel

Este documento establece la directriz oficial y la convención de diseño para la evolución del paquete `@angular-helpers/browser-web-apis`.

---

## 1. El Manifiesto: Más Allá de Envoltorios Simples (Wrappers)

Las APIs de los navegadores son potentes, pero crudas. Exponer un servicio `GeolocationService` o un `SpeechSynthesisService` es útil, pero **insuficiente**. El verdadero valor de esta librería radica en proveer **soluciones accesibles de alto nivel (productos derivados)** que resuelvan problemas del mundo real para los usuarios finales, especialmente aquellos con capacidades diferentes (visuales, motrices, cognitivas).

A partir de la implementación de la **Speech Recognition API**, adoptamos el siguiente compromiso:

> [!IMPORTANT]
> **Toda API implementada en esta librería debe aspirar a tener un producto derivado (directiva, helper de composición, componente o servicio inteligente) enfocado en la usabilidad y la accesibilidad universal (a11y).**

---

## 2. Pautas Generales de Accesibilidad (a11y) para APIs Web

Cuando diseñemos o mejoremos las APIs existentes, debemos integrar las siguientes mecánicas:

### A. Anuncios por Lectores de Pantalla (`aria-live`)

Cualquier API que cambie estados en segundo plano de manera invisible o asíncrona (como Geolocation, IdleDetector, SpeechRecognition o Bluetooth) debe ofrecer soporte nativo o directivas para anunciar de forma audible estos cambios.

- **Ejemplo**: Un contenedor invisible con `aria-live="polite"` que informe al usuario invidente cuando el sistema está geolocalizando ("Localizando tu posición...") o cuando ha terminado ("Ubicación actualizada").

### B. Accesibilidad de Teclado y Foco

Toda interacción debe ser ejecutable 100% mediante teclado.

- Las directivas que capturen o inicien flujos (como abrir la cámara, iniciar dictado o disparar compartir/web-share) deben vincularse a atajos de teclado configurables (`Alt + Key`) y gestionar de manera correcta el foco del navegador al abrir/cerrar interfaces.

### C. Estados Semánticos Claros (ARIA)

Controlar dinámicamente atributos como:

- `aria-busy="true"` cuando una API está cargando o procesando en segundo plano (ej: leyendo un archivo pesado con `FileSystemAccess`, buscando dispositivos BLE).
- `aria-expanded` o `aria-hidden` para elementos interactivos visuales derivados.

---

## 3. Hoja de Ruta para APIs ya Implementadas

Aplicaremos esta filosofía de forma progresiva sobre las APIs que ya forman parte de la librería:

| API Existente          | Enfoque de Accesibilidad / Producto Derivado a Desarrollar                                                                                                                                |
| :--------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Geolocation**        | Directiva de rastreo audible para navegación a ciegas con anuncios `aria-live` detallando cambios de coordenadas o precisión.                                                             |
| **Screen Wake Lock**   | Directiva que avise sonoramente o al lector de pantalla antes de liberar el bloqueo de pantalla para evitar pérdidas de foco inesperadas.                                                 |
| **Clipboard**          | Directiva de copiado con confirmación por lector de pantalla de qué texto exacto fue copiado, asegurando que se anuncie en entornos dinámicos.                                            |
| **Battery**            | Un monitor de batería inteligente para personas con discapacidades motoras que sugiera apagar animaciones pesadas o active modos de alto contraste cuando la batería esté baja (`< 15%`). |
| **File System Access** | Helpers de drag-and-drop con soporte total de teclado (`Tab` + `Space` + `Enter`) y anuncios en vivo de la carga de archivos.                                                             |
| **Eye Dropper**        | Herramienta de selección de color que anuncie en voz alta el nombre aproximado del color (no solo el HEX) usando el sintetizador de voz integrado para diseñadores con daltonismo.        |

---

_Adoptado y documentado con orgullo como estándar de arquitectura._
