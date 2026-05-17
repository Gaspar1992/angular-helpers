import { makeEnvironmentProviders, EnvironmentProviders } from '@angular/core';
import { BarcodeDetectorService } from '../services/barcode-detector.service';

export function provideBarcodeDetector(): EnvironmentProviders {
  return makeEnvironmentProviders([BarcodeDetectorService]);
}
