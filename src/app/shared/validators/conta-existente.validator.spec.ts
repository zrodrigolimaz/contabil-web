import { FormControl, ValidationErrors } from '@angular/forms';
import { of } from 'rxjs';

import { contaExistenteValidator } from './conta-existente.validator';

describe('contaExistenteValidator', () => {
  const conhecidas = new Set(['44444', '11223']);
  const consultadas: string[] = [];

  const buscar = (numero: string) => {
    consultadas.push(numero);
    return of(conhecidas.has(numero) ? { numero, titular: 'Fulana' } : null);
  };

  beforeEach(() => (consultadas.length = 0));

  function validar(valor: unknown): ValidationErrors | null {
    let resultado: ValidationErrors | null = null;
    const retorno = contaExistenteValidator(buscar)(new FormControl(valor));
    if (retorno instanceof Promise) {
      throw new Error('O validador deve devolver um Observable.');
    }

    retorno.subscribe((erros) => (resultado = erros));
    return resultado;
  }

  it('aceita conta que a busca conhece', () => {
    expect(validar('44444')).toBeNull();
  });

  it('recusa conta que a busca não encontra', () => {
    expect(validar('00000')).toEqual({ contaInexistente: true });
  });

  it('nem consulta quando o campo está vazio', () => {
    expect(validar('')).toBeNull();
    expect(consultadas).toEqual([]);
  });

  it('ignora espaços em volta do número digitado', () => {
    expect(validar('  11223  ')).toBeNull();
    expect(consultadas).toEqual(['11223']);
  });
});
