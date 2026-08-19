import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { first, map, Observable, of } from 'rxjs';

/** Responde `null` quando a conta não existe. */
export type BuscaDeConta = (numero: string) => Observable<unknown | null>;

/** A busca chega por parâmetro para `shared` não depender de `core`. */
export function contaExistenteValidator(buscar: BuscaDeConta): AsyncValidatorFn {
  return (controle: AbstractControl): Observable<ValidationErrors | null> => {
    const numero = String(controle.value ?? '').trim();
    if (!numero) {
      return of(null);
    }

    return buscar(numero).pipe(
      map((conta) => (conta ? null : { contaInexistente: true })),
      first(),
    );
  };
}
