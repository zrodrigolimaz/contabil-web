import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, Validators } from '@angular/forms';
import { Observable, of } from 'rxjs';

import { provideLocalePtBr } from '../../../../app.config';
import { EVENTOS_CSC } from '../../../../core/mocks/eventos-csc.mock';
import { PA } from '../../../../core/mocks/opcoes.mock';
import { CampoBuscaEvento, EventoCsc } from '../../../../core/models/evento';
import { ResultadoPaginado } from '../../../../core/models/paginacao';
import { EventoService, TAMANHO_PAGINA_EVENTOS } from '../../../../core/services/evento.service';
import { aparelharDialogos } from '../../../../core/testing/dialogo-jsdom';
import { paginar } from '../../../../core/utils/paginar';
import { GrupoDocumentoCsc, SecaoDocumentoCsc } from './secao-documento-csc';

class EventoFalso {
  pesquisar(
    campo: CampoBuscaEvento,
    valor: string,
    pagina = 1,
  ): Observable<ResultadoPaginado<EventoCsc>> {
    const termo = valor.trim().toLowerCase();
    const encontrados = termo
      ? EVENTOS_CSC.filter((evento) => evento[campo].toLowerCase().includes(termo))
      : EVENTOS_CSC;

    return of(paginar(encontrados, pagina, TAMANHO_PAGINA_EVENTOS));
  }
}

describe('SecaoDocumentoCsc', () => {
  let fixture: ComponentFixture<SecaoDocumentoCsc>;
  let grupo: GrupoDocumentoCsc;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [{ provide: EventoService, useValue: new EventoFalso() }, provideLocalePtBr()],
    });

    grupo = TestBed.inject(FormBuilder).nonNullable.group({
      pa: ['', Validators.required],
      idEvento: [''],
      complementoHistorico: ['', Validators.required],
    });

    fixture = TestBed.createComponent(SecaoDocumentoCsc);
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

  it('cobra PA e Compl. Histórico, e não o ID Evento', async () => {
    grupo.markAllAsTouched();
    await fixture.whenStable();

    expect(erros()).toEqual(['Campo obrigatório.', 'Campo obrigatório.']);
  });

  it('mostra a situação e o ID do documento em campos somente leitura', async () => {
    fixture.componentRef.setInput('situacao', 'Processado');
    fixture.componentRef.setInput('idDocumentoCsc', 'CSC-2025-000141');
    await fixture.whenStable();

    const situacao = campo('csc-situacao') as HTMLInputElement;
    const idDocumento = campo('csc-id-doc') as HTMLInputElement;

    expect(situacao.value).toBe('Processado');
    expect(situacao.readOnly).toBe(true);
    expect(idDocumento.value).toBe('CSC-2025-000141');
    expect(idDocumento.readOnly).toBe(true);
  });

  it('nasce com o documento aguardando o processamento do CCO', () => {
    expect((campo('csc-situacao') as HTMLInputElement).value).toBe('Aguardando Processamento CCO');
  });

  it('preenche o ID do evento escolhido no sub-modal', async () => {
    await clicar('button[aria-label="Pesquisar evento"]');
    await clicar('input[aria-label="Selecionar evento 106"]');
    await clicarNoBotao('OK');

    expect(grupo.controls.idEvento.value).toBe('106');
    expect(grupo.controls.idEvento.touched).toBe(true);
    expect(fixture.nativeElement.querySelectorAll('dialog')[0].open).toBe(false);
  });

  it('sai do sub-modal sem mexer no campo', async () => {
    await clicar('button[aria-label="Pesquisar evento"]');
    await clicar('input[aria-label="Selecionar evento 106"]');
    await clicarNoBotao('Fechar');

    expect(grupo.controls.idEvento.value).toBe('');
  });

  it('exibe a descrição do evento ao lado do campo', async () => {
    fixture.componentRef.setInput('descricaoEvento', 'Centralização Título CSC Crédito');
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Centralização Título CSC Crédito');
  });

  it('desliga a lupa em modo leitura', async () => {
    fixture.componentRef.setInput('desabilitado', true);
    grupo.disable();
    await fixture.whenStable();

    const lupa: HTMLButtonElement = fixture.nativeElement.querySelector(
      'button[aria-label="Pesquisar evento"]',
    );

    expect(lupa.disabled).toBe(true);
    expect((campo('lancamento-pa') as HTMLSelectElement).disabled).toBe(true);
  });

  it('oferece Cooperativa entre os PAs', () => {
    const opcoes = [...campo('lancamento-pa').querySelectorAll('option')].map(
      (opcao: HTMLOptionElement) => opcao.value,
    );

    expect(opcoes).toContain(PA.cooperativa);
  });
});
