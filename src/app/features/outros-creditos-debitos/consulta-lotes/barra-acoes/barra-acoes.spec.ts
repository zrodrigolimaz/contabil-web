import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Lote, SituacaoLote } from '../../../../core/models/lote';
import { AcaoLote, BarraAcoes } from './barra-acoes';

function loteCom(id: number, situacao: SituacaoLote, justificativa: string | null = null): Lote {
  return {
    id,
    instituicaoResponsavel: '0001 – Banco',
    instituicao: '0002 – Central',
    dataEntrada: new Date(2026, 3, 26),
    valor: 1000,
    quantidadeLancamentos: 1,
    usuarioRegistro: 'ana.costa',
    usuarioAprovacao: null,
    situacao,
    dataHoraSituacao: new Date(2026, 3, 27, 12, 35, 11),
    justificativa,
  };
}

describe('BarraAcoes', () => {
  let fixture: ComponentFixture<BarraAcoes>;
  let acionadas: AcaoLote[];

  beforeEach(() => {
    fixture = TestBed.createComponent(BarraAcoes);
    acionadas = [];
    fixture.componentInstance.acionar.subscribe((acao) => acionadas.push(acao));
  });

  async function montar(selecionados: readonly Lote[]): Promise<void> {
    fixture.componentRef.setInput('selecionados', selecionados);
    await fixture.whenStable();
  }

  function botao(rotulo: string): HTMLButtonElement {
    const encontrado = [...fixture.nativeElement.querySelectorAll('button')].find(
      (elemento: HTMLButtonElement) => elemento.textContent?.trim() === rotulo,
    );
    if (!encontrado) {
      throw new Error(`Botão "${rotulo}" não está na barra`);
    }

    return encontrado as HTMLButtonElement;
  }

  /** Rótulos dos botões que aceitam clique no estado atual. */
  function habilitados(): string[] {
    return [...fixture.nativeElement.querySelectorAll('button')]
      .filter((elemento: HTMLButtonElement) => !elemento.disabled)
      .map((elemento: HTMLButtonElement) => elemento.textContent?.trim() ?? '');
  }

  it('mostra os sete botões do enunciado, em ordem', async () => {
    await montar([]);

    const rotulos = [...fixture.nativeElement.querySelectorAll('button')].map(
      (elemento: HTMLButtonElement) => elemento.textContent?.trim(),
    );
    expect(rotulos).toEqual([
      'Confirmar',
      'Enviar',
      'Visualizar Justificativa',
      'Incluir',
      'Alterar',
      'Excluir',
      'Visualizar',
    ]);
  });

  it('sem seleção, só Incluir aceita clique', async () => {
    await montar([]);

    expect(habilitados()).toEqual(['Incluir']);
  });

  it('com um lote aberto, habilita tudo menos a justificativa que ele não tem', async () => {
    await montar([loteCom(1004, 'Aberto')]);

    expect(habilitados()).toEqual([
      'Confirmar',
      'Enviar',
      'Incluir',
      'Alterar',
      'Excluir',
      'Visualizar',
    ]);
  });

  it('com vários selecionados, desliga as ações de lote único', async () => {
    await montar([loteCom(1004, 'Aberto'), loteCom(1006, 'Enviado')]);

    expect(habilitados()).toEqual(['Confirmar', 'Enviar', 'Incluir']);
  });

  it('desliga Enviar quando nenhum selecionado está aberto', async () => {
    await montar([loteCom(1006, 'Enviado'), loteCom(1002, 'Enviado')]);

    expect(botao('Enviar').disabled).toBe(true);
    expect(botao('Confirmar').disabled).toBe(false);
  });

  it('desliga Confirmar e Enviar quando tudo já está confirmado', async () => {
    await montar([loteCom(1001, 'Confirmado'), loteCom(1003, 'Confirmado')]);

    expect(botao('Confirmar').disabled).toBe(true);
    expect(botao('Enviar').disabled).toBe(true);
  });

  it('liga Confirmar se ao menos um da seleção se aplica', async () => {
    await montar([loteCom(1001, 'Confirmado'), loteCom(1004, 'Aberto')]);

    expect(botao('Confirmar').disabled).toBe(false);
    expect(botao('Enviar').disabled).toBe(false);
  });

  it('só oferece a justificativa quando o lote tem uma', async () => {
    await montar([loteCom(1002, 'Enviado', 'Reenviado após ajuste.')]);
    expect(botao('Visualizar Justificativa').disabled).toBe(false);

    await montar([loteCom(1004, 'Aberto')]);
    expect(botao('Visualizar Justificativa').disabled).toBe(true);
  });

  it('explica no title por que o botão está desligado', async () => {
    await montar([]);

    expect(botao('Alterar').getAttribute('title')).toBe('Selecione exatamente um lote');
    expect(botao('Enviar').getAttribute('title')).toBe('Nenhum lote aberto na seleção');
  });

  it('não deixa title em botão que aceita clique', async () => {
    await montar([loteCom(1004, 'Aberto')]);

    expect(botao('Confirmar').getAttribute('title')).toBeNull();
  });

  it('anuncia a ação do botão clicado', async () => {
    await montar([loteCom(1002, 'Enviado', 'Texto da justificativa.')]);

    botao('Confirmar').click();
    botao('Visualizar Justificativa').click();
    botao('Incluir').click();

    expect(acionadas).toEqual(['confirmar', 'justificativa', 'incluir']);
  });

  it('trava a barra inteira enquanto uma ação corre', async () => {
    await montar([loteCom(1004, 'Aberto')]);
    fixture.componentRef.setInput('executando', true);
    await fixture.whenStable();

    expect(habilitados()).toEqual([]);
  });
});
