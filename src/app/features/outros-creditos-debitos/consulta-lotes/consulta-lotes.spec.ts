import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, Subject } from 'rxjs';

import { provideLocalePtBr } from '../../../app.config';
import { FILTROS_VAZIOS, FiltrosPesquisaLote } from '../../../core/models/filtros';
import { Lote } from '../../../core/models/lote';
import { ResultadoPaginado } from '../../../core/models/paginacao';
import { LoteService } from '../../../core/services/lote.service';
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

  pesquisar(filtros: FiltrosPesquisaLote, pagina = 1): Observable<ResultadoPaginado<Lote>> {
    this.recebidos.push({ filtros, pagina });
    return this.resposta.asObservable();
  }
}

function loteCom(id: number): Lote {
  return {
    id,
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
}

/** Três páginas de um lote cada — o suficiente para exercitar a navegação. */
function paginaCom(id: number, pagina: number): ResultadoPaginado<Lote> {
  return { itens: [loteCom(id)], total: 3, pagina, tamanhoPagina: 1, totalPaginas: 3 };
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
  }

  async function clicar(seletor: string): Promise<void> {
    fixture.nativeElement.querySelector(seletor).click();
    await fixture.whenStable();
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
    await responder({ itens: [], total: 0, pagina: 1, tamanhoPagina: 10, totalPaginas: 1 });

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
    await clicar('input[aria-label="Selecionar lote 1001"]');

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
    await clicar('input[aria-label="Selecionar lote 1001"]');

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
});
