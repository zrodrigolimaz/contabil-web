import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { provideLocalePtBr } from '../../../../../app.config';
import { CONTAS_CORRENTES } from '../../../../../core/mocks/contas-correntes.mock';
import { CampoBuscaConta, ContaCorrente } from '../../../../../core/models/conta-corrente';
import { ResultadoPaginado } from '../../../../../core/models/paginacao';
import {
  ContaCorrenteService,
  TAMANHO_PAGINA_CONTAS,
} from '../../../../../core/services/conta-corrente.service';
import { aparelharDialogos } from '../../../../../core/testing/dialogo-jsdom';
import { paginar } from '../../../../../core/utils/paginar';
import { PesquisaConta } from './pesquisa-conta';

interface Chamada {
  readonly campo: CampoBuscaConta;
  readonly valor: string;
  readonly pagina: number;
}

class ContaCorrenteFalso {
  readonly chamadas: Chamada[] = [];

  pesquisar(
    campo: CampoBuscaConta,
    valor: string,
    pagina = 1,
  ): Observable<ResultadoPaginado<ContaCorrente>> {
    this.chamadas.push({ campo, valor, pagina });

    const termo = valor.trim().toLowerCase();
    const encontradas = termo
      ? CONTAS_CORRENTES.filter((conta) => conta[campo].toLowerCase().includes(termo))
      : CONTAS_CORRENTES;

    return of(paginar(encontradas, pagina, TAMANHO_PAGINA_CONTAS));
  }
}

describe('PesquisaConta', () => {
  let fixture: ComponentFixture<PesquisaConta>;
  let contas: ContaCorrenteFalso;
  let escolhidas: ContaCorrente[];
  let fechamentos: number;

  beforeEach(async () => {
    contas = new ContaCorrenteFalso();

    TestBed.configureTestingModule({
      providers: [{ provide: ContaCorrenteService, useValue: contas }, provideLocalePtBr()],
    });

    fixture = TestBed.createComponent(PesquisaConta);
    escolhidas = [];
    fechamentos = 0;
    fixture.componentInstance.escolher.subscribe((conta) => escolhidas.push(conta));
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
    botao(rotulo).click();
    await fixture.whenStable();
  }

  function botao(rotulo: string): HTMLButtonElement {
    return [...fixture.nativeElement.querySelectorAll('button')].find(
      (elemento: HTMLButtonElement) => elemento.textContent?.trim() === rotulo,
    ) as HTMLButtonElement;
  }

  function linhas(): HTMLTableRowElement[] {
    return [...fixture.nativeElement.querySelectorAll('tbody tr')];
  }

  it('nem consulta enquanto está fechado', () => {
    expect(contas.chamadas).toEqual([]);
  });

  it('abre listando a primeira página de contas', async () => {
    await abrir();

    expect(contas.chamadas).toEqual([{ campo: 'numero', valor: '', pagina: 1 }]);
    expect(linhas()).toHaveLength(TAMANHO_PAGINA_CONTAS);
    expect(fixture.nativeElement.textContent).toContain('Ana Paula Costa');
  });

  it('lista pelo campo de busca escolhido', async () => {
    await abrir();
    await digitar('select', 'titular');
    await digitar('input[type="text"]', 'souza');
    await clicarNoBotao('Listar');

    expect(contas.chamadas.at(-1)).toEqual({ campo: 'titular', valor: 'souza', pagina: 1 });
    expect(linhas()).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Carla Souza Ferreira');
  });

  it('lista as contas de uma agência', async () => {
    await abrir();
    await digitar('select', 'agencia');
    await digitar('input[type="text"]', '0104');
    await clicarNoBotao('Listar');

    expect(fixture.nativeElement.textContent).toContain('Gabriela Martins Pinto');
    expect(fixture.nativeElement.textContent).not.toContain('Ana Paula Costa');
  });

  it('mostra o vazio do legado quando nada corresponde', async () => {
    await abrir();
    await digitar('input[type="text"]', '00000');
    await clicarNoBotao('Listar');

    expect(fixture.nativeElement.textContent).toContain('Nenhum registro encontrado.');
  });

  it('mantém a busca corrente ao trocar de página', async () => {
    await abrir();
    await digitar('select', 'agencia');
    await digitar('input[type="text"]', '010');
    await clicarNoBotao('Listar');
    await clicar('button[aria-label="Próxima página"]');

    expect(contas.chamadas.at(-1)).toEqual({ campo: 'agencia', valor: '010', pagina: 2 });
  });

  it('só confirma com uma conta marcada', async () => {
    await abrir();

    expect(botao('OK').disabled).toBe(true);

    await clicar('input[aria-label="Selecionar conta 20567"]');
    expect(botao('OK').disabled).toBe(false);

    await clicarNoBotao('OK');
    expect(escolhidas).toEqual([CONTAS_CORRENTES[2]]);
  });

  it('esquece a marcação ao paginar', async () => {
    await abrir();
    await clicar('input[aria-label="Selecionar conta 20567"]');
    await clicar('button[aria-label="Próxima página"]');

    expect(botao('OK').disabled).toBe(true);
  });

  it('sai sem escolher pelo Fechar', async () => {
    await abrir();
    await clicar('input[aria-label="Selecionar conta 20567"]');
    await clicarNoBotao('Fechar');

    expect(escolhidas).toEqual([]);
    expect(fechamentos).toBe(1);
  });

  it('recomeça a cada abertura', async () => {
    await abrir();
    await digitar('select', 'titular');
    await digitar('input[type="text"]', 'souza');
    await clicarNoBotao('Listar');

    fixture.componentRef.setInput('aberto', false);
    await fixture.whenStable();
    await abrir();

    expect(contas.chamadas.at(-1)).toEqual({ campo: 'numero', valor: '', pagina: 1 });
    expect(linhas()).toHaveLength(TAMANHO_PAGINA_CONTAS);
  });
});
