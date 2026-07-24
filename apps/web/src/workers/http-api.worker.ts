/// <reference lib="webworker" />

import { createConfigurableWorkerPipeline } from '@angular-helpers/worker-http/interceptors';

// Pipeline composition is now driven by Angular DI via `withWorkerInterceptors([...])`.
// Specs arrive via the `init-interceptors` handshake message before any HTTP request.
//
// To register custom interceptors not covered by the built-in spec catalogue,
// call `registerInterceptor(name, factory)` BEFORE this line.
createConfigurableWorkerPipeline();
