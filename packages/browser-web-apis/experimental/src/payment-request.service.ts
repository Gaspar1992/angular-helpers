import { Injectable } from '@angular/core';
import { BrowserApiBaseService } from '@angular-helpers/browser-web-apis';

export interface PaymentMethodConfig {
  supportedMethods: string;
  data?: Record<string, unknown>;
}

export interface PaymentDetailsInit {
  total: {
    label: string;
    amount: { currency: string; value: string };
  };
  displayItems?: Array<{
    label: string;
    amount: { currency: string; value: string };
  }>;
}

export interface PaymentOptionsConfig {
  requestPayerName?: boolean;
  requestPayerEmail?: boolean;
  requestPayerPhone?: boolean;
  requestShipping?: boolean;
}

export interface PaymentResult {
  methodName: string;
  details: Record<string, unknown>;
  payerName: string | null;
  payerEmail: string | null;
  payerPhone: string | null;
}

@Injectable()
export class PaymentRequestService extends BrowserApiBaseService {
  protected override getApiName(): string {
    return 'payment-request';
  }

  isSupported(): boolean {
    return this.isBrowserEnvironment() && 'PaymentRequest' in window;
  }

  async canMakePayment(
    methods: PaymentMethodConfig[],
    details: PaymentDetailsInit,
  ): Promise<boolean> {
    if (!this.isSupported()) return false;
    const request = new PaymentRequest(
      methods as PaymentMethodData[],
      details as PaymentDetailsInit,
    );
    return request.canMakePayment();
  }

  async show(
    methods: PaymentMethodConfig[],
    details: PaymentDetailsInit,
    options?: PaymentOptionsConfig,
  ): Promise<PaymentResult> {
    if (!this.isSupported()) {
      throw new Error('Payment Request API not supported');
    }

    const request = new PaymentRequest(
      methods as PaymentMethodData[],
      details as PaymentDetailsInit,
      options as PaymentOptions,
    );

    const response = await request.show();
    const result: PaymentResult = {
      methodName: response.methodName,
      details: response.details as Record<string, unknown>,
      payerName: response.payerName ?? null,
      payerEmail: response.payerEmail ?? null,
      payerPhone: response.payerPhone ?? null,
    };

    await response.complete('success');
    return result;
  }

  async abort(methods: PaymentMethodConfig[], details: PaymentDetailsInit): Promise<void> {
    if (!this.isSupported()) return;
    const request = new PaymentRequest(
      methods as PaymentMethodData[],
      details as PaymentDetailsInit,
    );
    await request.abort();
  }
}
