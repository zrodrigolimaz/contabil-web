import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Observable, Subject } from 'rxjs';

import { FILTROS_VAZIOS, FiltrosPesquisaLote } from '../../../core/models/filtros';
import { Lote } from '../../../core/models/lote';
import { ResultadoPaginado } from '../../../core/models/paginacao';
import { LoteService } from '../../../core/services/lote.service';
import { ConsultaLotes } from './consulta-lotes';
import { FiltrosLotes } from './filtros-lotes/filtros-lotes';

/**
 * Dublê do serviço: a resposta fica sob controle do teste, o que permite verificar o
 * estado de carregamento sem depender da latência simulada.
 */
class LoteServiceFalso {
  readonly resposta = new Subject<ResultadoPaginado<Lote>>();
  readonly recebidos: FiltrosPesquisaLote[] = [];

  pesquisar(filtros: FiltrosPesquisaLote): Observable<ResultadoPaginado<Lote>> {
    this.recebidos.push(filtros);
    return this.resposta.asObservable();
  }
}

function resultadoCom(total: number): ResultadoPaginado<Lote> {
  return { itens: [], total, pagina: 1, tamanhoPagina: 10, totalPaginas: 1 };
}

describe('ConsultaLotes', () => {
  let fixture: ComponentFixture<ConsultaLotes>;
  let servico: LoteServiceFalso;

  beforeEach(async () => {
    servico = new LoteServiceFalso();
    TestBed.configureTestingModule({
      providers: [{ provide: LoteService, useValue: servico }],
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

  async function responder(total: number): Promise<void> {
    servico.resposta.next(resultadoCom(total));
    await fixture.whenStable();
  }

  function texto(): string {
    return fixture.nativeElement.textContent;
  }

  it('mostra a orientação inicial antes de qualquer pesquisa', () => {
    expect(texto()).toContain('Informe os filtros desejados e clique em Pesquisar.');
  });

  it('repassa ao serviço os filtros emitidos pelo painel', async () => {
    const filtros: FiltrosPesquisaLote = { ...FILTROS_VAZIOS, situacao: 'Aberto' };
    await pesquisarCom(filtros);

    expect(servico.recebidos).toEqual([filtros]);
  });

  it('indica o carregamento enquanto a consulta não responde', async () => {
    await pesquisarCom();

    expect(texto()).toContain('Consultando lotes…');
  });

  it('mostra o total encontrado quando a consulta responde', async () => {
    await pesquisarCom();
    await responder(24);

    expect(texto()).toContain('24 lotes encontrados.');
    expect(texto()).not.toContain('Consultando lotes…');
  });

  it('mostra o total no singular quando só um lote atende', async () => {
    await pesquisarCom();
    await responder(1);

    expect(texto()).toContain('1 lote encontrado.');
  });

  it('exibe a mensagem de falha quando a consulta dá erro', async () => {
    await pesquisarCom();

    servico.resposta.error(new Error('Não foi possível consultar os lotes. Tente novamente.'));
    await fixture.whenStable();

    const alerta = fixture.nativeElement.querySelector('[role="alert"]');
    expect(alerta.textContent).toContain('Não foi possível consultar os lotes.');
  });
});
