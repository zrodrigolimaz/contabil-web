import { SituacaoLote } from './lote';

export interface FaixaNumerica {
  readonly de: number | null;
  readonly ate: number | null;
}

export interface FaixaData {
  readonly de: string | null;
  readonly ate: string | null;
}

export const SITUACAO_TODAS = 'Todas';

export type FiltroSituacaoLote = SituacaoLote | typeof SITUACAO_TODAS;

export interface FiltrosPesquisaLote {
  readonly instituicaoResponsavel: string | null;
  readonly instituicao: string | null;
  readonly situacao: FiltroSituacaoLote;
  readonly idLote: FaixaNumerica;
  readonly valor: FaixaNumerica;
  readonly dataEntrada: FaixaData;
}

export const FILTROS_VAZIOS: FiltrosPesquisaLote = {
  instituicaoResponsavel: null,
  instituicao: null,
  situacao: SITUACAO_TODAS,
  idLote: { de: null, ate: null },
  valor: { de: null, ate: null },
  dataEntrada: { de: null, ate: null },
};
