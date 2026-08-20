import { AbstractControl, ValidationErrors } from '@angular/forms';

export function faixaValidator(grupo: AbstractControl): ValidationErrors | null {
  const de = grupo.get('de')?.value;
  const ate = grupo.get('ate')?.value;

  if (vazio(de) || vazio(ate)) {
    return null;
  }

  return de > ate ? { faixaInvertida: true } : null;
}

function vazio(valor: unknown): boolean {
  return valor === null || valor === undefined || valor === '';
}
