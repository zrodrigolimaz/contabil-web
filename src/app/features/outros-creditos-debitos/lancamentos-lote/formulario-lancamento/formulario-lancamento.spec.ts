import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, Subject } from 'rxjs';

import { provideLocalePtBr } from '../../../../app.config';
import { CONTAS_CORRENTES } from '../../../../core/mocks/contas-correntes.mock';
import { EVENTOS_CSC } from '../../../../core/mocks/eventos-csc.mock';
import { HISTORICO, PA } from '../../../../core/mocks/opcoes.mock';
import { Anexo, NovoAnexo } from '../../../../core/models/anexo';
import { ContaCorrente } from '../../../../core/models/conta-corrente';
import { EventoCsc } from '../../../../core/models/evento';
import { Lancamento } from '../../../../core/models/lancamento';
import { ResultadoPaginado } from '../../../../core/models/paginacao';
import { AnexoService } from '../../../../core/services/anexo.service';
import { ContaCorrenteService } from '../../../../core/services/conta-corrente.service';
import { EventoService, TAMANHO_PAGINA_EVENTOS } from '../../../../core/services/evento.service';
import { aparelharDialogos } from '../../../../core/testing/dialogo-jsdom';
import { paginar } from '../../../../core/utils/paginar';
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

class EventoFalso {
  buscarPorId(idEvento: string): Observable<EventoCsc | null> {
    return of(EVENTOS_CSC.find((evento) => evento.idEvento === idEvento.trim()) ?? null);
  }

  pesquisar(): Observable<ResultadoPaginado<EventoCsc>> {
    return of(paginar(EVENTOS_CSC, 1, TAMANHO_PAGINA_EVENTOS));
  }
}

class AnexoFalso {
  private proximoId = 50;

  enviar(dados: NovoAnexo): Observable<Anexo> {
    return of({
      ...dados,
      id: this.proximoId++,
      dataInclusao: new Date(2026, 7, 19, 10, 30),
      idUsuario: 'ana.costa',
    });
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
    complementoHistorico: 'Ajuste solicitado pela contabilidade.',
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
      providers: [
        { provide: ContaCorrenteService, useValue: contas },
        { provide: EventoService, useValue: new EventoFalso() },
        { provide: AnexoService, useValue: new AnexoFalso() },
        provideLocalePtBr(),
      ],
    });

    fixture = TestBed.createComponent(FormularioLancamento);
    salvos = [];
    fixture.componentInstance.salvar.subscribe((dados) => salvos.push(dados));
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  });

  function campo(id: string): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
    return fixture.nativeElement.querySelector(`#${id}`);
  }

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
    await digitar('lancamento-compl-historico', 'Ajuste da competência 08/2026.');
  }

  async function enviar(): Promise<void> {
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  async function clicar(seletor: string): Promise<void> {
    fixture.nativeElement.querySelector(seletor).click();
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
    await fixture.whenStable();
  }

  async function anexar(nome: string): Promise<void> {
    await clicar('button[title="Anexa um arquivo ao lançamento"]');

    const arquivo = campo('anexo-arquivo') as HTMLInputElement;
    Object.defineProperty(arquivo, 'files', { value: [{ name: nome }], configurable: true });
    arquivo.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    await clicar('app-inclusao-anexo [rodape] .btn-primario');
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
        idEvento: null,
        descricaoEvento: null,
        complementoHistorico: 'Ajuste da competência 08/2026.',
        anexos: [],
      },
    ]);
    expect((campo('lancamento-documento') as HTMLInputElement).value).toBe('');
  });

  it('mantém o que foi digitado quando o usuário pede para manter os dados', async () => {
    fixture.componentRef.setInput('manterDados', true);
    await preencherValido();
    await enviar();

    expect(salvos).toHaveLength(1);
    expect((campo('lancamento-documento') as HTMLInputElement).value).toBe('2026080001');
  });

  it('leva no lançamento o anexo enviado pela seção Anexo', async () => {
    await preencherValido();
    await anexar('contrato.pdf');
    await enviar();

    expect(salvos[0].anexos).toEqual([
      expect.objectContaining({ nomeReduzido: 'contrato.pdf', descricao: 'contrato.pdf' }),
    ]);
  });

  it('limpa os anexos junto com os campos', async () => {
    await preencherValido();
    await anexar('contrato.pdf');
    await enviar();

    await preencherValido();
    await enviar();

    expect(salvos[1].anexos).toEqual([]);
  });

  it('listar no sub-modal de evento não envia o lançamento', async () => {
    await preencherValido();

    await clicar('button[aria-label="Pesquisar evento"]');
    await clicar('app-pesquisa-evento .btn-primario');

    expect(salvos).toEqual([]);
  });

  it('leva o evento digitado e a descrição encontrada', async () => {
    await preencherValido();
    await digitar('lancamento-evento', '106');

    expect(fixture.nativeElement.textContent).toContain('Tarifa de Manutenção de Conta');

    await enviar();

    expect(salvos).toHaveLength(1);
    expect(salvos[0].idEvento).toBe('106');
    expect(salvos[0].descricaoEvento).toBe('Tarifa de Manutenção de Conta');
  });

  it('recusa evento que não existe', async () => {
    await preencherValido();
    await digitar('lancamento-evento', '999');
    await enviar();

    expect(salvos).toEqual([]);
    expect(erros()).toContain('Evento não encontrado.');
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
