import { erroMock, LATENCIA_MOCK_MS, respostaMock } from './api-mock';

describe('api-mock', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('respostaMock', () => {
    it('só entrega o valor depois da latência simulada', () => {
      const recebidos: number[] = [];
      respostaMock(42).subscribe((valor) => recebidos.push(valor));

      jest.advanceTimersByTime(LATENCIA_MOCK_MS - 1);
      expect(recebidos).toEqual([]);

      jest.advanceTimersByTime(1);
      expect(recebidos).toEqual([42]);
    });

    it('encerra o fluxo após emitir, como uma chamada HTTP', () => {
      let concluiu = false;
      respostaMock('ok').subscribe({ complete: () => (concluiu = true) });

      jest.advanceTimersByTime(LATENCIA_MOCK_MS);

      expect(concluiu).toBe(true);
    });

    it('não emite nada para quem cancela antes da resposta', () => {
      const recebidos: unknown[] = [];
      const inscricao = respostaMock('tarde demais').subscribe((valor) => recebidos.push(valor));

      inscricao.unsubscribe();
      jest.advanceTimersByTime(LATENCIA_MOCK_MS);

      expect(recebidos).toEqual([]);
    });
  });

  describe('erroMock', () => {
    it('só falha depois da latência, como uma resposta normal', () => {
      let falha: Error | null = null;
      erroMock('Não foi possível consultar os lotes.').subscribe({
        error: (erro: Error) => (falha = erro),
      });

      jest.advanceTimersByTime(LATENCIA_MOCK_MS - 1);
      expect(falha).toBeNull();

      jest.advanceTimersByTime(1);
      expect(falha).toBeInstanceOf(Error);
    });

    it('leva a mensagem recebida no erro', () => {
      let mensagem: string | null = null;
      erroMock('Lote 9999 não encontrado.').subscribe({
        error: (erro: Error) => (mensagem = erro.message),
      });

      jest.advanceTimersByTime(LATENCIA_MOCK_MS);

      expect(mensagem).toBe('Lote 9999 não encontrado.');
    });

    it('não emite valor algum antes de falhar', () => {
      const recebidos: unknown[] = [];
      erroMock('falhou').subscribe({
        next: (valor) => recebidos.push(valor),
        error: () => undefined,
      });

      jest.advanceTimersByTime(LATENCIA_MOCK_MS);

      expect(recebidos).toEqual([]);
    });
  });
});
