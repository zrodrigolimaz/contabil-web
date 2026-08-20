export interface Anexo {
  readonly id: number;
  readonly nomeReduzido: string;
  readonly descricao: string;
  readonly dataInclusao: Date;
  readonly idUsuario: string;
}

export type NovoAnexo = Omit<Anexo, 'id' | 'dataInclusao' | 'idUsuario'>;
