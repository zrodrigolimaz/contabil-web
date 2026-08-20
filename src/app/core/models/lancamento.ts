import { Anexo } from './anexo';

export type SituacaoLancamento = 'Pendente' | 'Processado' | 'Cancelado';

export type SituacaoDocumentoCsc = 'Aguardando Processamento CCO' | 'Processado';

export interface Lancamento {
  readonly id: number;
  readonly idLote: number;

  readonly conta: string;
  readonly titular: string;
  readonly valor: number;
  readonly historico: string;
  readonly estorno: boolean;
  readonly documento: string;
  readonly descricao: string;
  readonly situacao: SituacaoLancamento;

  readonly pa: string;
  readonly idEvento: string | null;
  readonly descricaoEvento: string | null;
  readonly complementoHistorico: string;
  readonly situacaoDocumentoCsc: SituacaoDocumentoCsc;
  readonly idDocumentoCsc: string | null;

  readonly anexos: readonly Anexo[];
}

export type NovoLancamento = Omit<
  Lancamento,
  'id' | 'situacao' | 'situacaoDocumentoCsc' | 'idDocumentoCsc'
>;
