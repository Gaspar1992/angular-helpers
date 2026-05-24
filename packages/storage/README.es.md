# 📐 @angular-helpers/storage

Un sistema premium, seguro y de alto rendimiento para almacenamiento reactivo en Angular. Combina un L1 Cache síncrono (Signal en memoria) con múltiples motores de persistencia asíncrona L2 (Cache API, IndexedDB, Local/SessionStorage) con cifrado AES-GCM (WebCrypto) opcional, compresión **TOON** y gestión reactiva de entidades con granularidad quirúrgica a nivel de clave.

---

## ⚡ El Camino Rápido (Quick Path)

### 1. Importación e Inyección

```typescript
import { injectStorageSignal, injectEntityStore } from '@angular-helpers/storage';
```

### 2. Almacenamiento Reactivo Sencillo (L1 síncrono + L2 Cache API)

```typescript
// Signal síncrono que persiste en background usando Cache API nativo
const userPref = injectStorageSignal('user-pref', 'light-mode', {
  storageType: 'cacheapi',
  serializer: 'json',
});

// Lectura directa (maneja automáticamente estados de carga asíncronos)
console.log(userPref()); // 'light-mode'

// Consultar metadatos mediante sub-signals
console.log(userPref.loading()); // true | false
console.log(userPref.error()); // Error | null

// Escritura reactiva - persiste automáticamente en background
userPref.set('dark-mode');
```

### 3. Validación Segura y Prevención de Schema Drift

```typescript
// Protegé tu estado contra cambios estructurales (versiones de app) en storage
const userPref = injectStorageSignal('user-pref', 'light-mode', {
  storageType: 'local',
  serializer: 'json',
  validator: (data): data is 'light-mode' | 'dark-mode' =>
    data === 'light-mode' || data === 'dark-mode',
});
```

Si el motor de persistencia L2 contiene un valor corrupto o desactualizado que no aprueba la validación:

1. El Signal vuelve automáticamente a su valor seguro por defecto (`'light-mode'`).
2. El sub-signal de error `userPref.error()` emite un error de validación descriptivo.
3. El sistema **auto-repara** la persistencia local reescribiendo la base de datos con el valor por defecto de forma transparente.

---

### 4. Store de Entidades de Alta Performance

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
}

const productStore = injectEntityStore<string, Product>({
  idKey: 'id',
  persistKey: 'products-cache',
  storageOptions: {
    storageType: 'indexeddb',
    serializer: 'toon', // ¡Comprime el tamaño de los datos hasta un 60%!
  },
});

// 1. Escritura optimizada con congelamiento inmediato (Write-Once, Freeze-Once)
productStore.setOne({ id: 'P1', name: 'Laptop', price: 999 });

// 2. Actualización Parcial (Patch)
productStore.patch('P1', { price: 899 });

// 3. Actualización mediante función (Update)
productStore.update('P1', (p) => ({ ...p, price: p.price * 1.1 }));

// 4. Lectura 100% inmutable y segura
const laptop = productStore.entities().get('P1');
// laptop.price = 1000; // ❌ Explota en runtime y arroja error en el compilador de TS!

// 5. Reactividad Quirúrgica / Granular
// Este computed SOLO se re-evalúa si cambia el producto 'P1'.
// Modificaciones sobre el producto 'P2' NO dispararán re-evaluaciones aquí.
const productSignal = productStore.entitySignal('P1');
const laptopName = computed(() => productSignal()?.name);
```

---

## 🔬 Bajando a los Fierros (Bajo el Capó)

| Característica             | Estrategia Técnica                              | Beneficio de Diseño                                                                                      |
| :------------------------- | :---------------------------------------------- | :------------------------------------------------------------------------------------------------------- |
| **Transporte Desacoplado** | Interfaz `StorageTransport` pluggable           | Lanzamos un MVP local hoy, y migramos a **Shared Workers** mañana sin cambiar una línea de código de UI. |
| **Cache API nativo**       | Acceso directo a `window.caches`                | Evita congelar el hilo principal parseando JSON pesados nativamente mediante `Response.json()`.          |
| **Write-Once Freeze-Once** | `Object.freeze` aplicado únicamente al escribir | Inmutabilidad absoluta sin pagar penalizaciones de rendimiento ni alocación en lecturas frecuentes.      |
| **Compresión TOON**        | Serializador compacto por tokens                | Reduce los payloads repetitivos entre un 30% y 60%, superando la cuota de 5MB de local storage.          |
| **WebCrypto AES-GCM**      | Criptografía asíncrona nativa de browser        | Cifra datos sensibles a nivel de hardware con velocidad récord y sin dependencias externas.              |

---

## 🛠️ Lista de Verificación (Checklist)

- [ ] **Inmutabilidad estricta**: Intentar mutar el mapa `entities` mediante casts a `any` arroja un `TypeError` explícito en runtime.
- [ ] **Fuga de memoria cero**: La suscripción multitab (`onChange`) se destruye automáticamente mediante el ciclo `DestroyRef` de Angular.
- [ ] **Modo Incógnito Blindado**: El sistema captura bloqueos de cuota o IndexedDB desactivados (ej. Safari Private) y hace fallback elegante al valor por defecto.
