import { AbstractControl, ValidationErrors } from '@angular/forms';

export function maiorQueZero(controle: AbstractControl): ValidationErrors | null {
  const valor = controle.value;

  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  return Number(valor) > 0 ? null : { maiorQueZero: true };
}
