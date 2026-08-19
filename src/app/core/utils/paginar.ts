import { ResultadoPaginado, TAMANHO_PAGINA_PADRAO } from '../models/paginacao';

/**
 * Fatia a lista já filtrada na página pedida.
 *
 * A página é limitada ao intervalo válido (1..totalPaginas), de modo que pedir uma
 * página inexistente devolve a última em vez de uma grade vazia. Lista vazia
 * resulta em uma única página sem itens.
 */
export function paginar<T>(
  itens: readonly T[],
  pagina: number,
  tamanhoPagina: number = TAMANHO_PAGINA_PADRAO,
): ResultadoPaginado<T> {
  const total = itens.length;
  const totalPaginas = Math.max(1, Math.ceil(total / tamanhoPagina));
  const paginaAtual = Math.min(Math.max(1, Math.trunc(pagina)), totalPaginas);
  const inicio = (paginaAtual - 1) * tamanhoPagina;

  return {
    itens: itens.slice(inicio, inicio + tamanhoPagina),
    total,
    pagina: paginaAtual,
    tamanhoPagina,
    totalPaginas,
  };
}
