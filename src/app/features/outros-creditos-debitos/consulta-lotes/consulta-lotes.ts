import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { FiltrosPesquisaLote } from '../../../core/models/filtros';
import { Lote } from '../../../core/models/lote';
import { TAMANHO_PAGINA_PADRAO } from '../../../core/models/paginacao';
import { LoteService } from '../../../core/services/lote.service';
import { Paginacao } from '../../../shared/ui/paginacao/paginacao';
import { AcaoLote, BarraAcoes } from './barra-acoes/barra-acoes';
import { DialogoJustificativa } from './dialogo-justificativa/dialogo-justificativa';
import { FiltrosLotes } from './filtros-lotes/filtros-lotes';
import { TabelaLotes } from './tabela-lotes/tabela-lotes';

type AcaoDeSituacao = 'confirmar' | 'enviar';

interface Aviso {
  readonly texto: string;
  readonly tom: 'sucesso' | 'informacao';
}

/**
 * Respostas das ações que dependem da tela de lançamentos: botão que aceita o clique e
 * não dá sinal nenhum é indistinguível de aplicação quebrada.
 */
const AINDA_SEM_TELA: Record<'incluir' | 'alterar' | 'excluir' | 'visualizar', string> = {
  incluir: 'Incluir abre a tela de lançamentos de um lote novo, ainda não implementada.',
  alterar: 'Alterar abre os lançamentos do lote para edição, tela ainda não implementada.',
  excluir: 'A exclusão de lote chega junto com a tela de lançamentos.',
  visualizar: 'Visualizar abre os lançamentos do lote em leitura, tela ainda não implementada.',
};

/** Escritas por extenso porque cada ação tem seu próprio motivo de ignorar um lote. */
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
  imports: [FiltrosLotes, BarraAcoes, TabelaLotes, Paginacao, DialogoJustificativa],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './consulta-lotes.html',
})
export class ConsultaLotes {
  private readonly loteService = inject(LoteService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly lotes = signal<readonly Lote[]>([]);
  protected readonly pagina = signal(1);
  protected readonly totalPaginas = signal(1);
  protected readonly total = signal<number | null>(null);
  protected readonly tamanhoPagina = signal(TAMANHO_PAGINA_PADRAO);

  protected readonly executando = signal(false);
  protected readonly aviso = signal<Aviso | null>(null);
  protected readonly justificativaAberta = signal<Lote | null>(null);

  /**
   * Seleção por id, e não por índice: sobrevive à troca de página. Guarda o lote
   * inteiro porque a barra habilita pela situação, e um lote marcado em outra página
   * não está mais em `lotes()`.
   */
  private readonly selecionados = signal<ReadonlyMap<number, Lote>>(new Map());

  protected readonly idsSelecionados = computed(() => new Set(this.selecionados().keys()));
  protected readonly lotesSelecionados = computed(() => [...this.selecionados().values()]);

  /** Critérios da última pesquisa, para paginar sem depender do formulário. */
  private filtrosAtuais: FiltrosPesquisaLote | null = null;

  protected readonly pesquisou = computed(() => this.total() !== null);

  protected pesquisar(filtros: FiltrosPesquisaLote): void {
    this.filtrosAtuais = filtros;
    this.aviso.set(null);
    this.consultar(1);
  }

  protected irPara(pagina: number): void {
    this.consultar(pagina);
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

  /** Age só sobre a página exibida; o que foi marcado nas outras continua marcado. */
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

  /** Alcança também o que foi marcado em outras páginas, que a grade não mostra. */
  protected limparSelecao(): void {
    this.selecionados.set(new Map());
  }

  protected acionar(acao: AcaoLote): void {
    this.aviso.set(null);

    switch (acao) {
      case 'confirmar':
      case 'enviar':
        this.mudarSituacao(acao);
        break;
      case 'justificativa':
        this.justificativaAberta.set(this.lotesSelecionados()[0] ?? null);
        break;
      default:
        this.aviso.set({ texto: AINDA_SEM_TELA[acao], tom: 'informacao' });
        break;
    }
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
        /* Reconsulta em vez de remendar a lista: um lote que vira Enviado precisa sair
           de uma consulta filtrada por Aberto. */
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

    this.loteService
      .pesquisar(filtros, pagina)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (resultado) => {
          this.lotes.set(resultado.itens);
          this.total.set(resultado.total);
          /* A página vem da resposta: o serviço limita o pedido ao intervalo válido. */
          this.pagina.set(resultado.pagina);
          this.totalPaginas.set(resultado.totalPaginas);
          this.tamanhoPagina.set(resultado.tamanhoPagina);
          this.carregando.set(false);
        },
        error: (falha: Error) => {
          this.erro.set(falha.message);
          this.lotes.set([]);
          this.total.set(null);
          this.carregando.set(false);
        },
      });
  }
}

function descrever(acao: AcaoDeSituacao, alterados: number, ignorados: number): string {
  const frases = [RESULTADO[acao].alterados(alterados)];
  if (ignorados > 0) {
    frases.push(RESULTADO[acao].ignorados(ignorados));
  }

  return frases.join(' ');
}
