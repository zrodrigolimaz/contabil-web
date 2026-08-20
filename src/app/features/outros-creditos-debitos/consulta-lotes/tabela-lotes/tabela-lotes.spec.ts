import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideLocalePtBr } from '../../../../app.config';
import { Lote } from '../../../../core/models/lote';
import { Ordenacao, ORDENACAO_PADRAO } from '../../../../core/models/ordenacao';
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
    ordenacao: Ordenacao = ORDENACAO_PADRAO,
  ): Promise<void> {
    fixture.componentRef.setInput('lotes', lotes);
    fixture.componentRef.setInput('selecionados', selecionados);
    fixture.componentRef.setInput('ordenacao', ordenacao);
    await fixture.whenStable();
  }

  function cabecalho(rotulo: string): HTMLTableCellElement {
    const celula = [...fixture.nativeElement.querySelectorAll('thead th')].find(
      (elemento: HTMLTableCellElement) => elemento.textContent?.trim() === rotulo,
    ) as HTMLTableCellElement | undefined;
    if (!celula) {
      throw new Error(`Coluna "${rotulo}" não está no cabeçalho`);
    }

    return celula;
  }

  function ordensPedidas(): Ordenacao[] {
    const pedidas: Ordenacao[] = [];
    fixture.componentInstance.ordenar.subscribe((ordenacao) => pedidas.push(ordenacao));

    return pedidas;
  }

  function mestre(): HTMLInputElement {
    return fixture.nativeElement.querySelector(
      'input[aria-label="Selecionar todos os lotes da página"]',
    );
  }

  function caixaDoLote(id: number): HTMLInputElement {
    return fixture.nativeElement.querySelector(`input[aria-label="Selecionar lote ${id}"]`);
  }

  /** O separador entre `R$` e o número é um espaço não-quebrável; vira espaço comum
   *  aqui para as asserções ficarem legíveis. */
  function texto(): string {
    return fixture.nativeElement.textContent.replaceAll(' ', ' ');
  }

  it('formata valor, data e data/hora em pt-BR', async () => {
    await montar([LOTE_ABERTO]);

    expect(texto()).toContain('R$ 1.000,00');
    expect(texto()).toContain('26/04/2026');
    expect(texto()).toContain('27/04/2026, 12:35:11');
  });

  it('separa os milhares dos valores altos', async () => {
    await montar([LOTE_CONFIRMADO]);

    expect(texto()).toContain('R$ 245.300,10');
  });

  it('marca a ausência de aprovador em vez de deixar a célula vazia', async () => {
    await montar([LOTE_ABERTO]);

    const celulas = fixture.nativeElement.querySelectorAll('tbody td');
    expect(celulas[6].textContent.trim()).toBe('—');
  });

  it('distingue as situações pelo tom da pastilha', async () => {
    const enviado: Lote = { ...LOTE_ABERTO, id: 1006, situacao: 'Enviado' };
    await montar([LOTE_ABERTO, enviado, LOTE_CONFIRMADO]);

    const pastilhas = [...fixture.nativeElement.querySelectorAll('tbody .chip')];
    const classePor = (situacao: string) =>
      pastilhas.find((pastilha: HTMLElement) => pastilha.textContent?.trim() === situacao)
        ?.className;

    expect(classePor('Aberto')).toContain('chip-neutro');
    expect(classePor('Confirmado')).toContain('chip-solido');
    expect(classePor('Enviado')).toBe('chip');
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

  it('pede a coluna clicada em ordem ascendente', async () => {
    await montar([LOTE_ABERTO]);
    const pedidas = ordensPedidas();

    cabecalho('Valor').querySelector('button')?.click();

    expect(pedidas).toEqual([{ campo: 'valor', direcao: 'asc' }]);
  });

  it('inverte a direção ao clicar de novo na coluna já ordenada', async () => {
    await montar([LOTE_ABERTO], new Set(), { campo: 'valor', direcao: 'asc' });
    const pedidas = ordensPedidas();

    cabecalho('Valor').querySelector('button')?.click();

    expect(pedidas).toEqual([{ campo: 'valor', direcao: 'desc' }]);
  });

  it('volta ao ascendente ao clicar na coluna ordenada em descendente', async () => {
    await montar([LOTE_ABERTO], new Set(), { campo: 'valor', direcao: 'desc' });
    const pedidas = ordensPedidas();

    cabecalho('Valor').querySelector('button')?.click();

    expect(pedidas).toEqual([{ campo: 'valor', direcao: 'asc' }]);
  });

  it('começa ascendente ao trocar de coluna, mesmo vindo de uma descendente', async () => {
    await montar([LOTE_ABERTO], new Set(), { campo: 'valor', direcao: 'desc' });
    const pedidas = ordensPedidas();

    cabecalho('Situação Lote').querySelector('button')?.click();

    expect(pedidas).toEqual([{ campo: 'situacao', direcao: 'asc' }]);
  });

  it('anuncia no cabeçalho qual coluna ordena e em que sentido', async () => {
    await montar([LOTE_ABERTO], new Set(), { campo: 'valor', direcao: 'desc' });

    expect(cabecalho('Valor').getAttribute('aria-sort')).toBe('descending');
    expect(cabecalho('ID Lote').getAttribute('aria-sort')).toBe('none');

    await montar([LOTE_ABERTO], new Set(), { campo: 'valor', direcao: 'asc' });

    expect(cabecalho('Valor').getAttribute('aria-sort')).toBe('ascending');
  });

  it('alcança pelo teclado todas as colunas ordenáveis', async () => {
    await montar([LOTE_ABERTO]);

    const botoes = fixture.nativeElement.querySelectorAll('thead th button');
    expect(botoes).toHaveLength(8);
  });

  it('troca as linhas por marcadores de carregamento durante a consulta', async () => {
    await montar([LOTE_ABERTO]);
    fixture.componentRef.setInput('carregando', true);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('tbody[aria-busy="true"]')).not.toBeNull();
    expect(texto()).not.toContain('gearqc0300_00');
  });
});
