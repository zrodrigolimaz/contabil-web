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

  async function montar(
    pagina: number,
    totalPaginas: number,
    total = totalPaginas * 10,
    tamanhoPagina = 10,
  ): Promise<void> {
    fixture.componentRef.setInput('pagina', pagina);
    fixture.componentRef.setInput('totalPaginas', totalPaginas);
    fixture.componentRef.setInput('total', total);
    fixture.componentRef.setInput('tamanhoPagina', tamanhoPagina);
    await fixture.whenStable();
  }

  function botao(rotulo: string): HTMLButtonElement {
    return fixture.nativeElement.querySelector(`button[aria-label="${rotulo}"]`);
  }

  /** Régua de páginas como o usuário a lê, incluindo as reticências. */
  function regua(): string[] {
    return [...fixture.nativeElement.querySelectorAll('nav > button, nav > span')]
      .map((elemento: HTMLElement) => elemento.textContent?.trim() ?? '')
      .filter((rotulo) => rotulo !== '«' && rotulo !== '‹' && rotulo !== '›' && rotulo !== '»');
  }

  function texto(): string {
    return fixture.nativeElement.textContent;
  }

  it('não renderiza quando a consulta não trouxe resultado', async () => {
    await montar(1, 1, 0);

    expect(fixture.nativeElement.textContent.trim()).toBe('');
  });

  it('informa o intervalo exibido e o total', async () => {
    await montar(2, 3, 24);

    expect(texto()).toContain('Mostrando 11–20 de 24');
  });

  it('limita o intervalo ao total na última página', async () => {
    await montar(3, 3, 24);

    expect(texto()).toContain('Mostrando 21–24 de 24');
  });

  it('mantém a contagem e dispensa os botões quando só há uma página', async () => {
    await montar(1, 1, 4);

    expect(texto()).toContain('Mostrando 1–4 de 4');
    expect(fixture.nativeElement.querySelector('nav')).toBeNull();
  });

  it('marca a página atual para leitores de tela', async () => {
    await montar(2, 3, 24);

    expect(fixture.nativeElement.querySelector('[aria-current="page"]').textContent.trim()).toBe(
      '2',
    );
  });

  it('desabilita o recuo na primeira página', async () => {
    await montar(1, 3, 24);

    expect(botao('Primeira página').disabled).toBe(true);
    expect(botao('Página anterior').disabled).toBe(true);
    expect(botao('Próxima página').disabled).toBe(false);
    expect(botao('Última página').disabled).toBe(false);
  });

  it('desabilita o avanço na última página', async () => {
    await montar(3, 3, 24);

    expect(botao('Próxima página').disabled).toBe(true);
    expect(botao('Última página').disabled).toBe(true);
    expect(botao('Primeira página').disabled).toBe(false);
    expect(botao('Página anterior').disabled).toBe(false);
  });

  it('pede a página correspondente a cada botão de salto', async () => {
    await montar(2, 4, 40);

    botao('Primeira página').click();
    botao('Página anterior').click();
    botao('Próxima página').click();
    botao('Última página').click();

    expect(pedidas).toEqual([1, 1, 3, 4]);
  });

  it('lista todas as páginas enquanto elas cabem na régua', async () => {
    await montar(2, 5, 50);

    expect(regua()).toEqual(['1', '2', '3', '4', '5']);
  });

  it('pede a página do número clicado', async () => {
    await montar(1, 3, 24);

    botao('Página 3').click();

    expect(pedidas).toEqual([3]);
  });

  it('omite os trechos distantes quando há páginas demais', async () => {
    await montar(6, 12, 120);

    expect(regua()).toEqual(['1', '…', '5', '6', '7', '…', '12']);
  });

  it('não abre reticências junto à primeira página', async () => {
    await montar(2, 12, 120);

    expect(regua()).toEqual(['1', '2', '3', '…', '12']);
  });

  it('não abre reticências junto à última página', async () => {
    await montar(11, 12, 120);

    expect(regua()).toEqual(['1', '…', '10', '11', '12']);
  });

  it('não deixa a página atual ser clicada de novo', async () => {
    await montar(2, 5, 50);

    expect(botao('Página 2')).toBeNull();
    expect(fixture.nativeElement.querySelector('[aria-current="page"]').disabled).toBe(true);
  });
});
