import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { provideLocalePtBr } from '../../../../../app.config';
import { EVENTOS_CSC } from '../../../../../core/mocks/eventos-csc.mock';
import { CampoBuscaEvento, EventoCsc } from '../../../../../core/models/evento';
import { ResultadoPaginado } from '../../../../../core/models/paginacao';
import { EventoService, TAMANHO_PAGINA_EVENTOS } from '../../../../../core/services/evento.service';
import { aparelharDialogos } from '../../../../../core/testing/dialogo-jsdom';
import { paginar } from '../../../../../core/utils/paginar';
import { PesquisaEvento } from './pesquisa-evento';

interface Chamada {
  readonly campo: CampoBuscaEvento;
  readonly valor: string;
  readonly pagina: number;
}

class EventoFalso {
  readonly chamadas: Chamada[] = [];

  pesquisar(
    campo: CampoBuscaEvento,
    valor: string,
    pagina = 1,
  ): Observable<ResultadoPaginado<EventoCsc>> {
    this.chamadas.push({ campo, valor, pagina });

    const termo = valor.trim().toLowerCase();
    const encontrados = termo
      ? EVENTOS_CSC.filter((evento) => evento[campo].toLowerCase().includes(termo))
      : EVENTOS_CSC;

    return of(paginar(encontrados, pagina, TAMANHO_PAGINA_EVENTOS));
  }
}

describe('PesquisaEvento', () => {
  let fixture: ComponentFixture<PesquisaEvento>;
  let eventos: EventoFalso;
  let escolhidos: EventoCsc[];
  let fechamentos: number;

  beforeEach(async () => {
    eventos = new EventoFalso();

    TestBed.configureTestingModule({
      providers: [{ provide: EventoService, useValue: eventos }, provideLocalePtBr()],
    });

    fixture = TestBed.createComponent(PesquisaEvento);
    escolhidos = [];
    fechamentos = 0;
    fixture.componentInstance.escolher.subscribe((evento) => escolhidos.push(evento));
    fixture.componentInstance.fechar.subscribe(() => fechamentos++);
    fixture.componentRef.setInput('aberto', false);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  });

  async function abrir(): Promise<void> {
    fixture.componentRef.setInput('aberto', true);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  }

  async function digitar(seletor: string, valor: string): Promise<void> {
    const elemento: HTMLInputElement | HTMLSelectElement =
      fixture.nativeElement.querySelector(seletor);
    elemento.value = valor;
    elemento.dispatchEvent(new Event('input'));
    elemento.dispatchEvent(new Event('change'));
    await fixture.whenStable();
  }

  async function clicar(seletor: string): Promise<void> {
    fixture.nativeElement.querySelector(seletor).click();
    await fixture.whenStable();
  }

  async function clicarNoBotao(rotulo: string): Promise<void> {
    const botao = [...fixture.nativeElement.querySelectorAll('button')].find(
      (elemento: HTMLButtonElement) => elemento.textContent?.trim() === rotulo,
    ) as HTMLButtonElement;

    botao.click();
    await fixture.whenStable();
  }

  function linhas(): HTMLTableRowElement[] {
    return [...fixture.nativeElement.querySelectorAll('tbody tr')];
  }

  function botao(rotulo: string): HTMLButtonElement {
    return [...fixture.nativeElement.querySelectorAll('button')].find(
      (elemento: HTMLButtonElement) => elemento.textContent?.trim() === rotulo,
    ) as HTMLButtonElement;
  }

  it('nem consulta enquanto está fechado', () => {
    expect(eventos.chamadas).toEqual([]);
  });

  it('abre listando a primeira página de eventos', async () => {
    await abrir();

    expect(eventos.chamadas).toEqual([{ campo: 'idEvento', valor: '', pagina: 1 }]);
    expect(linhas()).toHaveLength(TAMANHO_PAGINA_EVENTOS);
    expect(fixture.nativeElement.textContent).toContain('Centralização Título CSC Crédito');
  });

  it('lista pelo campo de busca escolhido', async () => {
    await abrir();
    await digitar('select', 'descricao');
    await digitar('input[type="text"]', 'tarifa');
    await clicarNoBotao('Listar');

    expect(eventos.chamadas.at(-1)).toEqual({ campo: 'descricao', valor: 'tarifa', pagina: 1 });
    expect(linhas()).toHaveLength(2);
    expect(fixture.nativeElement.textContent).toContain('Tarifa de Manutenção de Conta');
  });

  it('mostra o vazio do legado quando nada corresponde', async () => {
    await abrir();
    await digitar('input[type="text"]', 'inexistente');
    await clicarNoBotao('Listar');

    expect(fixture.nativeElement.textContent).toContain('Nenhum registro encontrado.');
  });

  it('mantém a busca corrente ao trocar de página', async () => {
    await abrir();
    await digitar('select', 'descricao');
    await digitar('input[type="text"]', 'csc');
    await clicarNoBotao('Listar');
    await clicar('button[aria-label="Próxima página"]');

    expect(eventos.chamadas.at(-1)).toEqual({ campo: 'descricao', valor: 'csc', pagina: 2 });
  });

  it('só confirma com um evento marcado', async () => {
    await abrir();

    expect(botao('OK').disabled).toBe(true);

    await clicar('input[aria-label="Selecionar evento 104"]');
    expect(botao('OK').disabled).toBe(false);

    await clicarNoBotao('OK');
    expect(escolhidos).toEqual([EVENTOS_CSC[2]]);
  });

  it('mantém o evento marcado ao clicar de novo na linha', async () => {
    await abrir();
    await clicar('input[aria-label="Selecionar evento 104"]');
    await clicar('input[aria-label="Selecionar evento 104"]');

    expect(botao('OK').disabled).toBe(false);
  });

  it('esquece a marcação ao paginar', async () => {
    await abrir();
    await clicar('input[aria-label="Selecionar evento 104"]');
    await clicar('button[aria-label="Próxima página"]');

    expect(botao('OK').disabled).toBe(true);
  });

  it('sai sem escolher pelo Fechar', async () => {
    await abrir();
    await clicar('input[aria-label="Selecionar evento 104"]');
    await clicarNoBotao('Fechar');

    expect(escolhidos).toEqual([]);
    expect(fechamentos).toBe(1);
  });

  it('recomeça a cada abertura', async () => {
    await abrir();
    await digitar('select', 'descricao');
    await digitar('input[type="text"]', 'tarifa');
    await clicarNoBotao('Listar');

    fixture.componentRef.setInput('aberto', false);
    await fixture.whenStable();
    await abrir();

    expect(eventos.chamadas.at(-1)).toEqual({ campo: 'idEvento', valor: '', pagina: 1 });
    expect(linhas()).toHaveLength(TAMANHO_PAGINA_EVENTOS);
  });
});
