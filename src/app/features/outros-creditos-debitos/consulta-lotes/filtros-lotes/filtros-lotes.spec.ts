import { ComponentFixture, TestBed } from '@angular/core/testing';

import { INSTITUICOES_RESPONSAVEIS } from '../../../../core/mocks/opcoes.mock';
import { FiltrosPesquisaLote } from '../../../../core/models/filtros';
import { FiltrosLotes } from './filtros-lotes';

describe('FiltrosLotes', () => {
  let fixture: ComponentFixture<FiltrosLotes>;
  let emitidos: FiltrosPesquisaLote[];

  beforeEach(async () => {
    fixture = TestBed.createComponent(FiltrosLotes);
    emitidos = [];
    fixture.componentInstance.pesquisar.subscribe((filtros) => emitidos.push(filtros));
    await fixture.whenStable();
  });

  function faixa(indice: number): HTMLInputElement[] {
    const campos = fixture.nativeElement.querySelectorAll('app-campo-faixa');
    return Array.from(campos[indice].querySelectorAll('input'));
  }

  function preencher(campo: HTMLInputElement | HTMLSelectElement, valor: string): void {
    campo.value = valor;
    campo.dispatchEvent(new Event(campo instanceof HTMLSelectElement ? 'change' : 'input'));
  }

  function botao(texto: string): HTMLButtonElement {
    const botoes: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    const encontrado = botoes.find((atual) => atual.textContent?.trim() === texto);

    if (!encontrado) {
      throw new Error(`Botão "${texto}" não encontrado.`);
    }
    return encontrado;
  }

  async function enviar(): Promise<void> {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  it('emite filtros vazios quando nada é informado', async () => {
    await enviar();

    expect(emitidos).toEqual([
      {
        instituicaoResponsavel: null,
        instituicao: null,
        situacao: 'Todas',
        idLote: { de: null, ate: null },
        valor: { de: null, ate: null },
        dataEntrada: { de: null, ate: null },
      },
    ]);
  });

  it('monta os filtros informados, convertendo data em branco para nulo', async () => {
    const [idDe, idAte] = faixa(0);
    preencher(idDe, '1005');
    preencher(idAte, '1008');

    const [dataDe] = faixa(2);
    preencher(dataDe, '2026-01-01');

    const situacao: HTMLSelectElement = fixture.nativeElement.querySelector('#filtro-situacao');
    preencher(situacao, situacao.options[1].value);

    const instituicao: HTMLSelectElement = fixture.nativeElement.querySelector(
      '#filtro-instituicao-responsavel',
    );
    preencher(instituicao, instituicao.options[1].value);

    await enviar();

    expect(emitidos).toHaveLength(1);
    expect(emitidos[0]).toEqual({
      instituicaoResponsavel: INSTITUICOES_RESPONSAVEIS[0],
      instituicao: null,
      situacao: 'Aberto',
      idLote: { de: 1005, ate: 1008 },
      valor: { de: null, ate: null },
      dataEntrada: { de: '2026-01-01', ate: null },
    });
  });

  it('não pesquisa com faixa invertida e mostra a mensagem de erro', async () => {
    const [de, ate] = faixa(0);
    preencher(de, '1008');
    preencher(ate, '1005');

    await enviar();

    expect(emitidos).toHaveLength(0);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'O valor inicial deve ser menor ou igual ao final.',
    );
    expect(de.getAttribute('aria-invalid')).toBe('true');
  });

  it('volta a pesquisar depois de corrigir a faixa', async () => {
    const [de, ate] = faixa(1);
    preencher(de, '90000');
    preencher(ate, '10000');
    await enviar();

    preencher(ate, '900000');
    await enviar();

    expect(emitidos).toHaveLength(1);
    expect(emitidos[0].valor).toEqual({ de: 900, ate: 9000 });
  });

  it('bloqueia o envio enquanto a consulta está em andamento', async () => {
    fixture.componentRef.setInput('carregando', true);
    await fixture.whenStable();

    const enviarBotao: HTMLButtonElement =
      fixture.nativeElement.querySelector('button[type="submit"]');

    expect(enviarBotao.disabled).toBe(true);
    expect(enviarBotao.textContent).toContain('Buscando');
  });

  describe('resumo dos critérios no painel recolhido', () => {
    async function recolher(): Promise<void> {
      fixture.nativeElement.querySelector('button[aria-controls]').click();
      await fixture.whenStable();
    }

    function chips(): string[] {
      const encontrados: HTMLElement[] = Array.from(
        fixture.nativeElement.querySelectorAll('.chip'),
      );
      return encontrados.map((chip) => chip.textContent?.trim() ?? '');
    }

    it('não mostra pastilhas antes da primeira pesquisa', async () => {
      await recolher();

      expect(chips()).toHaveLength(0);
    });

    it('descreve cada critério informado', async () => {
      const [idDe, idAte] = faixa(0);
      preencher(idDe, '1005');
      preencher(idAte, '1008');

      const [, valorAte] = faixa(1);
      preencher(valorAte, '500000');

      const situacao: HTMLSelectElement = fixture.nativeElement.querySelector('#filtro-situacao');
      preencher(situacao, situacao.options[1].value);

      await enviar();
      await recolher();

      expect(chips()).toEqual(['Situação: Aberto', 'ID Lote: 1005 a 1008', 'Valor: até 5.000,00']);
    });

    it('avisa quando a pesquisa não tem critérios', async () => {
      await enviar();
      await recolher();

      expect(chips()).toEqual(['Todos os lotes']);
    });
  });

  it('não repete identificadores entre os três campos de faixa', async () => {
    const identificados: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('app-campo-faixa [id]'),
    );
    const ids = identificados.map((elemento) => elemento.id);

    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('limpa os campos e refaz a pesquisa sem critérios', async () => {
    const [de] = faixa(0);
    preencher(de, '1005');
    await enviar();

    botao('Limpar').click();
    await fixture.whenStable();

    expect(emitidos).toHaveLength(2);
    expect(emitidos[1].idLote).toEqual({ de: null, ate: null });
    expect(emitidos[1].situacao).toBe('Todas');
    expect(de.value).toBe('');
  });
});
