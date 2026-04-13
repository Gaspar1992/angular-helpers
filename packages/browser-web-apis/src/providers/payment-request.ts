import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { PaymentRequestService } from '../services/payment-request.service';

export function providePaymentRequest(): EnvironmentProviders {
  return makeEnvironmentProviders([PaymentRequestService]);
}
