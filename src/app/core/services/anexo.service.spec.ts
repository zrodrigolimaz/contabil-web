import { TestBed } from '@angular/core/testing';

import { LANCAMENTOS } from '../mocks/lancamentos.mock';
import { USUARIO_LOGADO } from '../mocks/usuario.mock';
import { valorDe } from '../testing/resposta-mock';
import { AnexoService } from './anexo.service';

describe('AnexoService', () => {
  let service: AnexoService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = TestBed.inject(AnexoService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('devolve o anexo com id, data de inclusão e usuário do serviço', () => {
    const anexo = valorDe(service.enviar({ nomeReduzido: 'nota.pdf', descricao: 'Nota fiscal' }));

    expect(anexo.nomeReduzido).toBe('nota.pdf');
    expect(anexo.descricao).toBe('Nota fiscal');
    expect(anexo.idUsuario).toBe(USUARIO_LOGADO);
    expect(anexo.dataInclusao).toBeInstanceOf(Date);
  });

  it('numera acima dos anexos que já existem, sem repetir id', () => {
    const maiorDoMock = Math.max(
      ...LANCAMENTOS.flatMap((lancamento) => lancamento.anexos.map((anexo) => anexo.id)),
    );

    const primeiro = valorDe(service.enviar({ nomeReduzido: 'a.pdf', descricao: 'A' }));
    const segundo = valorDe(service.enviar({ nomeReduzido: 'b.pdf', descricao: 'B' }));

    expect(primeiro.id).toBeGreaterThan(maiorDoMock);
    expect(segundo.id).toBe(primeiro.id + 1);
  });
});
