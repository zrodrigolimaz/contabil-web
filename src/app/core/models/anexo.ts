/** Arquivo anexado a um lançamento (metadados apenas; o upload é simulado). */
export interface Anexo {
  readonly id: number;
  readonly nomeReduzido: string;
  readonly descricao: string;
  readonly dataInclusao: Date;
  readonly idUsuario: string;
}

/** Dados informados na inclusão; id, data e usuário são atribuídos pelo serviço. */
export type NovoAnexo = Omit<Anexo, 'id' | 'dataInclusao' | 'idUsuario'>;
