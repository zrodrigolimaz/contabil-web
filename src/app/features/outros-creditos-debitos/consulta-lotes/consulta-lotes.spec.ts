import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, Subject } from 'rxjs';

import { provideLocalePtBr } from '../../../app.config';
import { FILTROS_VAZIOS, FiltrosPesquisaLote } from '../../../core/models/filtros';
import { Lote, SituacaoLote } from '../../../core/models/lote';
import { ResultadoPaginado } from '../../../core/models/paginacao';
import { LoteService } from '../../../core/services/lote.service';
import { aparelharDialogos } from '../../../core/testing/dialogo-jsdom';
import { ConsultaLotes } from './consulta-lotes';
import { FiltrosLotes } from './filtros-lotes/filtros-lotes';

/** Pedido registrado pelo dublê: os filtros e a página consultada. */
interface Consulta {
  readonly filtros: FiltrosPesquisaLote;
  readonly pagina: number;
}

/**
 * Dublê do serviço: a resposta fica sob controle do teste, o que permite verificar o
 * estado de carregamento sem depender da latência simulada.
 */
class LoteServiceFalso {
  readonly resposta = new Subject<ResultadoPaginado<Lote>>();
  readonly recebidos: Consulta[] = [];

  /** Retorno de `confirmar`/`enviar`: os lotes que de fato mudaram de situação. */
  readonly alteracao = new Subject<readonly Lote[]>();
  readonly confirmados: number[][] = [];
  readonly enviados: number[][] = [];

  pesquisar(filtros: FiltrosPesquisaLote, pagina = 1): Observable<ResultadoPaginado<Lote>> {
    this.recebidos.push({ filtros, pagina });
    return this.resposta.asObservable();
  }

  confirmar(ids: readonly number[]): Observable<readonly Lote[]> {
    this.confirmados.push([...ids]);
    return this.alteracao.asObservable();
  }

  enviar(ids: readonly number[]): Observable<readonly Lote[]> {
    this.enviados.push([...ids]);
    return this.alteracao.asObservable();
  }
}

function loteCom(
  id: number,
  situacao: SituacaoLote = 'Aberto',
  justificativa: string | null = null,
): Lote {
  return {
    id,
    instituicaoResponsavel: '0001 – Banco',
    instituicao: '0002 – Central',
    dataEntrada: new Date(2026, 3, 26),
    valor: 1000,
    quantidadeLancamentos: 1,
    usuarioRegistro: 'gearqc0300_00',
    usuarioAprovacao: null,
    situacao,
    dataHoraSituacao: new Date(2026, 3, 27, 12, 35, 11),
    justificativa,
  };
}

/** Três páginas de um lote cada — o suficiente para exercitar a navegação. */
function paginaCom(id: number, pagina: number): ResultadoPaginado<Lote> {
  return { itens: [loteCom(id)], total: 3, pagina, tamanhoPagina: 1, totalPaginas: 3 };
}

/** Uma página única com os lotes informados, para os testes de ação. */
function paginaUnica(itens: readonly Lote[]): ResultadoPaginado<Lote> {
  return { itens, total: itens.length, pagina: 1, tamanhoPagina: 10, totalPaginas: 1 };
}

