import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  InjectionToken,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, map, Observable, of, Subject, switchMap } from 'rxjs';

import { FILTROS_VAZIOS, FiltrosPesquisaLote } from '../../../core/models/filtros';
import { Lote } from '../../../core/models/lote';
import { Ordenacao, ORDENACAO_PADRAO } from '../../../core/models/ordenacao';
import { ResultadoPaginado, TAMANHO_PAGINA_PADRAO } from '../../../core/models/paginacao';
import { LancamentoService } from '../../../core/services/lancamento.service';
import { LoteService } from '../../../core/services/lote.service';
import {
  DialogoConfirmacao,
  PedidoConfirmacao,
} from '../../../shared/ui/dialogo-confirmacao/dialogo-confirmacao';
import { Paginacao } from '../../../shared/ui/paginacao/paginacao';
import {
  LancamentosLote,
  ModoLancamentos,
  ResultadoLancamentos,
} from '../lancamentos-lote/lancamentos-lote';
import { AcaoLote, BarraAcoes } from './barra-acoes/barra-acoes';
import { DialogoJustificativa } from './dialogo-justificativa/dialogo-justificativa';
import { FiltrosLotes } from './filtros-lotes/filtros-lotes';
import { TabelaLotes } from './tabela-lotes/tabela-lotes';

export const ESPERA_CONSULTA_MS = new InjectionToken<number>('espera da consulta de lotes', {
  factory: () => 250,
});

type AcaoDeSituacao = 'confirmar' | 'enviar';

interface PedidoConsulta {
  readonly filtros: FiltrosPesquisaLote;
  readonly pagina: number;
  readonly ordenacao: Ordenacao;
}

type RespostaConsulta =
  | { readonly ok: true; readonly resultado: ResultadoPaginado<Lote> }
  | { readonly ok: false; readonly mensagem: string };

type AcaoConfirmavel =
  { readonly tipo: AcaoDeSituacao } | { readonly tipo: 'excluir'; readonly lote: Lote };

interface Aviso {
  readonly texto: string;
  readonly tom: 'sucesso' | 'informacao';
}

const PEDIDO: Record<
  AcaoDeSituacao,
  { verbo: string; alcanca: (lote: Lote) => boolean; ignorados: (quantidade: number) => string }
> = {
  confirmar: {
    verbo: 'Confirmar',
    alcanca: (lote) => lote.situacao !== 'Confirmado',
    ignorados: (quantidade) =>
      quantidade === 1
        ? '1 já está confirmado e será ignorado.'
        : `${quantidade} já estão confirmados e serão ignorados.`,
  },
  enviar: {
    verbo: 'Enviar',
    alcanca: (lote) => lote.situacao === 'Aberto',
    ignorados: (quantidade) =>
      quantidade === 1
        ? '1 não está aberto e será ignorado.'
        : `${quantidade} não estão abertos e serão ignorados.`,
  },
};

const RESULTADO: Record<
  AcaoDeSituacao,
  { alterados: (quantidade: number) => string; ignorados: (quantidade: number) => string }
> = {
  confirmar: {
    alterados: (quantidade) =>
      quantidade === 0
        ? 'Nenhum lote confirmado.'
        : quantidade === 1
          ? '1 lote confirmado.'
          : `${quantidade} lotes confirmados.`,
    ignorados: (quantidade) =>
      quantidade === 1
        ? '1 lote já estava confirmado e foi ignorado.'
        : `${quantidade} lotes já estavam confirmados e foram ignorados.`,
  },
  enviar: {
    alterados: (quantidade) =>
      quantidade === 0
        ? 'Nenhum lote enviado.'
        : quantidade === 1
          ? '1 lote enviado.'
          : `${quantidade} lotes enviados.`,
    ignorados: (quantidade) =>
      quantidade === 1
        ? '1 lote não estava aberto e foi ignorado.'
        : `${quantidade} lotes não estavam abertos e foram ignorados.`,
  },
};

