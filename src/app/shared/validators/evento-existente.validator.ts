import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { first, map, Observable, of } from 'rxjs';

/** Responde `null` quando o evento não existe. */
export type BuscaDeEvento = (idEvento: string) => Observable<unknown | null>;

/** A busca chega por parâmetro para `shared` não depender de `core`. */
export function eventoExistenteValidator(buscar: BuscaDeEvento): AsyncValidatorFn {
  return (controle: AbstractControl): Observable<ValidationErrors | null> => {
    const idEvento = String(controle.value ?? '').trim();
    if (!idEvento) {
      return of(null);
    }

    return buscar(idEvento).pipe(
      map((evento) => (evento ? null : { eventoInexistente: true })),
      first(),
    );
  };
}
