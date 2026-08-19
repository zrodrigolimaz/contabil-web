import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  computed,
  inject,
  input,
} from '@angular/core';
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
    <div class="flex flex-col gap-1.5">
      <label [attr.for]="paraId()" class="rotulo">
        {{ rotulo() }}
        @if (obrigatorio()) {
          <span class="text-danger" aria-hidden="true">*</span>
        }
      </label>

      <ng-content />

      @if (estado.mensagem(); as texto) {
        <p
          [id]="idErro"
          role="alert"
          class="flex items-center gap-1.5 text-[12.5px] font-medium text-danger"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            class="size-[13px] shrink-0"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v4m0 4h.01" />
          </svg>
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

  readonly estado = estadoDoControle(this.controle);
}

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[formControlName], [formControl]',
  host: {
    '[attr.aria-invalid]': 'comErro() || null',
    '[attr.aria-describedby]': 'idDoErro()',
  },
})
export class CampoInvalido {
  private readonly campo = inject(CampoForm, { optional: true });

  readonly comErro = computed(() => this.campo?.estado.comErro() ?? false);
  readonly idDoErro = computed(() => (this.comErro() ? this.campo?.idErro : null));
}

export const CAMPO_FORM = [CampoForm, CampoInvalido];
