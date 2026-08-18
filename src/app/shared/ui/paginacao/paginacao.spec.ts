import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Paginacao } from './paginacao';

describe('Paginacao', () => {
  let fixture: ComponentFixture<Paginacao>;
  let pedidas: number[];

  beforeEach(() => {
    fixture = TestBed.createComponent(Paginacao);
    pedidas = [];
    fixture.componentInstance.irPara.subscribe((pagina) => pedidas.push(pagina));
  });

  async function montar(pagina: number, totalPaginas: number): Promise<void> {
    fixture.componentRef.setInput('pagina', pagina);
    fixture.componentRef.setInput('totalPaginas', totalPaginas);
    await fixture.whenStable();
  }

  function botao(rotulo: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(`button[aria-label="${rotulo}"]`);
  }

  it('não renderiza quando há uma página só', async () => {
    await montar(1, 1);

    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
  });

  it('marca a página atual para leitores de tela', async () => {
    await montar(2, 3);

    expect(fixture.nativeElement.querySelector('[aria-current="page"]').textContent.trim()).toBe(
      '2',
    );
  });

  it('desabilita o recuo na primeira página', async () => {
    await montar(1, 3);

    expect(botao('Primeira página').disabled).toBe(true);
    expect(botao('Página anterior').disabled).toBe(true);
    expect(botao('Próxima página').disabled).toBe(false);
    expect(botao('Última página').disabled).toBe(false);
  });

  it('desabilita o avanço na última página', async () => {
    await montar(3, 3);

    expect(botao('Próxima página').disabled).toBe(true);
    expect(botao('Última página').disabled).toBe(true);
    expect(botao('Primeira página').disabled).toBe(false);
    expect(botao('Página anterior').disabled).toBe(false);
  });

  it('pede a página correspondente a cada botão', async () => {
    await montar(2, 4);

    botao('Primeira página').click();
    botao('Página anterior').click();
    botao('Próxima página').click();
    botao('Última página').click();

    expect(pedidas).toEqual([1, 1, 3, 4]);
  });
});
