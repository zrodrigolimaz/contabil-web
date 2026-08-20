import { Observable } from 'rxjs';

import { LATENCIA_MOCK_MS } from '../services/api-mock';

/**
 * Auxiliares para testar os serviços mock.
 *
 * O ambiente de teste é zoneless, então `fakeAsync`/`tick` não estão disponíveis:
 * a latência simulada é vencida com os fake timers do Jest. Todo spec que usa
 * estas funções precisa de `jest.useFakeTimers()` ativo.
 */

export function valorDe<T>(origem: Observable<T>): T {
  let emitido: T | undefined;
  let recebeu = false;
  let falha: unknown;

  const inscricao = origem.subscribe({
    next: (valor) => {
      emitido = valor;
      recebeu = true;
    },
    error: (erro: unknown) => (falha = erro),
  });

  jest.advanceTimersByTime(LATENCIA_MOCK_MS);
  inscricao.unsubscribe();

  if (falha) {
    throw falha;
  }
  if (!recebeu) {
    throw new Error('O observable não emitiu dentro da latência mock.');
  }

  return emitido as T;
}

export function erroDe(origem: Observable<unknown>): Error {
  let falha: unknown;

  const inscricao = origem.subscribe({
    next: () => undefined,
    error: (erro: unknown) => (falha = erro),
  });

  jest.advanceTimersByTime(LATENCIA_MOCK_MS);
  inscricao.unsubscribe();

  if (!(falha instanceof Error)) {
    throw new Error('O observable não falhou dentro da latência mock.');
  }

  return falha;
}
