import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { LANCAMENTOS } from '../mocks/lancamentos.mock';
import { USUARIO_LOGADO } from '../mocks/usuario.mock';
import { Anexo, NovoAnexo } from '../models/anexo';
import { respostaMock } from './api-mock';

@Injectable({ providedIn: 'root' })
export class AnexoService {
  private proximoId =
    Math.max(0, ...LANCAMENTOS.flatMap((lancamento) => lancamento.anexos.map((anexo) => anexo.id))) +
    1;

  /** Simula o upload: nenhum byte do arquivo é lido, só os metadados são guardados. */
  enviar(dados: NovoAnexo): Observable<Anexo> {
    return respostaMock<Anexo>({
      ...dados,
      id: this.proximoId++,
      dataInclusao: new Date(),
      idUsuario: USUARIO_LOGADO,
    });
  }
}
