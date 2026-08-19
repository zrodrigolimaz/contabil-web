import { computed, Signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl } from '@angular/forms';
import { EMPTY, switchMap } from 'rxjs';

import { mensagemDeErro } from './mensagens-erro';

export interface EstadoControle {
  /** Mensagem a exibir, ou `null` quando o erro ainda não deve aparecer. */
  readonly mensagem: Signal<string | null>;
  /** Verdadeiro quando o erro está visível — alimenta o `aria-invalid`. */
  readonly comErro: Signal<boolean>;
}

/**
 * Acompanha um controle recebido por `input()` e devolve o estado de erro como signals.
 *
 * A aplicação é zoneless, então um componente `OnPush` não seria verificado quando o
 * controle muda de status ou é tocado por outra view. `AbstractControl.events` cobre
 * valor, status e "touched"; convertê-lo em signal faz a mensagem reagir sem zone.js.
 *
 * Deve ser chamado em contexto de injeção — na inicialização de um campo de classe.
 */
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
