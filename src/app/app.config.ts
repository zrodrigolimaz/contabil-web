import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  Provider,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

export function provideLocalePtBr(): Provider {
  registerLocaleData(localePt);
  return { provide: LOCALE_ID, useValue: 'pt-BR' };
}

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes), provideLocalePtBr()],
};
