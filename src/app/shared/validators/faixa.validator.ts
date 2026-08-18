import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * Validador cross-field das faixas "De/Até": o início não pode ser maior que o fim.
 *
 * Aplicado ao `FormGroup` da faixa, não aos controles — o erro pertence ao par.
 * Com apenas um dos lados preenchido não há o que comparar e a faixa é válida.
 * Serve às três faixas da tela: números comparam por valor e datas em ISO
 * `yyyy-MM-dd` comparam corretamente como texto, por serem de tamanho fixo e
 * ordenadas do componente mais significativo para o menos.
 */
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
