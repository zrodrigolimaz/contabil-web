import { TestBed } from '@angular/core/testing';

import { valorDe } from '../testing/resposta-mock';
import { ContaCorrenteService } from './conta-corrente.service';

describe('ContaCorrenteService', () => {
  let service: ContaCorrenteService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = TestBed.inject(ContaCorrenteService);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('devolve a conta com o titular quando o número existe', () => {
    const conta = valorDe(service.buscarPorNumero('44444'));

    expect(conta).toEqual({ numero: '44444', titular: 'Ana Paula Costa', agencia: '0101' });
  });

  it('ignora espaços em volta do número digitado', () => {
    const conta = valorDe(service.buscarPorNumero('  44444 '));

    expect(conta?.titular).toBe('Ana Paula Costa');
  });

  it('devolve null quando a conta não existe', () => {
    expect(valorDe(service.buscarPorNumero('00000'))).toBeNull();
  });

  it('devolve null para busca em branco', () => {
    expect(valorDe(service.buscarPorNumero('   '))).toBeNull();
  });

  it('responde na hora quando o número já foi consultado', () => {
    valorDe(service.buscarPorNumero('44444'));

    let repetida: unknown;
    service.buscarPorNumero('44444').subscribe((conta) => (repetida = conta));

    /* Sem avançar o relógio: a segunda consulta não paga a latência de novo. */
    expect(repetida).toEqual({ numero: '44444', titular: 'Ana Paula Costa', agencia: '0101' });
  });

  it('memoriza também a conta que não existe', () => {
    valorDe(service.buscarPorNumero('00000'));

    let repetida: unknown = 'não respondeu';
    service.buscarPorNumero('00000').subscribe((conta) => (repetida = conta));

    expect(repetida).toBeNull();
  });
});
