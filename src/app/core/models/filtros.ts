import { SituacaoLote } from './lote';

/** Faixa "De/Até" numérica; `null` em um dos lados desativa aquele limite. */
export interface FaixaNumerica {
  readonly de: number | null;
  readonly ate: number | null;
}

/** Faixa "De/Até" de datas no formato ISO `yyyy-MM-dd` do `<input type="date">`. */
export interface FaixaData {
  readonly de: string | null;
  readonly ate: string | null;
}

/** Opção do filtro de situação que não restringe o resultado. */
export const SITUACAO_TODAS = 'Todas';

export type FiltroSituacaoLote = SituacaoLote | typeof SITUACAO_TODAS;

/** Critérios do painel de filtros da consulta de lotes. */
export interface FiltrosPesquisaLote {
  readonly instituicaoResponsavel: string | null;
  readonly instituicao: string | null;
  readonly situacao: FiltroSituacaoLote;
  readonly idLote: FaixaNumerica;
  readonly valor: FaixaNumerica;
  readonly dataEntrada: FaixaData;
}

/** Filtros vazios: usados na primeira pesquisa e como base nos testes. */
export const FILTROS_VAZIOS: FiltrosPesquisaLote = {
  instituicaoResponsavel: null,
  instituicao: null,
  situacao: SITUACAO_TODAS,
  idLote: { de: null, ate: null },
  valor: { de: null, ate: null },
  dataEntrada: { de: null, ate: null },
};
