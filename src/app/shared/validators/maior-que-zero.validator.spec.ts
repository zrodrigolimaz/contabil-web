import { FormControl } from '@angular/forms';

import { maiorQueZero } from './maior-que-zero.validator';

describe('maiorQueZero', () => {
  function validar(valor: unknown) {
    return maiorQueZero(new FormControl(valor));
  }

  it('deixa o campo vazio para o required reclamar', () => {
    expect(validar(null)).toBeNull();
    expect(validar('')).toBeNull();
  });

  it('recusa zero e negativos', () => {
    expect(validar(0)).toEqual({ maiorQueZero: true });
    expect(validar(-15.5)).toEqual({ maiorQueZero: true });
  });

  it('aceita qualquer valor positivo, inclusive centavos', () => {
    expect(validar(0.01)).toBeNull();
    expect(validar(2500.55)).toBeNull();
  });
});
