import { ComponentFixture, TestBed } from '@angular/core/testing';

import { provideLocalePtBr } from '../../../../app.config';
import { HISTORICO, PA } from '../../../../core/mocks/opcoes.mock';
import { Lancamento } from '../../../../core/models/lancamento';
import { GradeLancamentos } from './grade-lancamentos';

function lancamentoCom(id: number, parcial: Partial<Lancamento> = {}): Lancamento {
  return {
    id,
    idLote: 1004,
    conta: '44444',
    titular: 'Ana Paula Costa',
    valor: 1250.5,
    historico: HISTORICO.manual,
    estorno: false,
    documento: `20260800${id}`,
    descricao: '',
    situacao: 'Pendente',
    pa: PA.cooperativa,
    idEvento: null,
    descricaoEvento: null,
    complementoHistorico: '',
    situacaoDocumentoCsc: 'Aguardando Processamento CCO',
    idDocumentoCsc: null,
    anexos: [],
    ...parcial,
  };
}

describe('GradeLancamentos', () => {
  let fixture: ComponentFixture<GradeLancamentos>;
  let selecionados: number[];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideLocalePtBr()] });
    fixture = TestBed.createComponent(GradeLancamentos);
    selecionados = [];
    fixture.componentInstance.selecionar.subscribe((id) => selecionados.push(id));
  });

  async function montar(
    lancamentos: readonly Lancamento[],
    selecionado: number | null = null,
  ): Promise<void> {
    fixture.componentRef.setInput('lancamentos', lancamentos);
    fixture.componentRef.setInput('selecionado', selecionado);
    await fixture.whenStable();
  }

  function texto(): string {
    return fixture.nativeElement.textContent;
  }

  function radioDo(id: number): HTMLInputElement {
    return fixture.nativeElement.querySelector(`input[aria-label="Selecionar lançamento ${id}"]`);
  }

  it('usa a frase do legado quando o lote não tem lançamentos', async () => {
    await montar([]);

    expect(texto()).toContain('Nenhum registro encontrado.');
  });

  it('lista os lançamentos com conta, titular e valor em reais', async () => {
    await montar([lancamentoCom(1)]);

    expect(texto()).toContain('44444');
    expect(texto()).toContain('Ana Paula Costa');
    expect(texto()).toContain('1.250,50');
  });

  it('marca o estorno para não passar por lançamento comum', async () => {
    await montar([lancamentoCom(1, { estorno: true })]);

    expect(texto()).toContain('Estorno');
  });

  it('anuncia a linha marcada', async () => {
    await montar([lancamentoCom(1), lancamentoCom(2)]);

    radioDo(2).click();

    expect(selecionados).toEqual([2]);
  });

  it('mantém a linha marcada ao clicar de novo nela', async () => {
    await montar([lancamentoCom(1), lancamentoCom(2)], 2);

    radioDo(2).click();

    expect(selecionados).toEqual([2]);
  });

  it('mostra marcada a linha que o container informa', async () => {
    await montar([lancamentoCom(1), lancamentoCom(2)], 1);

    expect(radioDo(1).checked).toBe(true);
    expect(radioDo(2).checked).toBe(false);
  });
});
