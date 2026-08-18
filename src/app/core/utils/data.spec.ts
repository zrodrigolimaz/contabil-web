import { dataDeIso, fimDoDia, inicioDoDia } from './data';

describe('dataDeIso', () => {
  it('monta a data no fuso local, sem o deslocamento de UTC', () => {
    const data = dataDeIso('2026-01-15');

    expect(data?.getFullYear()).toBe(2026);
    expect(data?.getMonth()).toBe(0);
    expect(data?.getDate()).toBe(15);
    expect(data?.getHours()).toBe(0);
  });

  it('devolve null para valor vazio ou fora do formato ISO', () => {
    expect(dataDeIso(null)).toBeNull();
    expect(dataDeIso('')).toBeNull();
    expect(dataDeIso('15/01/2026')).toBeNull();
  });
});

describe('limites do dia', () => {
  const referencia = new Date(2026, 0, 15, 13, 45, 30);

  it('inicioDoDia zera o horário', () => {
    expect(inicioDoDia(referencia)).toEqual(new Date(2026, 0, 15));
  });

  it('fimDoDia vai até o último milissegundo', () => {
    expect(fimDoDia(referencia)).toEqual(new Date(2026, 0, 15, 23, 59, 59, 999));
  });

  it('não altera a data recebida', () => {
    inicioDoDia(referencia);
    fimDoDia(referencia);

    expect(referencia).toEqual(new Date(2026, 0, 15, 13, 45, 30));
  });
});
