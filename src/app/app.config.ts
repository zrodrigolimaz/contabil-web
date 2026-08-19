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

/**
 * Locale de toda a aplicação: sem ele os pipes `date` e `number` formatam em en-US
 * (`4/26/26`, `1,000.00`). Exportado à parte porque os testes que verificam a
 * formatação da grade precisam do mesmo registro.
 */
export function provideLocalePtBr(): Provider {
  registerLocaleData(localePt);
  return { provide: LOCALE_ID, useValue: 'pt-BR' };
}

export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes), provideLocalePtBr()],
};
