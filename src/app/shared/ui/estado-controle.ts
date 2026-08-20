import { computed, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { EMPTY, switchMap } from 'rxjs';

import { mensagemDeErro } from './mensagens-erro';

export interface EstadoControle {
  readonly mensagem: Signal<string | null>;
  readonly comErro: Signal<boolean>;
}

export function estadoDoControle(
  controle: Signal<AbstractControl | null | undefined>,
): EstadoControle {
  const evento = toSignal(
    toObservable(controle).pipe(switchMap((atual) => (atual ? atual.events : EMPTY))),
    { initialValue: null },
  );

  const comErro = computed(() => {
    evento();
    const atual = controle();
    return !!atual && atual.invalid && (atual.touched || atual.dirty);
  });

  /* Lê o evento em vez de derivar de `comErro`: trocar de motivo continuando
     inválido não muda o booleano, e o texto ficaria preso no motivo anterior. */
  const mensagem = computed(() => {
    evento();
    const atual = controle();
    const visivel = !!atual && atual.invalid && (atual.touched || atual.dirty);

    return visivel ? mensagemDeErro(atual.errors) : null;
  });

  return { comErro, mensagem };
}
