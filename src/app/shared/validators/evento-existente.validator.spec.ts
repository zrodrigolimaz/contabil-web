import { FormControl, ValidationErrors } from '@angular/forms';
import { of } from 'rxjs';

import { eventoExistenteValidator } from './evento-existente.validator';

describe('eventoExistenteValidator', () => {
  const conhecidos = new Set(['102', '108']);
  const consultados: string[] = [];

  const buscar = (idEvento: string) => {
    consultados.push(idEvento);
    return of(conhecidos.has(idEvento) ? { idEvento, descricao: 'Evento' } : null);
  };

  beforeEach(() => (consultados.length = 0));

  function validar(valor: unknown): ValidationErrors | null {
    let resultado: ValidationErrors | null = null;
    const retorno = eventoExistenteValidator(buscar)(new FormControl(valor));
    if (retorno instanceof Promise) {
      throw new Error('O validador deve devolver um Observable.');
    }

    retorno.subscribe((erros) => (resultado = erros));
    return resultado;
  }

  it('aceita evento que a busca conhece', () => {
    expect(validar('102')).toBeNull();
  });

  it('recusa evento que a busca não encontra', () => {
    expect(validar('999')).toEqual({ eventoInexistente: true });
  });

  it('nem consulta quando o campo está vazio', () => {
    expect(validar('')).toBeNull();
    expect(consultados).toEqual([]);
  });

  it('ignora espaços em volta do ID digitado', () => {
    expect(validar('  108  ')).toBeNull();
    expect(consultados).toEqual(['108']);
  });
});