@Component({
  selector: 'app-consulta-lotes',
  imports: [
    FiltrosLotes,
    BarraAcoes,
    TabelaLotes,
    Paginacao,
    DialogoJustificativa,
    DialogoConfirmacao,
    LancamentosLote,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consulta-lotes.html',
})
export class ConsultaLotes {
  private readonly loteService = inject(LoteService);
  private readonly lancamentoService = inject(LancamentoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly espera = inject(ESPERA_CONSULTA_MS);

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly lotes = signal<readonly Lote[]>([]);
  protected readonly pagina = signal(1);
  protected readonly totalPaginas = signal(1);
  protected readonly total = signal<number | null>(null);
  protected readonly tamanhoPagina = signal(TAMANHO_PAGINA_PADRAO);
  protected readonly ordenacao = signal<Ordenacao>(ORDENACAO_PADRAO);

  protected readonly executando = signal(false);
  protected readonly aviso = signal<Aviso | null>(null);
  protected readonly justificativaAberta = signal<Lote | null>(null);

  protected readonly modoLancamentos = signal<ModoLancamentos | null>(null);
  protected readonly loteDosLancamentos = signal<Lote | null>(null);

  protected readonly pedido = signal<PedidoConfirmacao | null>(null);
  private acaoPendente: AcaoConfirmavel | null = null;

  private readonly selecionados = signal<ReadonlyMap<number, Lote>>(new Map());

  protected readonly idsSelecionados = computed(() => new Set(this.selecionados().keys()));
  protected readonly lotesSelecionados = computed(() => [...this.selecionados().values()]);

  private filtrosAtuais: FiltrosPesquisaLote | null = null;

  private ultimoPedido: PedidoConsulta | null = null;

  private readonly consultas = new Subject<PedidoConsulta>();

  protected readonly pesquisou = computed(() => this.total() !== null);

  constructor() {
    const pedidos =
      this.espera > 0 ? this.consultas.pipe(debounceTime(this.espera)) : this.consultas;

    pedidos
      .pipe(
        switchMap((pedido) => this.buscar(pedido)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((resposta) => this.aplicar(resposta));

    this.pesquisar(FILTROS_VAZIOS);
  }

  protected pesquisar(filtros: FiltrosPesquisaLote): void {
    this.filtrosAtuais = filtros;
    this.aviso.set(null);
    this.consultar(1);
  }

  protected irPara(pagina: number): void {
    this.consultar(pagina);
  }

  protected ordenarPor(ordenacao: Ordenacao): void {
    this.ordenacao.set(ordenacao);
    this.consultar(1);
  }

  protected tentarNovamente(): void {
    const pedido = this.ultimoPedido;
    if (pedido) {
      this.consultar(pedido.pagina);
    }
  }

  protected alternarSelecao(id: number): void {
    const lote = this.lotes().find((candidato) => candidato.id === id);
    if (!lote) {
      return;
    }

    this.selecionados.update((atuais) => {
      const proximos = new Map(atuais);
      if (!proximos.delete(id)) {
        proximos.set(id, lote);
      }

      return proximos;
    });
  }

  protected alternarTodos(marcar: boolean): void {
    const daPagina = this.lotes();

    this.selecionados.update((atuais) => {
      const proximos = new Map(atuais);
      for (const lote of daPagina) {
        if (marcar) {
          proximos.set(lote.id, lote);
        } else {
          proximos.delete(lote.id);
        }
      }

      return proximos;
    });
  }

  protected limparSelecao(): void {
    this.selecionados.set(new Map());
  }

  protected acionar(acao: AcaoLote): void {
    this.aviso.set(null);

    switch (acao) {
      case 'confirmar':
      case 'enviar':
        this.pedirConfirmacao({ tipo: acao }, pedidoDeSituacao(acao, this.lotesSelecionados()));
        break;
      case 'justificativa':
        this.justificativaAberta.set(this.lotesSelecionados()[0] ?? null);
        break;
      case 'incluir':
        this.abrirLancamentos('novo', null);
        break;
      case 'alterar':
        this.abrirLancamentos('edicao', this.lotesSelecionados()[0] ?? null);
        break;
      case 'visualizar':
        this.abrirLancamentos('leitura', this.lotesSelecionados()[0] ?? null);
        break;
      case 'excluir': {
        const lote = this.lotesSelecionados()[0];
        if (lote) {
          this.pedirConfirmacao({ tipo: 'excluir', lote }, pedidoDeExclusao(lote));
        }
        break;
      }
    }
  }

  protected confirmarPedido(): void {
    const acao = this.acaoPendente;
    this.cancelarPedido();

    if (!acao) {
      return;
    }

    if (acao.tipo === 'excluir') {
      this.excluir(acao.lote);
    } else {
      this.mudarSituacao(acao.tipo);
    }
  }

  protected cancelarPedido(): void {
    this.pedido.set(null);
    this.acaoPendente = null;
  }

  private abrirLancamentos(modo: ModoLancamentos, lote: Lote | null): void {
    this.loteDosLancamentos.set(lote);
    this.modoLancamentos.set(modo);
  }

  protected fecharLancamentos(resultado: ResultadoLancamentos): void {
    this.modoLancamentos.set(null);
    this.loteDosLancamentos.set(null);

    if (resultado.houveMutacao) {
      this.selecionados.set(new Map());
      this.consultar(this.pagina());
    }
  }

  private pedirConfirmacao(acao: AcaoConfirmavel, pedido: PedidoConfirmacao): void {
    this.acaoPendente = acao;
    this.pedido.set(pedido);
  }

  private excluir(lote: Lote): void {
    this.executando.set(true);

    this.loteService
      .excluir(lote.id)
      .pipe(
        switchMap(() => this.lancamentoService.excluirPorLote(lote.id)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.aviso.set({ texto: `Lote ${lote.id} excluído.`, tom: 'sucesso' });
          this.selecionados.set(new Map());
          this.executando.set(false);
          this.consultar(this.pagina());
        },
        error: (falha: Error) => {
          this.erro.set(falha.message);
          this.executando.set(false);
        },
      });
  }

  private mudarSituacao(acao: AcaoDeSituacao): void {
    const ids = [...this.selecionados().keys()];
    this.executando.set(true);

    const chamada =
      acao === 'confirmar' ? this.loteService.confirmar(ids) : this.loteService.enviar(ids);

    chamada.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (alterados) => {
        this.aviso.set({
          texto: descrever(acao, alterados.length, ids.length - alterados.length),
          tom: 'sucesso',
        });
        this.selecionados.set(new Map());
        this.executando.set(false);
        this.consultar(this.pagina());
      },
      error: (falha: Error) => {
        this.erro.set(falha.message);
        this.executando.set(false);
      },
    });
  }

  private consultar(pagina: number): void {
    const filtros = this.filtrosAtuais;
    if (!filtros) {
      return;
    }

    this.carregando.set(true);
    this.erro.set(null);

    this.ultimoPedido = { filtros, pagina, ordenacao: this.ordenacao() };
    this.consultas.next(this.ultimoPedido);
  }

  private buscar(pedido: PedidoConsulta): Observable<RespostaConsulta> {
    return this.loteService.pesquisar(pedido.filtros, pedido.pagina, pedido.ordenacao).pipe(
      map((resultado) => ({ ok: true, resultado }) as const),
      catchError((falha: Error) => of({ ok: false, mensagem: falha.message } as const)),
    );
  }

  private aplicar(resposta: RespostaConsulta): void {
    this.carregando.set(false);

    if (!resposta.ok) {
      this.erro.set(resposta.mensagem);
      this.lotes.set([]);
      this.total.set(null);
      return;
    }

    const { resultado } = resposta;
    this.lotes.set(resultado.itens);
    this.total.set(resultado.total);
    this.pagina.set(resultado.pagina);
    this.totalPaginas.set(resultado.totalPaginas);
    this.tamanhoPagina.set(resultado.tamanhoPagina);
  }
}

function pedidoDeExclusao(lote: Lote): PedidoConfirmacao {
  const lancamentos = lote.quantidadeLancamentos;

  return {
    titulo: 'Excluir lote',
    mensagem: `Excluir o lote ${lote.id}?`,
    detalhe:
      lancamentos === 0
        ? undefined
        : lancamentos === 1
          ? 'O lançamento dele sai junto.'
          : `Os ${lancamentos} lançamentos dele saem junto.`,
    rotuloConfirmar: 'Excluir',
    perigo: true,
  };
}

function pedidoDeSituacao(acao: AcaoDeSituacao, selecionados: readonly Lote[]): PedidoConfirmacao {
  const alcancados = selecionados.filter((lote) => PEDIDO[acao].alcanca(lote)).length;
  const total = selecionados.length;
  const ignorados = total - alcancados;

  return {
    titulo: total === 1 ? `${PEDIDO[acao].verbo} lote` : `${PEDIDO[acao].verbo} lotes`,
    mensagem:
      total === 1
        ? `${PEDIDO[acao].verbo} o lote ${selecionados[0].id}?`
        : ignorados === 0
          ? `${PEDIDO[acao].verbo} os ${total} lotes selecionados?`
          : `${PEDIDO[acao].verbo} ${alcancados} dos ${total} lotes selecionados?`,
    detalhe: ignorados === 0 ? undefined : PEDIDO[acao].ignorados(ignorados),
    rotuloConfirmar: PEDIDO[acao].verbo,
  };
}

function descrever(acao: AcaoDeSituacao, alterados: number, ignorados: number): string {
  const frases = [RESULTADO[acao].alterados(alterados)];
  if (ignorados > 0) {
    frases.push(RESULTADO[acao].ignorados(ignorados));
  }

  return frases.join(' ');
}
