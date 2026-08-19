import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CONTAS_CORRENTES } from '../mocks/contas-correntes.mock';
import { ContaCorrente } from '../models/conta-corrente';
import { respostaMock } from './api-mock';

@Injectable({ providedIn: 'root' })
export class ContaCorrenteService {
  /**
   * Busca a conta pela lupa da seção Conta Corrente.
   *
   * Conta inexistente devolve `null` em vez de erro: o resultado alimenta tanto a
   * exibição do titular quanto o validador assíncrono do formulário, para os quais
   * "não encontrada" é um resultado normal, não uma falha.
   */
  buscarPorNumero(numero: string): Observable<ContaCorrente | null> {
    const procurado = numero.trim();
    const conta = CONTAS_CORRENTES.find((atual) => atual.numero === procurado) ?? null;

    return respostaMock(conta);
  }
}