describe('ConsultaLotes', () => {
  let fixture: ComponentFixture<ConsultaLotes>;
  let servico: LoteServiceFalso;

  beforeEach(async () => {
    servico = new LoteServiceFalso();
    TestBed.configureTestingModule({
      providers: [{ provide: LoteService, useValue: servico }, provideLocalePtBr()],
    });

    fixture = TestBed.createComponent(ConsultaLotes);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  });

  async function pesquisarCom(filtros = FILTROS_VAZIOS): Promise<void> {
    fixture.debugElement
      .query(By.directive(FiltrosLotes))
      .componentInstance.pesquisar.emit(filtros);
    await fixture.whenStable();
  }

  async function responder(resultado: ResultadoPaginado<Lote>): Promise<void> {
    servico.resposta.next(resultado);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  }

  /** Pesquisa e responde de uma vez, deixando a grade pronta para agir. */
  async function grade(itens: readonly Lote[]): Promise<void> {
    await pesquisarCom();
    await responder(paginaUnica(itens));
  }

  async function responderAcao(alterados: readonly Lote[]): Promise<void> {
    servico.alteracao.next(alterados);
    await fixture.whenStable();
  }

  async function clicar(seletor: string): Promise<void> {
    fixture.nativeElement.querySelector(seletor).click();
    await fixture.whenStable();
  }

  async function clicarNaAcao(rotulo: string): Promise<void> {
    const botao = [...fixture.nativeElement.querySelectorAll('[role="toolbar"] button')].find(
      (elemento: HTMLButtonElement) => elemento.textContent?.trim() === rotulo,
    ) as HTMLButtonElement | undefined;
    if (!botao) {
      throw new Error(`Botão "${rotulo}" não está na barra`);
    }

    botao.click();
    await fixture.whenStable();
  }

  async function marcar(id: number): Promise<void> {
    await clicar(`input[aria-label="Selecionar lote ${id}"]`);
  }

  function caixaDoLote(id: number): HTMLInputElement {
    return fixture.nativeElement.querySelector(`input[aria-label="Selecionar lote ${id}"]`);
  }

  function texto(): string {
    return fixture.nativeElement.textContent;
  }

  it('mostra a orientação inicial antes de qualquer pesquisa', () => {
    expect(texto()).toContain('Nenhuma pesquisa realizada');
  });

  it('repassa ao serviço os filtros emitidos pelo painel', async () => {
    const filtros: FiltrosPesquisaLote = { ...FILTROS_VAZIOS, situacao: 'Aberto' };
    await pesquisarCom(filtros);

    expect(servico.recebidos).toEqual([{ filtros, pagina: 1 }]);
  });

  it('indica o carregamento enquanto a primeira consulta não responde', async () => {
    await pesquisarCom();

    expect(texto()).toContain('Consultando lotes…');
  });

  it('lista os lotes devolvidos pela consulta', async () => {
    await pesquisarCom();
    await responder(paginaCom(1001, 1));

    expect(caixaDoLote(1001)).not.toBeNull();
    expect(texto()).not.toContain('Consultando lotes…');
  });

  it('usa a frase do legado quando nada é encontrado', async () => {
    await pesquisarCom();
    await responder(paginaUnica([]));

    expect(texto()).toContain('Nenhum registro encontrado.');
  });

  it('exibe a mensagem de falha quando a consulta dá erro', async () => {
    await pesquisarCom();

    servico.resposta.error(new Error('Não foi possível consultar os lotes. Tente novamente.'));
    await fixture.whenStable();

    const alerta = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alerta.textContent).toContain('Não foi possível consultar os lotes.');
  });

  it('repete a consulta com os mesmos filtros ao mudar de página', async () => {
    const filtros: FiltrosPesquisaLote = { ...FILTROS_VAZIOS, situacao: 'Enviado' };
    await pesquisarCom(filtros);
    await responder(paginaCom(1001, 1));

    await clicar('button[aria-label="Próxima página"]');

    expect(servico.recebidos[1]).toEqual({ filtros, pagina: 2 });
  });

  it('volta para a primeira página a cada nova pesquisa', async () => {
    await pesquisarCom();
    await responder(paginaCom(1001, 1));
    await clicar('button[aria-label="Última página"]');
    await responder(paginaCom(1003, 3));

    await pesquisarCom();

    expect(servico.recebidos.at(-1)?.pagina).toBe(1);
  });

  it('preserva a seleção ao navegar entre páginas', async () => {
    await pesquisarCom();
    await responder(paginaCom(1001, 1));
    await marcar(1001);

    await clicar('button[aria-label="Próxima página"]');
    await responder(paginaCom(1002, 2));
    expect(caixaDoLote(1002).checked).toBe(false);

    await clicar('button[aria-label="Página anterior"]');
    await responder(paginaCom(1001, 1));

    expect(caixaDoLote(1001).checked).toBe(true);
  });

  it('marca e desmarca apenas os lotes da página exibida', async () => {
    await pesquisarCom();
    await responder(paginaCom(1001, 1));
    await marcar(1001);

    await clicar('button[aria-label="Próxima página"]');
    await responder(paginaCom(1002, 2));
    await clicar('input[aria-label="Selecionar todos os lotes da página"]');
    expect(caixaDoLote(1002).checked).toBe(true);

    await clicar('input[aria-label="Selecionar todos os lotes da página"]');
    expect(caixaDoLote(1002).checked).toBe(false);

    await clicar('button[aria-label="Página anterior"]');
    await responder(paginaCom(1001, 1));

    expect(caixaDoLote(1001).checked).toBe(true);
  });

  it('só mostra a barra de ações depois da primeira pesquisa', async () => {
    expect(fixture.nativeElement.querySelector('[role="toolbar"]')).toBeNull();

    await grade([loteCom(1004)]);

    expect(fixture.nativeElement.querySelector('[role="toolbar"]')).not.toBeNull();
  });

  it('confirma exatamente os lotes marcados', async () => {
    await grade([loteCom(1004), loteCom(1005), loteCom(1006)]);
    await marcar(1004);
    await marcar(1006);

    await clicarNaAcao('Confirmar');

    expect(servico.confirmados).toEqual([[1004, 1006]]);
  });

  it('envia exatamente os lotes marcados', async () => {
    await grade([loteCom(1004), loteCom(1005)]);
    await marcar(1005);

    await clicarNaAcao('Enviar');

    expect(servico.enviados).toEqual([[1005]]);
  });

  it('conta no aviso o que mudou e o que foi ignorado', async () => {
    await grade([loteCom(1004), loteCom(1005, 'Confirmado')]);
    await marcar(1004);
    await marcar(1005);

    await clicarNaAcao('Confirmar');
    await responderAcao([loteCom(1004, 'Confirmado')]);

    expect(texto()).toContain('1 lote confirmado.');
    expect(texto()).toContain('1 lote já estava confirmado e foi ignorado.');
  });

  it('omite a parte dos ignorados quando todos mudaram', async () => {
    await grade([loteCom(1004), loteCom(1005)]);
    await clicar('input[aria-label="Selecionar todos os lotes da página"]');

    await clicarNaAcao('Enviar');
    await responderAcao([loteCom(1004, 'Enviado'), loteCom(1005, 'Enviado')]);

    expect(texto()).toContain('2 lotes enviados.');
    expect(texto()).not.toContain('ignorado');
  });

  it('limpa a seleção e reconsulta a página depois da ação', async () => {
    const filtros: FiltrosPesquisaLote = { ...FILTROS_VAZIOS, situacao: 'Aberto' };
    await pesquisarCom(filtros);
    await responder(paginaUnica([loteCom(1004)]));
    await marcar(1004);

    await clicarNaAcao('Confirmar');
    await responderAcao([loteCom(1004, 'Confirmado')]);
    await responder(paginaUnica([loteCom(1004, 'Confirmado')]));

    expect(caixaDoLote(1004).checked).toBe(false);
    expect(servico.recebidos.at(-1)).toEqual({ filtros, pagina: 1 });
  });

  it('descarta o aviso ao começar uma nova pesquisa', async () => {
    await grade([loteCom(1004)]);
    await marcar(1004);
    await clicarNaAcao('Enviar');
    await responderAcao([loteCom(1004, 'Enviado')]);
    await responder(paginaUnica([loteCom(1004, 'Enviado')]));
    expect(texto()).toContain('1 lote enviado.');

    await pesquisarCom();
    await responder(paginaUnica([loteCom(1004, 'Enviado')]));

    expect(texto()).not.toContain('1 lote enviado.');
  });

  it('responde ao clique das ações que ainda não têm tela', async () => {
    await grade([loteCom(1004)]);
    await marcar(1004);

    await clicarNaAcao('Visualizar');

    expect(texto()).toContain('Visualizar abre os lançamentos do lote em leitura');
  });

  it('avisa o que Incluir fará mesmo sem nenhuma seleção', async () => {
    await grade([loteCom(1004)]);

    await clicarNaAcao('Incluir');

    expect(texto()).toContain('Incluir abre a tela de lançamentos de um lote novo');
  });

  it('abre a justificativa do lote selecionado', async () => {
    await grade([loteCom(1002, 'Enviado', 'Reenviado após ajuste do histórico.')]);
    await marcar(1002);

    await clicarNaAcao('Visualizar Justificativa');

    const dialogo: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
    expect(dialogo.open).toBe(true);
    expect(dialogo.textContent).toContain('Reenviado após ajuste do histórico.');
  });

  it('mantém a justificativa fechada enquanto ninguém a pede', async () => {
    await grade([loteCom(1002, 'Enviado', 'Texto qualquer.')]);
    await marcar(1002);

    const dialogo: HTMLDialogElement = fixture.nativeElement.querySelector('dialog');
    expect(dialogo.open).toBe(false);
  });
});
