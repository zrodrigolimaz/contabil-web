import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { EVENTOS_CSC } from '../mocks/eventos-csc.mock';
import { CampoBuscaEvento, EventoCsc } from '../models/evento';
import { ResultadoPaginado } from '../models/paginacao';
import { paginar } from '../utils/paginar';
import { respostaMock } from './api-mock';

/** A grade do sub-modal "Pesquisa Evento" é menor que a da consulta de lotes. */
export const TAMANHO_PAGINA_EVENTOS = 5;

@Injectable({ providedIn: 'root' })
export class EventoService {
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
}
