import { TestBed } from '@angular/core/testing';

import { EVENTOS_CSC } from '../mocks/eventos-csc.mock';
import { valorDe } from '../testing/resposta-mock';
import { EventoService, TAMANHO_PAGINA_EVENTOS } from './evento.service';

describe('EventoService', () => {
  let service: EventoService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = TestBed.inject(EventoService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('lista todos os eventos quando o valor está em branco', () => {
    const resultado = valorDe(service.pesquisar('descricao', ''));

    expect(resultado.total).toBe(EVENTOS_CSC.length);
    expect(resultado.itens).toHaveLength(TAMANHO_PAGINA_EVENTOS);
  });

  it('pesquisa por trecho da descrição sem diferenciar maiúsculas', () => {
    const resultado = valorDe(service.pesquisar('descricao', 'centralização título'));

    expect(resultado.total).toBe(4);
    expect(resultado.itens[0]).toEqual(EVENTOS_CSC[0]);
  });

  it('pesquisa por trecho do ID do evento', () => {
    const resultado = valorDe(service.pesquisar('idEvento', '10'));

    expect(resultado.itens.map((evento) => evento.idEvento)).toEqual([
      '102',
      '103',
      '104',
      '105',
      '106',
    ]);
  });

  it('pesquisa por código do evento', () => {
    const resultado = valorDe(service.pesquisar('codEvento', '31'));

    expect(resultado.itens.map((evento) => evento.codEvento)).toEqual(['310', '311', '331']);
  });

  it('pagina o resultado em blocos do tamanho da grade do sub-modal', () => {
    const resultado = valorDe(service.pesquisar('descricao', '', 2));

    expect(resultado.pagina).toBe(2);
    expect(resultado.tamanhoPagina).toBe(TAMANHO_PAGINA_EVENTOS);
    expect(resultado.totalPaginas).toBe(4);
    expect(resultado.itens[0].idEvento).toBe('107');
  });

  it('devolve resultado vazio quando nada corresponde', () => {
    const resultado = valorDe(service.pesquisar('descricao', 'inexistente'));

    expect(resultado.itens).toHaveLength(0);
    expect(resultado.total).toBe(0);
  });

  it('busca o evento pelo ID', () => {
    expect(valorDe(service.buscarPorId('102'))).toEqual(EVENTOS_CSC[0]);
  });

  it('devolve nulo para um ID que não existe', () => {
    expect(valorDe(service.buscarPorId('999'))).toBeNull();
  });
});
