import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { provideLocalePtBr } from '../../../../app.config';
import { CONTAS_CORRENTES } from '../../../../core/mocks/contas-correntes.mock';
import { HISTORICO } from '../../../../core/mocks/opcoes.mock';
import { CampoBuscaConta, ContaCorrente } from '../../../../core/models/conta-corrente';
import { ResultadoPaginado } from '../../../../core/models/paginacao';
import {
  ContaCorrenteService,
  TAMANHO_PAGINA_CONTAS,
} from '../../../../core/services/conta-corrente.service';
import { aparelharDialogos } from '../../../../core/testing/dialogo-jsdom';
import { paginar } from '../../../../core/utils/paginar';
import { maiorQueZero } from '../../../../shared/validators/maior-que-zero.validator';
import { GrupoContaCorrente, SecaoContaCorrente } from './secao-conta-corrente';

class ContaCorrenteFalso {
  pesquisar(
    campo: CampoBuscaConta,
    valor: string,
    pagina = 1,
  ): Observable<ResultadoPaginado<ContaCorrente>> {
    const termo = valor.trim().toLowerCase();
    const encontradas = termo
      ? CONTAS_CORRENTES.filter((conta) => conta[campo].toLowerCase().includes(termo))
      : CONTAS_CORRENTES;

    return of(paginar(encontradas, pagina, TAMANHO_PAGINA_CONTAS));
  }
}

describe('SecaoContaCorrente', () => {
  let fixture: ComponentFixture<SecaoContaCorrente>;
  let grupo: GrupoContaCorrente;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: ContaCorrenteService, useValue: new ContaCorrenteFalso() },
        provideLocalePtBr(),
      ],
    });

    const fb = TestBed.inject(FormBuilder);
    grupo = fb.nonNullable.group({
      conta: ['', Validators.required],
      valor: fb.control<number | null>(null, [Validators.required, maiorQueZero]),
      historico: ['', Validators.required],
      estorno: [false],
      documento: ['', Validators.required],
      descricao: [''],
    });

    fixture = TestBed.createComponent(SecaoContaCorrente);
    fixture.componentRef.setInput('grupo', grupo);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  });

  function campo(id: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
    return fixture.nativeElement.querySelector(`#${id}`);
  }

  async function clicar(seletor: string): Promise<void> {
    fixture.nativeElement.querySelector(seletor).click();
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  }

  async function clicarNoBotao(rotulo: string): Promise<void> {
    const botao = [...fixture.nativeElement.querySelectorAll('button')].find(
      (elemento: HTMLButtonElement) => elemento.textContent?.trim() === rotulo,
    ) as HTMLButtonElement;

    botao.click();
    await fixture.whenStable();
  }

  function erros(): string[] {
    return [...fixture.nativeElement.querySelectorAll('[role="alert"]')].map(
      (elemento: HTMLElement) => elemento.textContent?.trim() ?? '',
    );
  }

  it('cobra conta, valor, histórico e documento, e não a descrição', async () => {
    grupo.markAllAsTouched();
    await fixture.whenStable();

    expect(erros()).toEqual([
      'Campo obrigatório.',
      'Campo obrigatório.',
      'Campo obrigatório.',
      'Campo obrigatório.',
    ]);
  });

  it('nasce com a situação Pendente, somente leitura', () => {
    const situacao = campo('lancamento-situacao') as HTMLInputElement;

    expect(situacao.value).toBe('Pendente');
    expect(situacao.readOnly).toBe(true);
  });

  it('oferece Lançamento Manual entre os históricos', () => {
    const opcoes = [...campo('lancamento-historico').querySelectorAll('option')].map(
      (opcao: HTMLOptionElement) => opcao.value,
    );

    expect(opcoes).toContain(HISTORICO.manual);
  });

  it('preenche o número da conta escolhida no sub-modal', async () => {
    await clicar('button[aria-label="Pesquisar conta corrente"]');
    await clicar('input[aria-label="Selecionar conta 20567"]');
    await clicarNoBotao('OK');

    expect(grupo.controls.conta.value).toBe('20567');
    expect(grupo.controls.conta.touched).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('dialog')[0].open).toBe(false);
  });

  it('sai do sub-modal sem mexer no campo', async () => {
    await clicar('button[aria-label="Pesquisar conta corrente"]');
    await clicar('input[aria-label="Selecionar conta 20567"]');
    await clicarNoBotao('Fechar');

    expect(grupo.controls.conta.value).toBe('');
  });

  it('exibe o titular ao lado do campo', async () => {
    fixture.componentRef.setInput('titular', 'Ana Paula Costa');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Ana Paula Costa');
  });

  it('desliga a lupa em modo leitura', async () => {
    fixture.componentRef.setInput('desabilitado', true);
    grupo.disable();
    await fixture.whenStable();

    const lupa: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Pesquisar conta corrente"]',
    );

    expect(lupa.disabled).toBe(true);
    expect((campo('lancamento-conta') as HTMLInputElement).disabled).toBe(true);
  });
});
