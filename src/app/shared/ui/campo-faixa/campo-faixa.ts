import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { estadoDoControle } from '../estado-controle';

let sequencia = 0;

/**
 * Par "De/Até" de uma faixa de pesquisa: rótulo à esquerda, os dois campos lado a
 * lado e uma única mensagem de erro para o par, que é onde o `faixaValidator` age.
 *
 * O grupo é um `FormGroup` com os controles `de` e `ate`.
 *
 * Tudo vive em uma grade de três colunas e três linhas — rótulos De/Até, campos e
 * mensagem —, o que alinha o rótulo lateral ao centro dos campos sem recuo fixo.
 */
@Component({
  selector: 'app-campo-faixa',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="group"
      [attr.aria-labelledby]="idRotulo"
      [formGroup]="grupo()"
      class="grid items-center gap-x-3"
      [class]="colunas()"
    >
      <label
        [for]="idDe"
        class="col-start-2 row-start-1 mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primary-700"
      >
        De
      </label>
      <label
        [for]="idAte"
        class="col-start-3 row-start-1 mb-1 text-[10px] font-bold uppercase tracking-[0.08em] text-primary-700"
      >
        Até
      </label>

      <span
        [id]="idRotulo"
        class="col-start-1 row-start-2 pr-1 text-[11.5px] font-semibold text-petrol-800"
      >
        {{ rotulo() }}
      </span>

      <!--
        O tipo do input é fixo em cada ramo de propósito: o Angular escolhe o
        NumberValueAccessor pelo seletor input[type=number], e com o tipo vindo de um
        binding o controle receberia texto em vez de número.
      -->
      @if (tipo() === 'data') {
        <input
          [id]="idDe"
          type="date"
          formControlName="de"
          class="campo col-start-2 row-start-2"
          [attr.aria-invalid]="estado.comErro() || null"
          [attr.aria-describedby]="estado.mensagem() ? idErro : null"
        />
        <input
          [id]="idAte"
          type="date"
          formControlName="ate"
          class="campo col-start-3 row-start-2"
          [attr.aria-invalid]="estado.comErro() || null"
          [attr.aria-describedby]="estado.mensagem() ? idErro : null"
        />
      } @else {
        <input
          [id]="idDe"
          type="number"
          [attr.step]="passo()"
          formControlName="de"
          class="campo col-start-2 row-start-2"
          [attr.aria-invalid]="estado.comErro() || null"
          [attr.aria-describedby]="estado.mensagem() ? idErro : null"
        />
        <input
          [id]="idAte"
          type="number"
          [attr.step]="passo()"
          formControlName="ate"
          class="campo col-start-3 row-start-2"
          [attr.aria-invalid]="estado.comErro() || null"
          [attr.aria-describedby]="estado.mensagem() ? idErro : null"
        />
      }

      @if (estado.mensagem(); as texto) {
        <p
          [id]="idErro"
          role="alert"
          class="col-span-2 col-start-2 row-start-3 mt-1.5 text-[11px] font-medium text-danger"
        >
          {{ texto }}
        </p>
      }
    </div>
  `,
})
export class CampoFaixa {
  readonly rotulo = input.required<string>();
  readonly grupo = input.required<FormGroup>();
  readonly tipo = input.required<'inteiro' | 'decimal' | 'data'>();

  protected readonly idRotulo = `rotulo-faixa-${sequencia}`;
  protected readonly idDe = `faixa-de-${sequencia}`;
  protected readonly idAte = `faixa-ate-${sequencia}`;
  protected readonly idErro = `erro-faixa-${sequencia++}`;

  protected readonly estado = estadoDoControle(this.grupo);

  /**
   * Campos de data precisam caber `dd/mm/aaaa` mais o ícone do calendário; ID e valor
   * ficam estreitos, como no sistema legado. A última coluna absorve a sobra para que
   * os três pares comecem na mesma posição.
   */
  protected readonly colunas = computed(() =>
    this.tipo() === 'data'
      ? 'grid-cols-[minmax(76px,max-content)_minmax(0,15rem)_minmax(0,15rem)_1fr]'
      : 'grid-cols-[minmax(76px,max-content)_minmax(0,9.5rem)_minmax(0,9.5rem)_1fr]',
  );

  /** Centavos na faixa de valor; ID de lote é inteiro. */
  protected readonly passo = computed(() => {
    switch (this.tipo()) {
      case 'decimal':
        return '0.01';
      case 'inteiro':
        return '1';
      default:
        return null;
    }
  });
}
