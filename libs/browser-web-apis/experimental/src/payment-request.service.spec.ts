import '@angular/compiler';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import {
  PaymentRequestService,
  type PaymentMethodConfig,
  type PaymentDetailsInit,
  type PaymentOptionsConfig,
} from './payment-request.service';

describe('PaymentRequestService', () => {
  let service: PaymentRequestService;
  let mockPaymentResponse: any;
  let mockPaymentRequestInstance: any;

  const mockMethods: PaymentMethodConfig[] = [
    { supportedMethods: 'basic-card', data: { supportedNetworks: ['visa'] } },
  ];

  const mockDetails: PaymentDetailsInit = {
    total: {
      label: 'Total',
      amount: { currency: 'USD', value: '10.00' },
    },
  };

  beforeEach(() => {
    mockPaymentResponse = {
      methodName: 'basic-card',
      details: { cardNumber: '****' },
      payerName: 'John Doe',
      payerEmail: 'john@example.com',
      payerPhone: '+1234567890',
      complete: vi.fn().mockResolvedValue(undefined),
    };

    mockPaymentRequestInstance = {
      canMakePayment: vi.fn().mockResolvedValue(true),
      show: vi.fn().mockResolvedValue(mockPaymentResponse),
      abort: vi.fn().mockResolvedValue(undefined),
    };

    function MockPaymentRequestConstructor(this: any) {
      return mockPaymentRequestInstance;
    }
    (window as any).PaymentRequest = MockPaymentRequestConstructor;

    TestBed.configureTestingModule({
      providers: [PaymentRequestService, { provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(PaymentRequestService);
  });

  afterEach(() => {
    delete (window as any).PaymentRequest;
    vi.unstubAllGlobals();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('isSupported', () => {
    it('should return true when running in browser and PaymentRequest is in window', () => {
      expect(service.isSupported()).toBe(true);
    });

    it('should return false when PaymentRequest is not available', () => {
      delete (window as any).PaymentRequest;
      expect(service.isSupported()).toBe(false);
    });

    it('should return false on non-browser platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [PaymentRequestService, { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const serverService = TestBed.inject(PaymentRequestService);
      expect(serverService.isSupported()).toBe(false);
    });
  });

  describe('canMakePayment', () => {
    it('should query canMakePayment when supported', async () => {
      const result = await service.canMakePayment(mockMethods, mockDetails);
      expect(result).toBe(true);
      expect(mockPaymentRequestInstance.canMakePayment).toHaveBeenCalled();
    });

    it('should return false when API is unsupported', async () => {
      delete (window as any).PaymentRequest;
      const result = await service.canMakePayment(mockMethods, mockDetails);
      expect(result).toBe(false);
    });
  });

  describe('show', () => {
    it('should prompt payment UI, map result, and complete transaction successfully', async () => {
      const options: PaymentOptionsConfig = { requestPayerName: true };
      const result = await service.show(mockMethods, mockDetails, options);

      expect(mockPaymentRequestInstance.show).toHaveBeenCalled();
      expect(mockPaymentResponse.complete).toHaveBeenCalledWith('success');
      expect(result).toEqual({
        methodName: 'basic-card',
        details: { cardNumber: '****' },
        payerName: 'John Doe',
        payerEmail: 'john@example.com',
        payerPhone: '+1234567890',
      });
    });

    it('should handle nullable payer contact fields', async () => {
      mockPaymentResponse.payerName = undefined;
      mockPaymentResponse.payerEmail = undefined;
      mockPaymentResponse.payerPhone = undefined;

      const result = await service.show(mockMethods, mockDetails);
      expect(result.payerName).toBeNull();
      expect(result.payerEmail).toBeNull();
      expect(result.payerPhone).toBeNull();
    });

    it('should throw error when API is not supported', async () => {
      delete (window as any).PaymentRequest;
      await expect(service.show(mockMethods, mockDetails)).rejects.toThrow(
        'Payment Request API not supported',
      );
    });
  });

  describe('abort', () => {
    it('should abort active payment request when supported', async () => {
      await service.abort(mockMethods, mockDetails);
      expect(mockPaymentRequestInstance.abort).toHaveBeenCalled();
    });

    it('should no-op when API is not supported', async () => {
      delete (window as any).PaymentRequest;
      await expect(service.abort(mockMethods, mockDetails)).resolves.toBeUndefined();
    });
  });
});
