import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { webcrypto } from 'node:crypto';
import { LocalStorageTransport } from './local-transport';
import { SECURE_STORAGE_PASSPHRASE } from '../tokens/storage.tokens';

// Polyfill for JSDOM/HappyDOM lack of subtle crypto support
if (typeof globalThis !== 'undefined' && !globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
    writable: true,
  });
}

describe('LocalStorageTransport', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('debe resolverse con la frase de encriptacion por defecto', () => {
    TestBed.configureTestingModule({});
    const transport = TestBed.inject(LocalStorageTransport);
    expect((transport as any).secretPassphrase).toBe('angular-helpers-secure-storage-passphrase');
  });

  it('debe permitir configurar una frase de encriptacion personalizada', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SECURE_STORAGE_PASSPHRASE, useValue: 'mi-frase-secreta-personalizada' },
      ],
    });
    const transport = TestBed.inject(LocalStorageTransport);
    expect((transport as any).secretPassphrase).toBe('mi-frase-secreta-personalizada');
  });

  it('debe leer y escribir de forma stateless con opciones variables', async () => {
    TestBed.configureTestingModule({});
    const transport = TestBed.inject(LocalStorageTransport);

    // Escribir un valor con encriptación
    await transport.write(
      'confidencial',
      { topSecret: true },
      { storageType: 'local', serializer: 'json', encrypt: true },
    );
    // Escribir otro valor sin encriptación
    await transport.write(
      'publico',
      { topSecret: false },
      { storageType: 'local', serializer: 'json', encrypt: false },
    );

    // Leer el valor encriptado
    const conf = await transport.read<any>('confidencial', {
      storageType: 'local',
      serializer: 'json',
      encrypt: true,
    });
    expect(conf).toEqual({ topSecret: true });

    // Leer el valor público
    const pub = await transport.read<any>('publico', {
      storageType: 'local',
      serializer: 'json',
      encrypt: false,
    });
    expect(pub).toEqual({ topSecret: false });

    // Verificar que el dato confidencial en localStorage está encriptado (no es texto plano visible)
    const rawConf = localStorage.getItem('confidencial');
    expect(rawConf).toBeDefined();
    expect(rawConf).not.toContain('topSecret');

    // Verificar que el dato público en localStorage es JSON visible
    const rawPub = localStorage.getItem('publico');
    expect(rawPub).toContain('"topSecret":false');
  });

  it('debe admitir lecturas y escrituras asincronicas concurrentes sin pisar estados', async () => {
    TestBed.configureTestingModule({});
    const transport = TestBed.inject(LocalStorageTransport);

    // Lanzar escrituras concurrentes con opciones cruzadas en paralelo
    const op1 = transport.write('keyA', 'dataA', {
      storageType: 'local',
      serializer: 'json',
      encrypt: true,
    });
    const op2 = transport.write('keyB', 'dataB', {
      storageType: 'session',
      serializer: 'json',
      encrypt: false,
    });

    await Promise.all([op1, op2]);

    // Leer en paralelo
    const resA = await transport.read<string>('keyA', {
      storageType: 'local',
      serializer: 'json',
      encrypt: true,
    });
    const resB = await transport.read<string>('keyB', {
      storageType: 'session',
      serializer: 'json',
      encrypt: false,
    });

    expect(resA).toBe('dataA');
    expect(resB).toBe('dataB');

    // Confirmar que el tipo de storage por defecto de la instancia no cambió
    expect(transport.storageType).toBe('local');
    expect(transport.encrypt).toBe(false);
  });
});
