import { TAMANHO_PAGINA_PADRAO } from '../models/paginacao';
import { paginar } from './paginar';

const ITENS = Array.from({ length: 23 }, (_, indice) => indice + 1);

describe('paginar', () => {
  it('devolve a primeira página no tamanho padrão', () => {
    const resultado = paginar(ITENS, 1);

    expect(resultado.itens).toHaveLength(TAMANHO_PAGINA_PADRAO);
    expect(resultado.itens[0]).toBe(1);
    expect(resultado.pagina).toBe(1);
  });

  it('conta o total do conjunto inteiro, e não o da página', () => {
    const resultado = paginar(ITENS, 2);

    expect(resultado.total).toBe(23);
    expect(resultado.totalPaginas).toBe(3);
  });

  it('fatia a partir do item certo nas páginas do meio', () => {
    expect(paginar(ITENS, 2).itens).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it('devolve a sobra na última página', () => {
    expect(paginar(ITENS, 3).itens).toEqual([21, 22, 23]);
  });

  it('limita à última página quem pede além do fim', () => {
    const resultado = paginar(ITENS, 99);

    expect(resultado.pagina).toBe(3);
    expect(resultado.itens).toEqual([21, 22, 23]);
  });

  it('limita à primeira página quem pede zero ou negativo', () => {
    expect(paginar(ITENS, 0).pagina).toBe(1);
    expect(paginar(ITENS, -5).pagina).toBe(1);
  });

  it('trunca página fracionária em vez de arredondar', () => {
    expect(paginar(ITENS, 2.9).pagina).toBe(2);
  });

  it('devolve uma página vazia para lista vazia, e não zero páginas', () => {
    const resultado = paginar([], 1);

    expect(resultado.itens).toHaveLength(0);
    expect(resultado.total).toBe(0);
    expect(resultado.totalPaginas).toBe(1);
    expect(resultado.pagina).toBe(1);
  });

  it('aceita tamanho de página diferente do padrão', () => {
    const resultado = paginar(ITENS, 2, 5);

    expect(resultado.itens).toEqual([6, 7, 8, 9, 10]);
    expect(resultado.tamanhoPagina).toBe(5);
    expect(resultado.totalPaginas).toBe(5);
  });

  it('não altera a lista recebida', () => {
    const original = [...ITENS];
    paginar(ITENS, 2);

    expect(ITENS).toEqual(original);
  });
});
