export type SituacaoLote = 'Aberto' | 'Enviado' | 'Confirmado';

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
