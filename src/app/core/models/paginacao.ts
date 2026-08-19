/** Quantidade de linhas por página nas grades paginadas. */
export const TAMANHO_PAGINA_PADRAO = 10;

/** Fatia de resultados devolvida pelos serviços de pesquisa. */
export interface ResultadoPaginado<T> {
  readonly itens: readonly T[];
  /** Total de itens que atendem ao filtro, não apenas os da página. */
  readonly total: number;
  /** Página atual, iniciando em 1. */
  readonly pagina: number;
  readonly tamanhoPagina: number;
  readonly totalPaginas: number;
}
