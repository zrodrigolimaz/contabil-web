import { TestBed } from '@angular/core/testing';

import { CONTAS_CORRENTES } from '../mocks/contas-correntes.mock';
import { valorDe } from '../testing/resposta-mock';
import { ContaCorrenteService, TAMANHO_PAGINA_CONTAS } from './conta-corrente.service';

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

  it('pesquisa pelo número informado', () => {
    const resultado = valorDe(service.pesquisar('numero', '44444'));

    expect(resultado.itens.map((conta) => conta.numero)).toEqual(['44444']);
  });

  it('pesquisa por trecho do titular, sem diferenciar maiúsculas', () => {
    const resultado = valorDe(service.pesquisar('titular', 'souza'));

    expect(resultado.itens.map((conta) => conta.titular)).toEqual(['Carla Souza Ferreira']);
  });

  it('pesquisa pela agência', () => {
    const resultado = valorDe(service.pesquisar('agencia', '0104'));

    expect(resultado.itens.every((conta) => conta.agencia === '0104')).toBe(true);
    expect(resultado.total).toBe(
      CONTAS_CORRENTES.filter((conta) => conta.agencia === '0104').length,
    );
  });

  it('lista todas as contas quando o valor vem em branco', () => {
    const resultado = valorDe(service.pesquisar('numero', '  '));

    expect(resultado.total).toBe(CONTAS_CORRENTES.length);
    expect(resultado.itens).toHaveLength(TAMANHO_PAGINA_CONTAS);
  });

  it('devolve a página pedida', () => {
    const segunda = valorDe(service.pesquisar('numero', '', 2));

    expect(segunda.pagina).toBe(2);
    expect(segunda.itens[0]).toEqual(CONTAS_CORRENTES[TAMANHO_PAGINA_CONTAS]);
  });
});
