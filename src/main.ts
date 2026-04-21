import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// oxlint-disable-next-line no-console -- bootstrap failure must surface to DevTools; no logger is available yet
bootstrapApplication(App, appConfig).catch((err) => console.error(err));
