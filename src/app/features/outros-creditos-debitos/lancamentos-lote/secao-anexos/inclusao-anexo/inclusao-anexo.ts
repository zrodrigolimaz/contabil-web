import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { NovoAnexo } from '../../../../../core/models/anexo';
import { CAMPO_FORM } from '../../../../../shared/ui/campo-form/campo-form';
import { Dialogo } from '../../../../../shared/ui/dialogo/dialogo';

@Component({
  selector: 'app-inclusao-anexo',
  imports: [ReactiveFormsModule, CAMPO_FORM, Dialogo],
  templateUrl: './inclusao-anexo.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InclusaoAnexo {
  private readonly fb = inject(FormBuilder);

  readonly aberto = input.required<boolean>();

  readonly incluir = output<NovoAnexo>();
  readonly fechar = output<void>();

  /* O input de arquivo não aceita valor programático, então quem guarda o nome
     escolhido é o controle — é ele que valida e mostra o erro. */
  protected readonly form = this.fb.nonNullable.group({
    nomeReduzido: ['', Validators.required],
    descricao: ['', Validators.required],
  });

  constructor() {
    effect(() => {
      if (this.aberto()) {
        this.form.reset();
      }
    });
  }

  protected aoEscolher(evento: Event): void {
    const nome = (evento.target as HTMLInputElement).files?.[0]?.name ?? '';
    const { nomeReduzido, descricao } = this.form.controls;

    if (!descricao.value || descricao.value === nomeReduzido.value) {
      descricao.setValue(nome);
    }

    nomeReduzido.setValue(nome);
    nomeReduzido.markAsTouched();
  }

  protected aoEnviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.incluir.emit(this.form.getRawValue());
  }
}
