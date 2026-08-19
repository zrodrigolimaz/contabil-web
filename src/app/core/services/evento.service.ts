import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { EVENTOS_CSC } from '../mocks/eventos-csc.mock';
import { CampoBuscaEvento, EventoCsc } from '../models/evento';
import { ResultadoPaginado } from '../models/paginacao';
import { paginar } from '../utils/paginar';
import { respostaMock } from './api-mock';

/** A grade do sub-modal "Pesquisa Evento" é menor que a da consulta de lotes. */
export const TAMANHO_PAGINA_EVENTOS = 5;

@Injectable({ providedIn: 'root' })
export class EventoService {
  /* Validador e exibição da descrição perguntam pelo mesmo evento em sequência. */
  private readonly consultados = new Map<string, EventoCsc | null>();

  /**
   * Pesquisa eventos pelo campo escolhido no sub-modal, por trecho e sem
   * diferenciar maiúsculas. Valor em branco lista todos os eventos.
   */
  pesquisar(
    campo: CampoBuscaEvento,
    valor: string,
    pagina = 1,
  ): Observable<ResultadoPaginado<EventoCsc>> {
    const termo = valor.trim().toLowerCase();
    const encontrados = termo
      ? EVENTOS_CSC.filter((evento) => evento[campo].toLowerCase().includes(termo))
      : EVENTOS_CSC;

    return respostaMock(paginar(encontrados, pagina, TAMANHO_PAGINA_EVENTOS));
  }

  buscarPorId(idEvento: string): Observable<EventoCsc | null> {
    const procurado = idEvento.trim();

    const memorizado = this.consultados.get(procurado);
    if (memorizado !== undefined) {
      return of(memorizado);
    }

    const evento = EVENTOS_CSC.find((atual) => atual.idEvento === procurado) ?? null;
    this.consultados.set(procurado, evento);

    return respostaMock(evento);
  }
}
