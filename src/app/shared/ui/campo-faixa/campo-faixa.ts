import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { estadoDoControle } from '../estado-controle';

let sequencia = 0;

/**
 * Par "De/Até" de uma faixa de pesquisa: rótulo à esquerda, os dois campos lado a
 * lado e uma única mensagem de erro para o par, que é onde o `faixaValidator` age.
 *
 * O grupo é um `FormGroup` com os controles `de` e `ate`.
 */
@Component({
  selector: 'app-campo-faixa',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="group"
      [attr.aria-labelledby]="idRotulo"
      class="grid grid-cols-[minmax(84px,auto)_1fr] items-start gap-x-4"
    >
      <span [id]="idRotulo" class="pt-[26px] text-[12px] text-petrol-800">{{ rotulo() }}</span>

      <div [formGroup]="grupo()">
        <!--
          O tipo do input é fixo em cada ramo de propósito: o Angular escolhe o
          NumberValueAccessor pelo seletor input[type=number], e com o tipo vindo de um
          binding o controle receberia texto em vez de número.
        -->
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col">
            <label [for]="idDe" class="mb-1 text-[11px] font-bold text-primary-700">De</label>
            @if (tipo() === 'data') {
              <input
                [id]="idDe"
                type="date"
                formControlName="de"
                class="campo"
                [attr.aria-invalid]="estado.comErro() || null"
                [attr.aria-describedby]="estado.mensagem() ? idErro : null"
              />
            } @else {
              <input
                [id]="idDe"
                type="number"
                [attr.step]="passo()"
                formControlName="de"
                class="campo"
                [attr.aria-invalid]="estado.comErro() || null"
                [attr.aria-describedby]="estado.mensagem() ? idErro : null"
              />
            }
          </div>

          <div class="flex flex-col">
            <label [for]="idAte" class="mb-1 text-[11px] font-bold text-primary-700">Até</label>
            @if (tipo() === 'data') {
              <input
                [id]="idAte"
                type="date"
                formControlName="ate"
                class="campo"
                [attr.aria-invalid]="estado.comErro() || null"
                [attr.aria-describedby]="estado.mensagem() ? idErro : null"
              />
            } @else {
              <input
                [id]="idAte"
                type="number"
                [attr.step]="passo()"
                formControlName="ate"
                class="campo"
                [attr.aria-invalid]="estado.comErro() || null"
                [attr.aria-describedby]="estado.mensagem() ? idErro : null"
              />
            }
          </div>
        </div>

        @if (estado.mensagem(); as texto) {
          <p [id]="idErro" role="alert" class="mt-1 text-[11px] font-medium text-danger">
            {{ texto }}
          </p>
        }
      </div>
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
