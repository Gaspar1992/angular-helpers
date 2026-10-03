import '@angular/compiler';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Injectable, PLATFORM_ID } from '@angular/core';
import { ConnectionRegistryBaseService } from './connection-registry-base.service';
import { BROWSER_API_LOGGER } from '../../tokens/logger.token';
import { BrowserCapabilityService } from '../browser-capability.service';

interface MockConnection {
  id: string;
  close: () => void;
}

@Injectable()
class TestConnectionRegistryService extends ConnectionRegistryBaseService<MockConnection> {
  public closedConnections: MockConnection[] = [];

  protected getApiName(): string {
    return 'TestConnectionRegistry';
  }

  protected closeNativeConnection(connection: MockConnection): void {
    this.closedConnections.push(connection);
    connection.close();
  }

  public add(key: string, connection: MockConnection): void {
    this.connections.set(key, connection);
  }

  public testRemove(key: string): void {
    this.removeConnection(key);
  }

  public testCloseAll(): void {
    this.closeAllConnections();
  }

  public testGetKeys(): string[] {
    return this.getConnectionKeys();
  }
}

describe('ConnectionRegistryBaseService', () => {
  let service: TestConnectionRegistryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TestConnectionRegistryService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: BROWSER_API_LOGGER, useValue: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } },
        { provide: BrowserCapabilityService, useValue: { isSupported: () => true } },
      ],
    });

    service = TestBed.inject(TestConnectionRegistryService);
  });

  it('manages registered connections and reports active keys', () => {
    const conn1 = { id: 'c1', close: vi.fn() };
    const conn2 = { id: 'c2', close: vi.fn() };

    service.add('channel-1', conn1);
    service.add('channel-2', conn2);

    expect(service.testGetKeys()).toEqual(['channel-1', 'channel-2']);
  });

  it('removes a connection and calls closeNativeConnection', () => {
    const conn1 = { id: 'c1', close: vi.fn() };
    service.add('channel-1', conn1);

    service.testRemove('channel-1');

    expect(conn1.close).toHaveBeenCalledTimes(1);
    expect(service.closedConnections).toContain(conn1);
    expect(service.testGetKeys()).toEqual([]);
  });

  it('does nothing when removing a non-existent connection', () => {
    expect(() => service.testRemove('unknown-key')).not.toThrow();
  });

  it('closes all connections and clears the registry', () => {
    const conn1 = { id: 'c1', close: vi.fn() };
    const conn2 = { id: 'c2', close: vi.fn() };

    service.add('channel-1', conn1);
    service.add('channel-2', conn2);

    service.testCloseAll();

    expect(conn1.close).toHaveBeenCalledTimes(1);
    expect(conn2.close).toHaveBeenCalledTimes(1);
    expect(service.closedConnections.length).toBe(2);
    expect(service.testGetKeys()).toEqual([]);
  });
});
