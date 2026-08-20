import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lote } from '../../../../core/models/lote';
import { aparelharDialogo } from '../../../../core/testing/dialogo-jsdom';
import { DialogoJustificativa } from './dialogo-justificativa';

const LOTE: Lote = {
  id: 1002,
  instituicaoResponsavel: '0001 – Banco',
  instituicao: '0002 – Central',
  dataEntrada: new Date(2025, 10, 12),
  valor: 3780.55,
  quantidadeLancamentos: 2,
  usuarioRegistro: 'ana.costa',
  usuarioAprovacao: null,
  situacao: 'Enviado',
  dataHoraSituacao: new Date(2025, 10, 13, 16, 2),
  justificativa: 'Reenviado após ajuste do histórico dos lançamentos.',
};

describe('DialogoJustificativa', () => {
  let fixture: ComponentFixture<DialogoJustificativa>;
  let fechamentos: number;

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogoJustificativa);
    fechamentos = 0;
    fixture.componentInstance.fechar.subscribe(() => (fechamentos += 1));
    aparelharDialogo(dialogo());
  });

  function dialogo(): HTMLDialogElement {
    return fixture.nativeElement.querySelector('dialog');
  }

  async function montar(lote: Lote | null): Promise<void> {
    fixture.componentRef.setInput('lote', lote);
    await fixture.whenStable();
  }

  it('começa fechado', async () => {
    await montar(null);

    expect(dialogo().open).toBe(false);
  });

  it('abre como modal quando recebe um lote', async () => {
    await montar(LOTE);

    expect(dialogo().open).toBe(true);
  });

  it('mostra o lote e a justificativa dele', async () => {
    await montar(LOTE);

    expect(fixture.nativeElement.textContent).toContain('Justificativa do lote 1002');
    expect(fixture.nativeElement.textContent).toContain(
      'Reenviado após ajuste do histórico dos lançamentos.',
    );
  });

  it('liga o título ao diálogo para leitores de tela', async () => {
    await montar(LOTE);

    const idTitulo = dialogo().getAttribute('aria-labelledby');
    expect(fixture.nativeElement.querySelector(`#${idTitulo}`).textContent).toContain(
      'Justificativa do lote 1002',
    );
  });

  it('avisa o container quando o usuário fecha pelo botão', async () => {
    await montar(LOTE);

    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();

    expect(dialogo().open).toBe(false);
    expect(fechamentos).toBe(1);
  });

  it('avisa o container quando o diálogo fecha por fora do botão', async () => {
    await montar(LOTE);

    dialogo().close();
    await fixture.whenStable();

    expect(fechamentos).toBe(1);
  });

  it('fecha quando o container zera o lote', async () => {
    await montar(LOTE);
    await montar(null);

    expect(dialogo().open).toBe(false);
  });
});
