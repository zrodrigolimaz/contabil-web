export type CampoOrdenacao =
  | 'id'
  | 'dataEntrada'
  | 'valor'
  | 'quantidadeLancamentos'
  | 'usuarioRegistro'
  | 'usuarioAprovacao'
  | 'situacao'
  | 'dataHoraSituacao';

export type DirecaoOrdenacao = 'asc' | 'desc';

export interface Ordenacao {
  readonly campo: CampoOrdenacao;
  readonly direcao: DirecaoOrdenacao;
}

export const ORDENACAO_PADRAO: Ordenacao = { campo: 'id', direcao: 'asc' };
