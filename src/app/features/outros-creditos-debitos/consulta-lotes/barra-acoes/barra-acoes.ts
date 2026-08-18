import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

import { Lote } from '../../../../core/models/lote';

/** Ações que a barra oferece sobre os lotes selecionados. */
export type AcaoLote =
  'confirmar' | 'enviar' | 'justificativa' | 'incluir' | 'alterar' | 'excluir' | 'visualizar';

/** Um botão da barra já resolvido: se está ligado e, se não, por quê. */
interface Botao {
  readonly acao: AcaoLote;
  readonly rotulo: string;
  readonly habilitado: boolean;
  /** Vira `title` quando o botão está desligado. */
  readonly motivo: string | null;
  /** Ação principal da tela, em turquesa sólido. */
  readonly destaque: boolean;
}

const SELECIONE_UM = 'Selecione exatamente um lote';

/**
 * Barra de ações da consulta de lotes.
 *
 * Componente de apresentação: recebe os lotes marcados, resolve o que cada botão pode
 * fazer e apenas anuncia a ação escolhida. Quem executa é o container.
 *
 * A entrada são os lotes inteiros, e não os ids, porque a habilitação de Confirmar e
 * Enviar depende da situação de cada um.
 */
@Component({
  selector: 'app-barra-acoes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap items-center gap-2" role="toolbar" aria-label="Ações sobre os lotes">
      @for (botao of botoes(); track botao.acao) {
        <button
          type="button"
          class="btn text-[11.5px] uppercase tracking-[0.03em]"
          [class]="botao.destaque ? 'btn-primario' : 'btn-contorno'"
          [disabled]="!botao.habilitado || executando()"
          [attr.title]="botao.habilitado ? null : botao.motivo"
          (click)="acionar.emit(botao.acao)"
        >
          {{ botao.rotulo }}
        </button>
      }
    </div>
  `,
})
export class BarraAcoes {
  /** Lotes marcados em toda a consulta, não só os da página exibida. */
  readonly selecionados = input.required<readonly Lote[]>();
  /** Enquanto uma ação corre, a barra inteira para de aceitar cliques. */
  readonly executando = input(false);

  readonly acionar = output<AcaoLote>();

  protected readonly botoes = computed<readonly Botao[]>(() => {
    const selecionados = this.selecionados();
    const unico = selecionados.length === 1 ? selecionados[0] : null;
    const temAberto = selecionados.some((lote) => lote.situacao === 'Aberto');
    /* Confirmar age sobre o que ainda não foi confirmado, venha de Aberto ou de Enviado. */
    const temPendente = selecionados.some((lote) => lote.situacao !== 'Confirmado');

    return [
      {
        acao: 'confirmar',
        rotulo: 'Confirmar',
        habilitado: temPendente,
        motivo: 'Nenhum lote pendente de confirmação na seleção',
        destaque: false,
      },
      {
        acao: 'enviar',
        rotulo: 'Enviar',
        habilitado: temAberto,
        motivo: 'Nenhum lote aberto na seleção',
        destaque: false,
      },
      {
        acao: 'justificativa',
        rotulo: 'Visualizar Justificativa',
        habilitado: unico?.justificativa != null,
        motivo: unico ? 'Este lote não tem justificativa' : SELECIONE_UM,
        destaque: false,
      },
      { acao: 'incluir', rotulo: 'Incluir', habilitado: true, motivo: null, destaque: true },
      {
        acao: 'alterar',
        rotulo: 'Alterar',
        habilitado: unico !== null,
        motivo: SELECIONE_UM,
        destaque: false,
      },
      {
        acao: 'excluir',
        rotulo: 'Excluir',
        habilitado: unico !== null,
        motivo: SELECIONE_UM,
        destaque: false,
      },
      {
        acao: 'visualizar',
        rotulo: 'Visualizar',
        habilitado: unico !== null,
        motivo: SELECIONE_UM,
        destaque: false,
      },
    ];
  });
}
