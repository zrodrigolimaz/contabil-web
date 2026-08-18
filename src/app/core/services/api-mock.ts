import { delay, Observable, of, switchMap, throwError, timer } from 'rxjs';

/** Latência artificial de toda resposta mock, em milissegundos. */
export const LATENCIA_MOCK_MS = 400;

/** Resposta bem-sucedida da "API": o valor chega após a latência simulada. */
export function respostaMock<T>(valor: T): Observable<T> {
  return of(valor).pipe(delay(LATENCIA_MOCK_MS));
}

/**
 * Falha da "API" com a mesma latência de uma resposta normal.
 *
 * `delay` deixa notificações de erro passarem na hora, por isso a espera vem de um
 * `timer` antes do `throwError`.
 */
export function erroMock<T>(mensagem: string): Observable<T> {
  return timer(LATENCIA_MOCK_MS).pipe(switchMap(() => throwError(() => new Error(mensagem))));
}
