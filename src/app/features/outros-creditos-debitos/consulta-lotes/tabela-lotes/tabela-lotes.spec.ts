import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideLocalePtBr } from '../../../../app.config';
import { Lote } from '../../../../core/models/lote';
import { TabelaLotes } from './tabela-lotes';

const LOTE_ABERTO: Lote = {
  id: 1004,
  instituicaoResponsavel: '0001 – Banco',
  instituicao: '0002 – Central',
  dataEntrada: new Date(2026, 3, 26),
  valor: 1000,
  quantidadeLancamentos: 1,
  usuarioRegistro: 'gearqc0300_00',
  usuarioAprovacao: null,
  situacao: 'Aberto',
  dataHoraSituacao: new Date(2026, 3, 27, 12, 35, 11),
  justificativa: null,
};

const LOTE_CONFIRMADO: Lote = {
  ...LOTE_ABERTO,
  id: 1005,
  valor: 245300.1,
  usuarioAprovacao: 'ana.costa',
  situacao: 'Confirmado',
};

describe('TabelaLotes', () => {
  let fixture: ComponentFixture<TabelaLotes>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalePtBr()] });
    fixture = TestBed.createComponent(TabelaLotes);
  });

  async function montar(
    lotes: readonly Lote[],
    selecionados: ReadonlySet<number> = new Set(),
  ): Promise<void> {
    fixture.componentRef.setInput('lotes', lotes);
    fixture.componentRef.setInput('selecionados', selecionados);
    await fixture.whenStable();
  }

  function mestre(): HTMLInputElement {
    return fixture.nativeElement.querySelector(
      'input[aria-label="Selecionar todos os lotes da página"]',
    );
  }

  function caixaDoLote(id: number): HTMLInputElement {
    return fixture.nativeElement.querySelector(`input[aria-label="Selecionar lote ${id}"]`);
  }

  function texto(): string {
    return fixture.nativeElement.textContent;
  }

  it('formata valor, data e data/hora em pt-BR', async () => {
    await montar([LOTE_ABERTO]);

    expect(texto()).toContain('1.000,00');
    expect(texto()).toContain('26/04/2026');
    expect(texto()).toContain('27/04/2026, 12:35:11');
  });

  it('separa os milhares dos valores altos', async () => {
    await montar([LOTE_CONFIRMADO]);

    expect(texto()).toContain('245.300,10');
  });

  it('marca a ausência de aprovador em vez de deixar a célula vazia', async () => {
    await montar([LOTE_ABERTO]);

    const celulas = fixture.nativeElement.querySelectorAll('tbody td');
    expect(celulas[6].textContent.trim()).toBe('—');
  });

  it('mostra a frase do legado quando não há resultados', async () => {
    await montar([]);

    expect(texto()).toContain('Nenhum registro encontrado.');
  });

  it('emite o id do lote cuja caixa é clicada', async () => {
    await montar([LOTE_ABERTO, LOTE_CONFIRMADO]);
    const emitidos: number[] = [];
    fixture.componentInstance.alternarSelecao.subscribe((id) => emitidos.push(id));

    caixaDoLote(1005).click();

    expect(emitidos).toEqual([1005]);
  });

  it('reflete a seleção vinda de fora nas caixas das linhas', async () => {
    await montar([LOTE_ABERTO, LOTE_CONFIRMADO], new Set([1005]));

    expect(caixaDoLote(1004).checked).toBe(false);
    expect(caixaDoLote(1005).checked).toBe(true);
  });

  it('deixa a caixa mestre limpa quando nada está selecionado', async () => {
    await montar([LOTE_ABERTO, LOTE_CONFIRMADO]);

    expect(mestre().checked).toBe(false);
    expect(mestre().indeterminate).toBe(false);
  });

  it('deixa a caixa mestre indeterminada com seleção parcial', async () => {
    await montar([LOTE_ABERTO, LOTE_CONFIRMADO], new Set([1004]));

    expect(mestre().checked).toBe(false);
    expect(mestre().indeterminate).toBe(true);
  });

  it('marca a caixa mestre quando a página inteira está selecionada', async () => {
    await montar([LOTE_ABERTO, LOTE_CONFIRMADO], new Set([1004, 1005]));

    expect(mestre().checked).toBe(true);
    expect(mestre().indeterminate).toBe(false);
  });

  it('pede a marcação de todos quando a caixa mestre é acionada', async () => {
    await montar([LOTE_ABERTO, LOTE_CONFIRMADO]);
    const emitidos: boolean[] = [];
    fixture.componentInstance.alternarTodos.subscribe((marcar) => emitidos.push(marcar));

    mestre().click();

    expect(emitidos).toEqual([true]);
  });

  it('pede a desmarcação quando a caixa mestre já está marcada', async () => {
    await montar([LOTE_ABERTO, LOTE_CONFIRMADO], new Set([1004, 1005]));
    const emitidos: boolean[] = [];
    fixture.componentInstance.alternarTodos.subscribe((marcar) => emitidos.push(marcar));

    mestre().click();

    expect(emitidos).toEqual([false]);
  });

  it('troca as linhas por marcadores de carregamento durante a consulta', async () => {
    await montar([LOTE_ABERTO]);
    fixture.componentRef.setInput('carregando', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('tbody[aria-busy="true"]')).not.toBeNull();
    expect(texto()).not.toContain('gearqc0300_00');
  });
});
