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

/** Ações que mudam a situação de um lote pelo serviço. */
type AcaoDeSituacao = 'confirmar' | 'enviar';

/**
 * Frases do aviso de resultado. Ficam escritas por extenso, e não montadas por regra de
 * plural, porque cada ação tem o seu motivo de ignorar um lote.
 */
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
  template: `
    <div class="flex flex-col gap-4">
      <app-filtros-lotes [carregando]="carregando()" (pesquisar)="pesquisar($event)" />

      <div class="cartao">
        @if (erro(); as mensagem) {
          <div class="flex justify-center px-6 py-16">
            <p
              class="flex items-center gap-2 rounded-md border border-danger/25 bg-danger/5 px-4 py-2.5 text-[13px] font-medium text-danger"
              role="alert"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4 shrink-0"
                aria-hidden="true"
              >
                <path d="M12 9v4M12 17h.01" />
                <path
                  d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                />
              </svg>
              {{ mensagem }}
            </p>
          </div>
        } @else if (pesquisou()) {
          <div class="border-b border-petrol-900/[0.1] px-6 py-3">
            <app-barra-acoes
              [selecionados]="lotesSelecionados()"
              [executando]="executando()"
              (acionar)="acionar($event)"
            />
          </div>

          @if (aviso(); as texto) {
            <p
              class="flex items-center gap-2 border-b border-petrol-900/[0.07] bg-primary-50/60 px-6 py-2.5 text-[12.5px] font-medium text-primary-700"
              role="status"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="size-4 shrink-0"
                aria-hidden="true"
              >
                <path d="m4 12 5 5L20 6" />
              </svg>
              {{ texto }}
            </p>
          }

          <app-tabela-lotes
            [lotes]="lotes()"
            [carregando]="carregando()"
            [selecionados]="idsSelecionados()"
            (alternarSelecao)="alternarSelecao($event)"
            (alternarTodos)="alternarTodos($event)"
          />

          <app-paginacao
            [pagina]="pagina()"
            [totalPaginas]="totalPaginas()"
            [total]="total() ?? 0"
            [tamanhoPagina]="tamanhoPagina()"
            (irPara)="irPara($event)"
          />
        } @else if (carregando()) {
          <div class="flex justify-center px-6 py-16">
            <p class="flex items-center gap-2 text-[13px] text-petrol-700/80" role="status">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                class="size-4 animate-spin text-primary-600 motion-reduce:animate-none"
                aria-hidden="true"
              >
                <path d="M12 3a9 9 0 1 0 9 9" />
              </svg>
              Consultando lotes…
            </p>
          </div>
        } @else {
          <div class="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <p class="text-[13px] font-semibold text-petrol-900">Nenhuma pesquisa realizada</p>
            <p class="max-w-sm text-[13px] text-petrol-700/70">
              Ajuste os filtros acima e clique em Pesquisar para listar os lotes.
            </p>
          </div>
        }
      </div>
    </div>

    <app-dialogo-justificativa
      [lote]="justificativaAberta()"
      (fechar)="justificativaAberta.set(null)"
    />
  `,
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

  /** Enquanto uma ação corre, a barra para de aceitar cliques. */
  protected readonly executando = signal(false);
  /** Resultado da última ação, em uma frase. */
  protected readonly aviso = signal<string | null>(null);
  protected readonly justificativaAberta = signal<Lote | null>(null);

  /**
   * Seleção por id, e não por índice: sobrevive à troca de página e é o que as ações
   * usam. Guarda o lote inteiro porque a barra decide o que habilitar pela situação, e
   * um lote marcado em outra página não está mais em `lotes()`.
   */
  private readonly selecionados = signal<ReadonlyMap<number, Lote>>(new Map());

  protected readonly idsSelecionados = computed(() => new Set(this.selecionados().keys()));
  protected readonly lotesSelecionados = computed(() => [...this.selecionados().values()]);

  /** Critérios da última pesquisa, para paginar sem depender do formulário. */
  private filtrosAtuais: FiltrosPesquisaLote | null = null;

  /** A grade só aparece depois da primeira consulta bem-sucedida. */
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
      /* Incluir, Alterar, Visualizar e Excluir ganham destino com o modal de lançamentos. */
      default:
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
        this.aviso.set(descrever(acao, alterados.length, ids.length - alterados.length));
        this.selecionados.set(new Map());
        this.executando.set(false);
        /*
         * Reconsulta em vez de remendar a lista: assim a grade continua obedecendo ao
         * filtro em vigor — um lote que vira Enviado sai de uma consulta por Aberto.
         */
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

/** Junta o que mudou e o que ficou de fora em uma frase só. */
function descrever(acao: AcaoDeSituacao, alterados: number, ignorados: number): string {
  const frases = [RESULTADO[acao].alterados(alterados)];
  if (ignorados > 0) {
    frases.push(RESULTADO[acao].ignorados(ignorados));
  }

  return frases.join(' ');
}
