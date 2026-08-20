import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of } from 'rxjs';

import { provideLocalePtBr } from '../../../app.config';
import { CONTAS_CORRENTES } from '../../../core/mocks/contas-correntes.mock';
import { HISTORICO, PA } from '../../../core/mocks/opcoes.mock';
import { ContaCorrente } from '../../../core/models/conta-corrente';
import { Lancamento, NovoLancamento } from '../../../core/models/lancamento';
import { Lote } from '../../../core/models/lote';
import { ContaCorrenteService } from '../../../core/services/conta-corrente.service';
import { LancamentoService } from '../../../core/services/lancamento.service';
import { LoteService } from '../../../core/services/lote.service';
import { aparelharDialogos } from '../../../core/testing/dialogo-jsdom';
import { LancamentosLote, ModoLancamentos, ResultadoLancamentos } from './lancamentos-lote';

class ContaCorrenteFalso {
  buscarPorNumero(numero: string): Observable<ContaCorrente | null> {
    return of(CONTAS_CORRENTES.find((conta) => conta.numero === numero.trim()) ?? null);
  }
}

class LancamentoFalso {
  lancamentos: Lancamento[] = [];
  private proximoId = 100;

  listarPorLote(idLote: number): Observable<readonly Lancamento[]> {
    return of(this.lancamentos.filter((lancamento) => lancamento.idLote === idLote));
  }

  incluir(dados: NovoLancamento): Observable<Lancamento> {
    const incluido = {
      ...dados,
      id: this.proximoId++,
      situacao: 'Pendente',
      situacaoDocumentoCsc: 'Aguardando Processamento CCO',
      idDocumentoCsc: null,
    } as Lancamento;

    this.lancamentos.push(incluido);
    return of(incluido);
  }

  alterar(id: number, dados: NovoLancamento): Observable<Lancamento> {
    const indice = this.lancamentos.findIndex((lancamento) => lancamento.id === id);
    const alterado = { ...this.lancamentos[indice], ...dados } as Lancamento;
    this.lancamentos[indice] = alterado;
    return of(alterado);
  }

  excluir(id: number): Observable<void> {
    this.lancamentos = this.lancamentos.filter((lancamento) => lancamento.id !== id);
    return of(undefined);
  }

  duplicar(id: number): Observable<Lancamento> {
    const original = this.lancamentos.find((lancamento) => lancamento.id === id) as Lancamento;
    return this.incluir({ ...original, anexos: [] });
  }
}

class LoteFalso {
  readonly criados: Lote[] = [];
  readonly totais: { id: number; valor: number; quantidade: number }[] = [];
  private proximoId = 2001;

  criar(): Observable<Lote> {
    const criado = loteCom(this.proximoId++);
    this.criados.push(criado);
    return of(criado);
  }

  atualizarTotais(id: number, valor: number, quantidade: number): Observable<Lote> {
    this.totais.push({ id, valor, quantidade });
    return of({ ...loteCom(id), valor, quantidadeLancamentos: quantidade });
  }
}

function loteCom(id: number): Lote {
  return {
    id,
    instituicaoResponsavel: '0001 - Banco Cooperativo',
    instituicao: '0101 - Cooperativa Alfa',
    dataEntrada: new Date(2026, 7, 19),
    valor: 0,
    quantidadeLancamentos: 0,
    usuarioRegistro: 'ana.costa',
    usuarioAprovacao: null,
    situacao: 'Aberto',
    dataHoraSituacao: new Date(2026, 7, 19),
    justificativa: null,
  };
}

