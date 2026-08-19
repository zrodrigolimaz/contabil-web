import { ComponentFixture, TestBed } from '@angular/core/testing';

import { aparelharDialogos } from '../../../core/testing/dialogo-jsdom';
import { DialogoConfirmacao, PedidoConfirmacao } from './dialogo-confirmacao';

const PEDIDO: PedidoConfirmacao = {
  titulo: 'Excluir lote',
  mensagem: 'Excluir o lote 1004?',
  detalhe: 'Os 3 lançamentos dele também saem.',
  rotuloConfirmar: 'Excluir',
  perigo: true,
};

describe('DialogoConfirmacao', () => {
  let fixture: ComponentFixture<DialogoConfirmacao>;
  let confirmacoes: number;
  let cancelamentos: number;

  beforeEach(async () => {
    fixture = TestBed.createComponent(DialogoConfirmacao);
    confirmacoes = 0;
    cancelamentos = 0;
    fixture.componentInstance.confirmar.subscribe(() => confirmacoes++);
    fixture.componentInstance.cancelar.subscribe(() => cancelamentos++);
    fixture.componentRef.setInput('pedido', null);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  });

  async function abrir(pedido: PedidoConfirmacao = PEDIDO): Promise<void> {
    fixture.componentRef.setInput('pedido', pedido);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  }

  function botao(rotulo: string): HTMLButtonElement {
    return [...fixture.nativeElement.querySelectorAll('button')].find(
      (elemento: HTMLButtonElement) => elemento.textContent?.trim() === rotulo,
    ) as HTMLButtonElement;
  }

  it('fica fechado sem pedido', () => {
    expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
  });

  it('mostra o que está sendo pedido', async () => {
    await abrir();

    expect(fixture.nativeElement.textContent).toContain('Excluir lote');
    expect(fixture.nativeElement.textContent).toContain('Excluir o lote 1004?');
    expect(fixture.nativeElement.textContent).toContain('Os 3 lançamentos dele também saem.');
    expect(botao('Excluir')).toBeTruthy();
  });

  it('dispensa o detalhe quando não há', async () => {
    await abrir({ ...PEDIDO, detalhe: undefined });

    expect(fixture.nativeElement.textContent).not.toContain('lançamentos dele');
  });

  it('avisa a confirmação', async () => {
    await abrir();
    botao('Excluir').click();
    await fixture.whenStable();

    expect(confirmacoes).toBe(1);
    expect(cancelamentos).toBe(0);
  });

  it('avisa o cancelamento pelo botão', async () => {
    await abrir();
    botao('Cancelar').click();
    await fixture.whenStable();

    expect(cancelamentos).toBe(1);
    expect(confirmacoes).toBe(0);
  });

  it('trata como cancelamento o fechamento pelo Esc ou pelo X', async () => {
    await abrir();
    fixture.nativeElement.querySelector('dialog').close();
    await fixture.whenStable();

    expect(cancelamentos).toBe(1);
  });

  it('veste a ação destrutiva de forma diferente da comum', async () => {
    await abrir();
    const destrutivo = botao('Excluir').className;

    await abrir({ ...PEDIDO, rotuloConfirmar: 'Confirmar', perigo: false });

    expect(destrutivo).toContain('btn-perigo-solido');
    expect(botao('Confirmar').className).toContain('btn-primario');
  });
});
