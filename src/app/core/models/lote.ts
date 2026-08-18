/** Situações possíveis de um lote no fluxo Aberto → Enviado → Confirmado. */
export type SituacaoLote = 'Aberto' | 'Enviado' | 'Confirmado';

/** Lote de outros créditos/débitos exibido na grade da consulta. */
export interface Lote {
  readonly id: number;
  readonly instituicaoResponsavel: string;
  readonly instituicao: string;
  readonly dataEntrada: Date;
  readonly valor: number;
  readonly quantidadeLancamentos: number;
  readonly usuarioRegistro: string;
  readonly usuarioAprovacao: string | null;
  readonly situacao: SituacaoLote;
  readonly dataHoraSituacao: Date;
  readonly justificativa: string | null;
}
