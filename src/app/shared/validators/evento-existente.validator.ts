import { AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { first, map, Observable, of } from 'rxjs';

export type BuscaDeEvento = (idEvento: string) => Observable<unknown | null>;

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
