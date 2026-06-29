import { Routes } from '@angular/router';
import { provideSecurity } from '@angular-helpers/security';
import { provideOpenLayers } from '@angular-helpers/openlayers/core';
import { withLayers } from '@angular-helpers/openlayers/layers';
import { withControls } from '@angular-helpers/openlayers/controls';
import {
  provideBrowserWebApis,
  provideCamera,
  provideGeolocation,
  provideNotifications,
  provideClipboard,
  provideMediaDevices,
  provideBattery,
  provideWebShare,
  provideWebStorage,
  provideWebSocket,
  provideWebWorker,
  provideIntersectionObserver,
  provideResizeObserver,
  providePageVisibility,
  provideBroadcastChannel,
  provideNetworkInformation,
  provideScreenWakeLock,
  provideScreenOrientation,
  provideFullscreen,
  provideFileSystemAccess,
  provideMediaRecorder,
  provideServerSentEvents,
  provideVibration,
  provideSpeechSynthesis,
  provideMutationObserver,
  providePerformanceObserver,
  provideWebAudio,
  provideGamepad,
  provideEyeDropper,
  provideIdleDetector,
} from '@angular-helpers/browser-web-apis';

export const DEMO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./demo-layout/demo-layout.component').then((m) => m.DemoLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./demo-home/demo-home.component').then((m) => m.DemoHomeComponent),
        title: 'Demos — Angular Helpers',
      },
      {
        path: 'browser-apis',
        loadComponent: () =>
          import('./browser-apis/browser-apis').then((m) => m.BrowserApisComponent),
        providers: [
          provideBrowserWebApis({
            services: [
              provideCamera(),
              provideGeolocation(),
              provideNotifications(),
              provideClipboard(),
              provideMediaDevices(),
              provideBattery(),
              provideWebShare(),
              provideWebStorage(),
              provideWebSocket(),
              provideWebWorker(),
              provideIntersectionObserver(),
              provideResizeObserver(),
              providePageVisibility(),
              provideBroadcastChannel(),
              provideNetworkInformation(),
              provideScreenWakeLock(),
              provideScreenOrientation(),
              provideFullscreen(),
              provideFileSystemAccess(),
              provideMediaRecorder(),
              provideServerSentEvents(),
              provideVibration(),
              provideSpeechSynthesis(),
              provideMutationObserver(),
              providePerformanceObserver(),
              provideWebAudio(),
              provideGamepad(),
              provideEyeDropper(),
              provideIdleDetector(),
            ],
          }),
        ],
        title: 'Browser APIs — Demo',
      },
      {
        path: 'security',
        loadComponent: () =>
          import('./security/security-demo.component').then((m) => m.SecurityDemoComponent),
        providers: [
          provideSecurity({
            enableRegexSecurity: true,
            enableWebCrypto: true,
            enableSecureStorage: true,
            enableInputSanitizer: true,
            enablePasswordStrength: true,
          }),
        ],
        title: 'Security — Demo',
      },
      {
        path: 'security-utilities',
        loadComponent: () =>
          import('./security-utilities/security-utilities-demo.component').then(
            (m) => m.SecurityUtilitiesDemoComponent,
          ),
        providers: [
          provideSecurity({
            enableJwt: true,
            enableHibp: true,
            enableRateLimiter: true,
            enableCsrf: true,
            enableSensitiveClipboard: true,
          }),
        ],
        title: 'Security Utilities — Demo',
      },
      {
        path: 'security-signal-forms',
        loadComponent: () =>
          import('./security-signal-forms/security-signal-forms-demo.component').then(
            (m) => m.SecuritySignalFormsDemoComponent,
          ),
        providers: [
          provideSecurity({
            enableHibp: true,
          }),
        ],
        title: 'Security Signal Forms — Demo',
      },
      {
        path: 'worker-http',
        loadComponent: () =>
          import('./worker-http/worker-http-demo.component').then((m) => m.WorkerHttpDemoComponent),
        title: 'Worker HTTP — Demo',
      },
      {
        path: 'worker-http-benchmark',
        loadComponent: () =>
          import('./worker-http-benchmark/worker-http-benchmark.component').then(
            (m) => m.WorkerHttpBenchmarkComponent,
          ),
        title: 'Worker HTTP — Benchmark Suite',
      },
      {
        path: 'openlayers',
        loadComponent: () =>
          import('./openlayers/openlayers-demo.component').then((m) => m.OpenLayersDemoComponent),
        providers: [provideOpenLayers(withLayers(), withControls())],
        title: 'OpenLayers — Demo',
      },
      {
        path: 'library-services',
        loadComponent: () =>
          import('./library-services-harness/library-services-harness').then(
            (m) => m.LibraryServicesHarnessComponent,
          ),
        title: 'QA System Harness — Demo',
      },
      {
        path: 'storage',
        loadComponent: () =>
          import('./storage/storage-demo.component').then((m) => m.StorageDemoComponent),
        title: 'Storage & Entity Management — Demo',
      },
    ],
  },
];
