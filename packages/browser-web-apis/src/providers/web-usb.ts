import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { WebUsbService } from '../services/web-usb.service';

export function provideWebUsb(): EnvironmentProviders {
  return makeEnvironmentProviders([WebUsbService]);
}
