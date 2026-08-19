import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, Subject } from 'rxjs';

import { CONTAS_CORRENTES } from '../../../../core/mocks/contas-correntes.mock';
import { HISTORICO, PA } from '../../../../core/mocks/opcoes.mock';
import { ContaCorrente } from '../../../../core/models/conta-corrente';
import { Lancamento } from '../../../../core/models/lancamento';
import { ContaCorrenteService } from '../../../../core/services/conta-corrente.service';
import { DadosFormularioLancamento, FormularioLancamento } from './formulario-lancamento';

/* Zoneless: sem fakeAsync, e fake timers travam o whenStable. A latência da busca
   fica sob controle do teste por um Subject. */
class ContaCorrenteFalso {
  readonly buscadas: string[] = [];
  private pendentes: Subject<ContaCorrente | null>[] = [];

  buscarPorNumero(numero: string): Observable<ContaCorrente | null> {
    this.buscadas.push(numero.trim());
    const resposta = new Subject<ContaCorrente | null>();
    this.pendentes.push(resposta);
    return resposta.asObservable();
  }

  responder(): void {
    const abertas = this.pendentes;
    this.pendentes = [];

    for (const [indice, resposta] of abertas.entries()) {
      const numero = this.buscadas[this.buscadas.length - abertas.length + indice];
      resposta.next(CONTAS_CORRENTES.find((conta) => conta.numero === numero) ?? null);
      resposta.complete();
    }
  }
}

function lancamentoCom(parcial: Partial<Lancamento> = {}): Lancamento {
  return {
    id: 10,
    idLote: 1004,
    conta: '44444',
    titular: 'Ana Paula Costa',
    valor: 250.75,
    historico: HISTORICO.manual,
    estorno: false,
    documento: '2026080001',
    descricao: 'Lançamento de teste.',
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

describe('FormularioLancamento', () => {
  let fixture: ComponentFixture<FormularioLancamento>;
  let contas: ContaCorrenteFalso;
  let salvos: DadosFormularioLancamento[];

  beforeEach(async () => {
    contas = new ContaCorrenteFalso();
    TestBed.configureTestingModule({
      providers: [{ provide: ContaCorrenteService, useValue: contas }],
    });

    fixture = TestBed.createComponent(FormularioLancamento);
    salvos = [];
    fixture.componentInstance.salvar.subscribe((dados) => salvos.push(dados));
    await fixture.whenStable();
  });

  function campo(id: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
    return fixture.nativeElement.querySelector(`#${id}`);
  }

  /* `change` é o evento que o select do Angular escuta. */
  async function digitar(id: string, valor: string): Promise<void> {
    const elemento = campo(id);
    elemento.value = valor;
    elemento.dispatchEvent(new Event('input'));
    elemento.dispatchEvent(new Event('change'));
    elemento.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
  }

  async function responderBusca(): Promise<void> {
    contas.responder();
    await fixture.whenStable();
  }

  async function preencherValido(): Promise<void> {
    await digitar('lancamento-conta', '44444');
    await responderBusca();
    await digitar('lancamento-valor', '250.75');
    await digitar('lancamento-historico', HISTORICO.manual);
    await digitar('lancamento-documento', '2026080001');
    await digitar('lancamento-pa', PA.cooperativa);
  }

  async function enviar(): Promise<void> {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  function erroDe(id: string): string | null {
    const alerta = campo(id).closest('app-campo-form')?.querySelector('[role="alert"]');
    return alerta?.textContent?.trim() ?? null;
  }

  function erros(): string[] {
    return [...fixture.nativeElement.querySelectorAll('[role="alert"]')].map(
      (elemento: HTMLElement) => elemento.textContent?.trim() ?? '',
    );
  }

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

  it('não salva vazio e mostra o que falta', async () => {
    await enviar();

    expect(salvos).toEqual([]);
    expect(erros().filter((texto) => texto === 'Campo obrigatório.').length).toBeGreaterThan(0);
  });

  it('recusa valor zerado', async () => {
    await preencherValido();
    await digitar('lancamento-valor', '0');
    await enviar();

    expect(salvos).toEqual([]);
    expect(erros()).toContain('Informe um valor maior que zero.');
  });

  it('recusa valor zerado dizendo o motivo, e não que falta preencher', async () => {
    await digitar('lancamento-valor', '0');

    expect(erroDe('lancamento-valor')).toBe('Informe um valor maior que zero.');
  });

  it('recusa conta que não existe', async () => {
    await preencherValido();
    await digitar('lancamento-conta', '00000');
    await responderBusca();
    await enviar();

    expect(salvos).toEqual([]);
    expect(erros()).toContain('Conta corrente não encontrada.');
  });

  it('mostra o titular da conta encontrada', async () => {
    await digitar('lancamento-conta', '44444');
    await responderBusca();

    expect(fixture.nativeElement.textContent).toContain('Ana Paula Costa');
  });

  it('espera a validação da conta em vez de ignorar o clique', async () => {
    await preencherValido();
    await digitar('lancamento-conta', '11223');

    await enviar();
    expect(salvos).toEqual([]);

    await responderBusca();
    expect(salvos).toHaveLength(1);
    expect(salvos[0].conta).toBe('11223');
  });

  it('salva os dados preenchidos e limpa para o próximo', async () => {
    await preencherValido();
    await enviar();

    expect(salvos).toEqual([
      {
        conta: '44444',
        titular: 'Ana Paula Costa',
        valor: 250.75,
        historico: HISTORICO.manual,
        estorno: false,
        documento: '2026080001',
        descricao: '',
        pa: PA.cooperativa,
      },
    ]);
    expect((campo('lancamento-documento') as HTMLInputElement).value).toBe('');
  });

  it('carrega o lançamento recebido para alteração', async () => {
    fixture.componentRef.setInput('lancamento', lancamentoCom());
    fixture.componentRef.setInput('emEdicao', true);
    await fixture.whenStable();
    await responderBusca();

    expect((campo('lancamento-conta') as HTMLInputElement).value).toBe('44444');
    expect((campo('lancamento-documento') as HTMLInputElement).value).toBe('2026080001');

    await enviar();
    expect(salvos).toHaveLength(1);
    /* Em edição o formulário continua preenchido; quem fecha o ciclo é o container. */
    expect((campo('lancamento-conta') as HTMLInputElement).value).toBe('44444');
  });

  it('desabilita tudo em modo leitura', async () => {
    fixture.componentRef.setInput('lancamento', lancamentoCom());
    fixture.componentRef.setInput('desabilitado', true);
    await fixture.whenStable();

    expect((campo('lancamento-conta') as HTMLInputElement).disabled).toBe(true);
    expect((campo('lancamento-valor') as HTMLInputElement).disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('button[type="submit"]')).toBeNull();
  });
});
