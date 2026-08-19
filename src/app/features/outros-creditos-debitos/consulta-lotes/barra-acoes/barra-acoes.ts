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
  readonly destaque?: boolean;
  readonly perigo?: boolean;
}

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
      <div
        class="flex flex-wrap items-center gap-2"
        role="toolbar"
        aria-label="Ações sobre os lotes"
      >
        @for (grupo of grupos(); track $index) {
          @if (!$first) {
            <span class="mx-1 h-5 w-px shrink-0 bg-petrol-900/15" aria-hidden="true"></span>
          }

          @for (botao of grupo; track botao.acao) {
            <button
              type="button"
              class="btn text-[11.5px] uppercase tracking-[0.03em]"
              [class]="
                botao.destaque ? 'btn-primario' : botao.perigo ? 'btn-perigo' : 'btn-contorno'
              "
              [disabled]="!botao.habilitado || executando()"
              [title]="botao.descricao"
              (click)="acionar.emit(botao.acao)"
            >
              {{ botao.rotulo }}
            </button>
          }
        }
      </div>

      <!--
        A dica é visível, e não um title: o navegador não dispara evento de mouse em
        botão desabilitado, então o tooltip nunca chegaria a quem olha o botão apagado.
      -->
      @if (dica(); as texto) {
        <p class="text-[11.5px] text-petrol-700/70">{{ texto }}</p>
      }
    </div>
  `,
})
export class BarraAcoes {
  /** Lotes marcados em toda a consulta, não só os da página exibida. */
  readonly selecionados = input.required<readonly Lote[]>();
  readonly executando = input(false);

  readonly acionar = output<AcaoLote>();

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
        },
        {
          acao: 'enviar',
          rotulo: 'Enviar',
          habilitado: this.temAberto(),
          descricao: 'Envia os lotes selecionados que ainda estão abertos',
        },
      ],
      [
        {
          acao: 'incluir',
          rotulo: 'Incluir',
          habilitado: true,
          descricao: 'Abre a tela de lançamentos para criar um lote',
          destaque: true,
        },
        {
          acao: 'alterar',
          rotulo: 'Alterar',
          habilitado: unico !== null,
          descricao: 'Abre os lançamentos do lote selecionado para edição',
        },
        {
          acao: 'excluir',
          rotulo: 'Excluir',
          habilitado: unico !== null,
          descricao: 'Exclui o lote selecionado',
          perigo: true,
        },
      ],
      [
        {
          acao: 'visualizar',
          rotulo: 'Visualizar',
          habilitado: unico !== null,
          descricao: 'Abre os lançamentos do lote selecionado somente para leitura',
        },
        {
          acao: 'justificativa',
          rotulo: 'Visualizar Justificativa',
          habilitado: unico?.justificativa != null,
          descricao: 'Mostra a justificativa registrada no lote',
        },
      ],
    ];
  });

  protected readonly dica = computed(() => {
    const quantidade = this.selecionados().length;

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
