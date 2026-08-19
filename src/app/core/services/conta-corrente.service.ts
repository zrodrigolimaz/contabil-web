import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { CONTAS_CORRENTES } from '../mocks/contas-correntes.mock';
import { ContaCorrente } from '../models/conta-corrente';
import { respostaMock } from './api-mock';

@Injectable({ providedIn: 'root' })
export class ContaCorrenteService {
  /* Validador e exibição do titular perguntam pela mesma conta em sequência. */
  private readonly consultadas = new Map<string, ContaCorrente | null>();

  /**
   * Busca a conta pela lupa da seção Conta Corrente.
   *
   * Conta inexistente devolve `null` em vez de erro: o resultado alimenta tanto a
   * exibição do titular quanto o validador assíncrono do formulário, para os quais
   * "não encontrada" é um resultado normal, não uma falha.
   */
  buscarPorNumero(numero: string): Observable<ContaCorrente | null> {
    const procurado = numero.trim();

    const memorizada = this.consultadas.get(procurado);
    if (memorizada !== undefined) {
      return of(memorizada);
    }

    const conta = CONTAS_CORRENTES.find((atual) => atual.numero === procurado) ?? null;
    this.consultadas.set(procurado, conta);

    return respostaMock(conta);
  }
}
