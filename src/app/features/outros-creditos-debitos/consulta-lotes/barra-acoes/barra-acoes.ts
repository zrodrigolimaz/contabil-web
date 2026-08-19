import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Lote } from '../../../../core/models/lote';

export type AcaoLote =
  'confirmar' | 'enviar' | 'incluir' | 'alterar' | 'excluir' | 'visualizar' | 'justificativa';

interface Botao {
  readonly acao: AcaoLote;
  readonly rotulo: string;
  readonly habilitado: boolean;
  /** Vira `title`, que o navegador só mostra em botão habilitado. */
  readonly descricao: string;
  /** `d` do ícone, num viewBox de 24; dado, para o template não repetir sete SVGs. */
  readonly caminho: string;
  readonly destaque?: boolean;
  readonly perigo?: boolean;
}

const ICONE = {
  confirmar: 'm4 12 5 5L20 6',
  enviar: 'm22 2-7 20-4-9-9-4Z M22 2 11 13',
  incluir: 'M12 5v14M5 12h14',
  alterar: 'M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z',
  excluir: 'M3 6h18M8 6V4h8v2M5 6l1 15h12l1-15M10 10v7M14 10v7',
  visualizar:
    'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  justificativa:
    'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z M14 2v6h6 M9 13h6 M9 17h4',
} as const satisfies Record<AcaoLote, string>;

/**
 * Barra de ações da consulta de lotes.
 *
 * A entrada são os lotes inteiros, e não os ids, porque a habilitação de Confirmar e
 * Enviar depende da situação de cada um.
 *
 * Os botões saem agrupados por família, e não na fila única do sistema legado; os
 * rótulos, esses, são os do enunciado.
 */
@Component({
  selector: 'app-barra-acoes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col gap-2">
      <!--
        Cada família ganha sua própria ilha: mesmo com quase tudo apagado, o olho lê
        três grupos de ação, e não sete botões quebrados.
      -->
      <div
        class="flex flex-wrap items-center gap-2"
        role="toolbar"
        aria-label="Ações sobre os lotes"
      >
        @for (grupo of grupos(); track $index) {
          <div
            class="inline-flex gap-0.5 rounded-[9px] border border-petrol-900/[0.08] bg-surface p-[3px]"
          >
            @for (botao of grupo; track botao.acao) {
              <button
                type="button"
                class="btn gap-1.5 rounded-[7px] px-2.5 py-1.5 text-[11.5px] disabled:opacity-35"
                [class]="
                  botao.destaque ? 'btn-primario' : botao.perigo ? 'btn-perigo' : 'btn-fantasma'
                "
                [disabled]="!botao.habilitado || executando()"
                [title]="botao.descricao"
                (click)="acionar.emit(botao.acao)"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="size-[13px] shrink-0"
                  aria-hidden="true"
                >
                  <path [attr.d]="botao.caminho" />
                </svg>
                {{ botao.rotulo }}
              </button>
            }
          </div>
        }
      </div>

      <!--
        A faixa fica sempre presente para a tabela não pular quando a primeira linha é
        marcada. A dica é visível, e não um title: o navegador não dispara evento de
        mouse em botão desabilitado, então o tooltip nunca chegaria a quem olha o botão
        apagado.
      -->
      <div class="flex min-h-6 flex-wrap items-center gap-2">
        @if (quantidade(); as total) {
          <span class="chip gap-1 pr-1">
            {{ total }} {{ total === 1 ? 'selecionado' : 'selecionados' }}

            <!-- A seleção atravessa páginas: sem isto não há como desfazer de uma vez. -->
            <button
              type="button"
              class="rounded-full p-0.5 text-primary-700/60 transition-colors
                hover:bg-primary-600/15 hover:text-primary-700 focus-visible:outline-2
                focus-visible:outline-offset-1 focus-visible:outline-primary-500
                disabled:cursor-not-allowed disabled:opacity-40"
              [attr.aria-label]="rotuloLimpar()"
              [disabled]="executando()"
              (click)="limparSelecao.emit()"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                class="size-[11px]"
                aria-hidden="true"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </span>
        }

        @if (dica(); as texto) {
          <p class="text-[11px] text-petrol-700/70">{{ texto }}</p>
        }
      </div>
    </div>
  `,
})
export class BarraAcoes {
  /** Lotes marcados em toda a consulta, não só os da página exibida. */
  readonly selecionados = input.required<readonly Lote[]>();
  readonly executando = input(false);

  readonly acionar = output<AcaoLote>();
  readonly limparSelecao = output<void>();

  protected readonly quantidade = computed(() => this.selecionados().length);

  private readonly unico = computed(() => {
    const selecionados = this.selecionados();
    return selecionados.length === 1 ? selecionados[0] : null;
  });

  private readonly temAberto = computed(() =>
    this.selecionados().some((lote) => lote.situacao === 'Aberto'),
  );

  /** Confirmar aceita tanto Aberto quanto Enviado — daí a negação, e não uma lista. */
  private readonly temPendente = computed(() =>
    this.selecionados().some((lote) => lote.situacao !== 'Confirmado'),
  );

  protected readonly grupos = computed<readonly (readonly Botao[])[]>(() => {
    const unico = this.unico();

    return [
      [
        {
          acao: 'confirmar',
          rotulo: 'Confirmar',
          habilitado: this.temPendente(),
          descricao: 'Confirma os lotes selecionados e registra o usuário de aprovação',
          caminho: ICONE.confirmar,
        },
        {
          acao: 'enviar',
          rotulo: 'Enviar',
          habilitado: this.temAberto(),
          descricao: 'Envia os lotes selecionados que ainda estão abertos',
          caminho: ICONE.enviar,
        },
      ],
      [
        {
          acao: 'incluir',
          rotulo: 'Incluir',
          habilitado: true,
          descricao: 'Abre a tela de lançamentos para criar um lote',
          caminho: ICONE.incluir,
          destaque: true,
        },
        {
          acao: 'alterar',
          rotulo: 'Alterar',
          habilitado: unico !== null,
          descricao: 'Abre os lançamentos do lote selecionado para edição',
          caminho: ICONE.alterar,
        },
        {
          acao: 'excluir',
          rotulo: 'Excluir',
          habilitado: unico !== null,
          descricao: 'Exclui o lote selecionado',
          caminho: ICONE.excluir,
          perigo: true,
        },
      ],
      [
        {
          acao: 'visualizar',
          rotulo: 'Visualizar',
          habilitado: unico !== null,
          descricao: 'Abre os lançamentos do lote selecionado somente para leitura',
          caminho: ICONE.visualizar,
        },
        {
          acao: 'justificativa',
          rotulo: 'Visualizar Justificativa',
          habilitado: unico?.justificativa != null,
          descricao: 'Mostra a justificativa registrada no lote',
          caminho: ICONE.justificativa,
        },
      ],
    ];
  });

  protected readonly rotuloLimpar = computed(() => {
    const quantidade = this.quantidade();
    return quantidade === 1 ? 'Limpar seleção de 1 lote' : `Limpar seleção de ${quantidade} lotes`;
  });

  protected readonly dica = computed(() => {
    const quantidade = this.quantidade();

    if (quantidade === 0) {
      return 'Selecione um lote para agir sobre ele.';
    }
    if (quantidade > 1) {
      return 'Alterar, excluir e visualizar exigem exatamente um lote selecionado.';
    }
    if (!this.temPendente()) {
      return 'Este lote já está confirmado: não há o que confirmar nem enviar.';
    }
    if (!this.temAberto()) {
      return 'Este lote já foi enviado: só a confirmação continua disponível.';
    }

    return null;
  });
}
