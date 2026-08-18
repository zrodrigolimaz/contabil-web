import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

import { estadoDoControle } from '../estado-controle';

let sequencia = 0;

/**
 * Rótulo, campo e mensagem de erro em um arranjo único para toda a aplicação.
 *
 * O controle é recebido inteiro e a mensagem sai do mapa central de erros, de modo
 * que nenhuma tela precisa repetir texto de validação. O campo em si é projetado
 * pelo consumidor, que liga o `id` ao `paraId` para o rótulo funcionar.
 */
@Component({
  selector: 'app-campo-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col">
      <label [attr.for]="paraId()" class="mb-1 text-[12px] font-bold text-petrol-900">
        {{ rotulo() }}
        @if (obrigatorio()) {
          <span class="text-danger" aria-hidden="true">*</span>
        }
      </label>

      <ng-content />

      @if (estado.mensagem(); as texto) {
        <p [id]="idErro" role="alert" class="mt-1 text-[11px] font-medium text-danger">
          {{ texto }}
        </p>
      }
    </div>
  `,
})
export class CampoForm {
  readonly rotulo = input.required<string>();
  /** `id` do campo projetado, para ligar o `<label for>`. */
  readonly paraId = input<string>();
  readonly controle = input<AbstractControl | null>(null);
  readonly obrigatorio = input(false);

  /** Id da mensagem, para o consumidor apontar `aria-describedby` quando quiser. */
  readonly idErro = `erro-campo-${sequencia++}`;

  protected readonly estado = estadoDoControle(this.controle);
}
