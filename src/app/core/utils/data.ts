/**
 * Converte o valor ISO `yyyy-MM-dd` de um `<input type="date">` em `Date` local.
 *
 * `new Date('2026-01-15')` seria interpretado como UTC e, em UTC-3, representaria
 * 14/01 às 21h — por isso a data é montada componente a componente no fuso local.
 * Devolve `null` para entrada vazia ou fora do formato.
 */
export function dataDeIso(iso: string | null): Date | null {
  if (!iso) {
    return null;
  }

  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!partes) {
    return null;
  }

  const [, ano, mes, dia] = partes;
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

/** Início do dia (00:00:00.000) da data informada, sem alterar o original. */
export function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate());
}

/** Fim do dia (23:59:59.999) da data informada, sem alterar o original. */
export function fimDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 23, 59, 59, 999);
}
