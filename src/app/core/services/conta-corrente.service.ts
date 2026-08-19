import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { CONTAS_CORRENTES } from '../mocks/contas-correntes.mock';
import { CampoBuscaConta, ContaCorrente } from '../models/conta-corrente';
import { ResultadoPaginado } from '../models/paginacao';
import { paginar } from '../utils/paginar';
import { respostaMock } from './api-mock';

/** A grade do sub-modal "Pesquisa Conta Corrente" é menor que a da consulta de lotes. */
export const TAMANHO_PAGINA_CONTAS = 5;

@Injectable({ providedIn: 'root' })
export class ContaCorrenteService {
  /* Validador e exibição do titular perguntam pela mesma conta em sequência. */
  private readonly consultadas = new Map<string, ContaCorrente | null>();

  /**
   * Pesquisa contas pelo campo escolhido no sub-modal, por trecho e sem diferenciar
   * maiúsculas. Valor em branco lista todas as contas.
   */
  pesquisar(
    campo: CampoBuscaConta,
    valor: string,
    pagina = 1,
  ): Observable<ResultadoPaginado<ContaCorrente>> {
    const termo = valor.trim().toLowerCase();
    const encontradas = termo
      ? CONTAS_CORRENTES.filter((conta) => conta[campo].toLowerCase().includes(termo))
      : CONTAS_CORRENTES;

    return respostaMock(paginar(encontradas, pagina, TAMANHO_PAGINA_CONTAS));
  }

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