function lancamentoCom(id: number, idLote: number, parcial: Partial<Lancamento> = {}): Lancamento {
  return {
    id,
    idLote,
    conta: '44444',
    titular: 'Ana Paula Costa',
    valor: 1000,
    historico: HISTORICO.manual,
    estorno: false,
    documento: '2026080001',
    descricao: '',
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

describe('LancamentosLote', () => {
  let fixture: ComponentFixture<LancamentosLote>;
  let lancamentos: LancamentoFalso;
  let lotes: LoteFalso;
  let fechamentos: ResultadoLancamentos[];

  beforeEach(async () => {
    lancamentos = new LancamentoFalso();
    lotes = new LoteFalso();

    TestBed.configureTestingModule({
      providers: [
        { provide: LancamentoService, useValue: lancamentos },
        { provide: LoteService, useValue: lotes },
        { provide: ContaCorrenteService, useValue: new ContaCorrenteFalso() },
        provideLocalePtBr(),
      ],
    });

    fixture = TestBed.createComponent(LancamentosLote);
    fechamentos = [];
    fixture.componentInstance.fechar.subscribe((resultado) => fechamentos.push(resultado));
    fixture.componentRef.setInput('modo', null);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  });

  async function abrir(modo: ModoLancamentos | null, lote: Lote | null): Promise<void> {
    fixture.componentRef.setInput('lote', lote);
    fixture.componentRef.setInput('modo', modo);
    await fixture.whenStable();
    aparelharDialogos(fixture.nativeElement);
  }

  function campo(id: string): HTMLInputElement | HTMLSelectElement {
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

  async function preencher(documento = '2026080001'): Promise<void> {
    await digitar('lancamento-conta', '44444');
    await digitar('lancamento-valor', '1500.25');
    await digitar('lancamento-historico', HISTORICO.manual);
    await digitar('lancamento-documento', documento);
    await digitar('lancamento-pa', PA.cooperativa);
    await digitar('lancamento-compl-historico', 'Ajuste da competência 08/2026.');
  }

  async function preencherEIncluir(documento = '2026080001'): Promise<void> {
    await preencher(documento);

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
  }

  async function clicarNoRodape(rotulo: string): Promise<void> {
    const botao = [...fixture.nativeElement.querySelectorAll('footer button')].find(
      (elemento: HTMLButtonElement) => elemento.textContent?.trim() === rotulo,
    ) as HTMLButtonElement;

    botao.click();
    await fixture.whenStable();
  }

  async function clicarNaGrade(rotulo: string): Promise<void> {
    const botao = [...fixture.nativeElement.querySelectorAll('section button')].find(
      (elemento: HTMLButtonElement) => elemento.textContent?.trim() === rotulo,
    ) as HTMLButtonElement;

    botao.click();
    await fixture.whenStable();
  }

  async function marcar(id: number): Promise<void> {
    fixture.nativeElement.querySelector(`input[aria-label="Selecionar lançamento ${id}"]`).click();
    await fixture.whenStable();
  }

  function texto(): string {
    return fixture.nativeElement.textContent;
  }

  function errosDeCampo(): string[] {
    return [...fixture.nativeElement.querySelectorAll('app-campo-form [role="alert"]')].map(
      (alerta: HTMLElement) => alerta.textContent?.trim() ?? '',
    );
  }

  it('fica fechado enquanto ninguém o abre', () => {
    expect(fixture.nativeElement.querySelector('dialog').open).toBe(false);
  });

  it('lista os lançamentos do lote ao abrir para alteração', async () => {
    lancamentos.lancamentos = [lancamentoCom(1, 1004), lancamentoCom(2, 1004)];

    await abrir('edicao', loteCom(1004));

    expect(texto()).toContain('Lançamentos do lote 1004');
    expect(texto()).toContain('2 lançamentos no lote');
  });

  it('em lote novo, cria o lote só quando o primeiro lançamento entra', async () => {
    await abrir('novo', null);
    expect(lotes.criados).toEqual([]);

    await preencherEIncluir();

    expect(lotes.criados).toHaveLength(1);
    expect(lancamentos.lancamentos).toHaveLength(1);
    expect(lancamentos.lancamentos[0].idLote).toBe(lotes.criados[0].id);
  });

  it('não deixa lote vazio quando o modal fecha sem incluir nada', async () => {
    await abrir('novo', null);

    fixture.componentInstance.fechar.emit({ houveMutacao: false });

    expect(lotes.criados).toEqual([]);
  });

  it('inclui o lançamento e o mostra na grade', async () => {
    await abrir('edicao', loteCom(1004));

    await preencherEIncluir();

    expect(texto()).toContain('1.500,25');
    expect(texto()).toContain('1 lançamento no lote');
  });

  it('limpa o formulário pelo rodapé', async () => {
    await abrir('edicao', loteCom(1004));

    await preencher();
    await clicarNoRodape('Limpar');

    expect((campo('lancamento-documento') as HTMLInputElement).value).toBe('');
  });

  it('mantém o formulário preenchido quando o usuário pede para manter os dados', async () => {
    await abrir('edicao', loteCom(1004));

    fixture.nativeElement.querySelector('footer input[type="checkbox"]').click();
    await preencherEIncluir();

    expect(lancamentos.lancamentos).toHaveLength(1);
    expect((campo('lancamento-documento') as HTMLInputElement).value).toBe('2026080001');
  });

  it('devolve ao formulário os anexos do lançamento em alteração', async () => {
    lancamentos.lancamentos = [
      lancamentoCom(1, 1004, {
        anexos: [
          {
            id: 3,
            nomeReduzido: 'contrato.pdf',
            descricao: 'Contrato assinado',
            dataInclusao: new Date(2026, 7, 19, 10, 30),
            idUsuario: 'ana.costa',
          },
        ],
      }),
    ];
    await abrir('edicao', loteCom(1004));

    await marcar(1);
    await clicarNaGrade('Alterar');

    expect(texto()).toContain('contrato.pdf');
    expect(texto()).toContain('Contrato assinado');
  });

  it('leva ao lote o valor somado e a quantidade de lançamentos', async () => {
    await abrir('edicao', loteCom(1004));

    await preencherEIncluir();

    expect(lotes.totais.at(-1)).toEqual({ id: 1004, valor: 1500.25, quantidade: 1 });
  });

  it('altera o lançamento marcado', async () => {
    lancamentos.lancamentos = [lancamentoCom(1, 1004, { documento: 'ANTIGO' })];
    await abrir('edicao', loteCom(1004));

    await marcar(1);
    await clicarNaGrade('Alterar');
    await digitar('lancamento-documento', 'NOVO');

    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();

    expect(lancamentos.lancamentos).toHaveLength(1);
    expect(lancamentos.lancamentos[0].documento).toBe('NOVO');
  });

  it('exclui o lançamento marcado', async () => {
    lancamentos.lancamentos = [lancamentoCom(1, 1004), lancamentoCom(2, 1004)];
    await abrir('edicao', loteCom(1004));

    await marcar(1);
    await clicarNaGrade('Excluir');

    expect(lancamentos.lancamentos.map((lancamento) => lancamento.id)).toEqual([2]);
  });

  it('duplica o lançamento marcado', async () => {
    lancamentos.lancamentos = [lancamentoCom(1, 1004, { documento: 'ORIGINAL' })];
    await abrir('edicao', loteCom(1004));

    await marcar(1);
    await clicarNaGrade('Duplicar');

    expect(lancamentos.lancamentos).toHaveLength(2);
    expect(lancamentos.lancamentos[1].documento).toBe('ORIGINAL');
  });

  it('pede a marcação de uma linha antes das ações da grade', async () => {
    lancamentos.lancamentos = [lancamentoCom(1, 1004)];
    await abrir('edicao', loteCom(1004));

    expect(texto()).toContain('Marque um lançamento para alterar, excluir ou duplicar.');
  });

  it('em leitura não oferece nenhuma ação de mutação', async () => {
    lancamentos.lancamentos = [lancamentoCom(1, 1004)];
    await abrir('leitura', loteCom(1004));

    expect(texto()).toContain('(leitura)');
    expect(texto()).toContain('Lote aberto apenas para leitura.');
    expect(fixture.nativeElement.querySelector('button[type="submit"]')).toBeNull();
    expect(campo('lancamento-conta').disabled).toBe(true);
  });

  it('avisa quem o abriu que houve mutação', async () => {
    await abrir('edicao', loteCom(1004));
    await preencherEIncluir();

    fixture.nativeElement.querySelector('dialog').close();
    await fixture.whenStable();

    expect(fechamentos).toEqual([{ houveMutacao: true }]);
  });

  it('avisa que nada mudou quando só se olhou', async () => {
    lancamentos.lancamentos = [lancamentoCom(1, 1004)];
    await abrir('leitura', loteCom(1004));

    fixture.nativeElement.querySelector('dialog').close();
    await fixture.whenStable();

    expect(fechamentos).toEqual([{ houveMutacao: false }]);
  });

  it('não carrega para o próximo lote o que ficou do anterior', async () => {
    lancamentos.lancamentos = [lancamentoCom(1, 1004)];
    await abrir('edicao', loteCom(1004));
    await marcar(1);

    await abrir('edicao', loteCom(1010));

    expect(texto()).toContain('Nenhum registro encontrado.');
    expect(texto()).toContain('Inclua o primeiro lançamento pelo formulário acima.');
  });

  it('não leva para a próxima abertura o que ficou digitado', async () => {
    await abrir('novo', null);
    await preencher('RASCUNHO');
    await abrir(null, null);

    await abrir('edicao', loteCom(1004));

    expect((campo('lancamento-documento') as HTMLInputElement).value).toBe('');
    expect((campo('lancamento-valor') as HTMLInputElement).value).toBe('');
  });

  it('não leva para a próxima abertura os avisos de campo obrigatório', async () => {
    await abrir('novo', null);
    fixture.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));
    await fixture.whenStable();
    expect(errosDeCampo()).not.toEqual([]);

    await abrir(null, null);
    await abrir('leitura', loteCom(1004));

    expect(errosDeCampo()).toEqual([]);
  });
});
