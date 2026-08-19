import { FormControl, FormGroup } from '@angular/forms';

import { faixaValidator } from './faixa.validator';

function faixa(de: unknown, ate: unknown): FormGroup {
  return new FormGroup(
    { de: new FormControl(de), ate: new FormControl(ate) },
    { validators: faixaValidator },
  );
}

describe('faixaValidator', () => {
  it('aceita faixa numérica crescente', () => {
    expect(faixa(1005, 1008).errors).toBeNull();
  });

  it('aceita extremos iguais', () => {
    expect(faixa(1005, 1005).errors).toBeNull();
  });

  it('rejeita faixa numérica invertida', () => {
    expect(faixa(1008, 1005).errors).toEqual({ faixaInvertida: true });
  });

  it('aceita faixa com apenas o início preenchido', () => {
    expect(faixa(1005, null).errors).toBeNull();
  });

  it('aceita faixa com apenas o fim preenchido', () => {
    expect(faixa(null, 1005).errors).toBeNull();
  });

  it('aceita faixa vazia', () => {
    expect(faixa(null, null).errors).toBeNull();
    expect(faixa('', '').errors).toBeNull();
  });

  it('não confunde zero com campo vazio', () => {
    expect(faixa(0, 0).errors).toBeNull();
    expect(faixa(10, 0).errors).toEqual({ faixaInvertida: true });
  });

  it('compara datas ISO', () => {
    expect(faixa('2026-01-01', '2026-12-31').errors).toBeNull();
    expect(faixa('2026-12-31', '2026-01-01').errors).toEqual({ faixaInvertida: true });
  });

  it('deixa o formulário inválido quando a faixa está invertida', () => {
    const grupo = faixa(1008, 1005);

    expect(grupo.invalid).toBe(true);
    expect(grupo.controls['de'].valid).toBe(true);
  });
});
