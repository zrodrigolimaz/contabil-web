export const TAMANHO_PAGINA_PADRAO = 10;

export interface ResultadoPaginado<T> {
  readonly itens: readonly T[];
  readonly total: number;
  readonly pagina: number;
  readonly tamanhoPagina: number;
  readonly totalPaginas: number;
}
