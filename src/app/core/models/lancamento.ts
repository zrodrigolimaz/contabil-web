import { Anexo } from './anexo';

/** Situação do lançamento na seção Conta Corrente (somente leitura na tela). */
export type SituacaoLancamento = 'Pendente' | 'Processado' | 'Cancelado';

/** Situação do documento CSC do lançamento (somente leitura na tela). */
export type SituacaoDocumentoCsc = 'Aguardando Processamento CCO' | 'Processado';

/** Lançamento de um lote, com as três seções do modal de inclusão. */
export interface Lancamento {
  readonly id: number;
  readonly idLote: number;

  // Seção Conta Corrente
  readonly conta: string;
  readonly titular: string;
  readonly valor: number;
  readonly historico: string;
  readonly estorno: boolean;
  readonly documento: string;
  readonly descricao: string;
  readonly situacao: SituacaoLancamento;

  // Seção Documento CSC
  readonly pa: string;
  readonly idEvento: string | null;
  readonly descricaoEvento: string | null;
  readonly complementoHistorico: string;
  readonly situacaoDocumentoCsc: SituacaoDocumentoCsc;
  readonly idDocumentoCsc: string | null;

  // Seção Anexos
  readonly anexos: readonly Anexo[];
}

/** Dados informados no formulário; `id` e situações são atribuídos pelo serviço. */
export type NovoLancamento = Omit<
  Lancamento,
  'id' | 'situacao' | 'situacaoDocumentoCsc' | 'idDocumentoCsc'
>;
