import { Directive, ElementRef, forwardRef, HostListener, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

function ignorar(): void {
  return undefined;
}

function somenteDigitos(texto: string, maximo: number): string {
  return texto.replace(/\D/g, '').slice(0, maximo);
}

function contarDigitos(texto: string): number {
  return texto.replace(/\D/g, '').length;
}

function posicaoComDigitosADireita(texto: string, digitos: number): number {
  let posicao = texto.length;
  let restantes = digitos;

  while (posicao > 0 && restantes > 0) {
    posicao -= 1;
    if (/\d/.test(texto[posicao])) {
      restantes -= 1;
    }
  }

  while (posicao > 0 && !/\d/.test(texto[posicao - 1])) {
    posicao -= 1;
  }

  return posicao;
}

function comoMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

@Directive()
abstract class CampoMascarado<T> implements ControlValueAccessor {
  protected readonly elemento = inject<ElementRef<HTMLInputElement>>(ElementRef);

  protected aoMudar: (valor: T | null) => void = ignorar;
  private aoTocar: () => void = ignorar;

  protected abstract exibir(valor: T): string;
  protected abstract interpretar(digitado: string): { texto: string; valor: T | null };
  protected abstract maximoDigitos(): number;

  writeValue(valor: T | null): void {
    this.elemento.nativeElement.value =
      valor === null || valor === undefined ? '' : this.exibir(valor);
  }

  registerOnChange(fn: (valor: T | null) => void): void {
    this.aoMudar = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.aoTocar = fn;
  }

  setDisabledState(desabilitado: boolean): void {
    this.elemento.nativeElement.disabled = desabilitado;
  }

  @HostListener('beforeinput', ['$event'])
  protected aoPreparar(evento: InputEvent): void {
    const campo = this.elemento.nativeElement;
    const inicio = campo.selectionStart ?? campo.value.length;
    const fim = campo.selectionEnd ?? inicio;

    if (evento.inputType === 'deleteContentBackward' && inicio === fim) {
      this.apagarParaTras(evento, inicio);
    } else if (evento.inputType === 'deleteContentForward' && inicio === fim) {
      this.apagarParaFrente(evento, inicio);
    } else if (evento.inputType.startsWith('insert')) {
      this.barrarSemEspaco(evento, inicio, fim);
    }
  }

  @HostListener('input')
  protected aoDigitar(): void {
    const campo = this.elemento.nativeElement;
    const cursor = campo.selectionStart ?? campo.value.length;

    this.aplicar(campo.value, contarDigitos(campo.value.slice(cursor)));
  }

  @HostListener('blur')
  protected aoSair(): void {
    this.aoTocar();
  }

  private apagarParaTras(evento: InputEvent, cursor: number): void {
    const bruto = this.elemento.nativeElement.value;

    if (cursor === 0 || /\d/.test(bruto[cursor - 1])) {
      return;
    }

    evento.preventDefault();

    let alvo = cursor;
    while (alvo > 0 && !/\d/.test(bruto[alvo - 1])) {
      alvo -= 1;
    }

    const corte = alvo > 0 ? alvo - 1 : alvo;
    this.aplicar(bruto.slice(0, corte) + bruto.slice(cursor), contarDigitos(bruto.slice(cursor)));
  }

  private apagarParaFrente(evento: InputEvent, cursor: number): void {
    const bruto = this.elemento.nativeElement.value;

    if (cursor >= bruto.length || /\d/.test(bruto[cursor])) {
      return;
    }

    evento.preventDefault();

    let alvo = cursor;
    while (alvo < bruto.length && !/\d/.test(bruto[alvo])) {
      alvo += 1;
    }

    const corte = alvo < bruto.length ? alvo + 1 : alvo;
    this.aplicar(bruto.slice(0, cursor) + bruto.slice(corte), contarDigitos(bruto.slice(corte)));
  }

  private barrarSemEspaco(evento: InputEvent, inicio: number, fim: number): void {
    if (contarDigitos(evento.data ?? '') === 0) {
      return;
    }

    const bruto = this.elemento.nativeElement.value;
    const mantidos = contarDigitos(bruto) - contarDigitos(bruto.slice(inicio, fim));

    if (mantidos >= this.maximoDigitos()) {
      evento.preventDefault();
    }
  }

  private aplicar(bruto: string, digitosADireita: number): void {
    const campo = this.elemento.nativeElement;
    const { texto, valor } = this.interpretar(bruto);
    const posicao = posicaoComDigitosADireita(texto, digitosADireita);

    campo.value = texto;
    campo.setSelectionRange?.(posicao, posicao);

    this.aoMudar(valor);
  }
}

const ACESSOR_MOEDA = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => Moeda),
  multi: true,
};

@Directive({
  selector: 'input[appMoeda]',
  providers: [ACESSOR_MOEDA],
  host: { inputmode: 'decimal', autocomplete: 'off' },
})
export class Moeda extends CampoMascarado<number> {
  protected exibir(valor: number): string {
    return comoMoeda(valor);
  }

  protected maximoDigitos(): number {
    return 13;
  }

  protected interpretar(digitado: string): { texto: string; valor: number | null } {
    const digitos = somenteDigitos(digitado, this.maximoDigitos());

    if (digitos === '') {
      return { texto: '', valor: null };
    }

    const valor = Number(digitos) / 100;
    return { texto: comoMoeda(valor), valor };
  }
}

const ACESSOR_INTEIRO = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => Inteiro),
  multi: true,
};

@Directive({
  selector: 'input[appInteiro]',
  providers: [ACESSOR_INTEIRO],
  host: { inputmode: 'numeric', autocomplete: 'off' },
})
export class Inteiro extends CampoMascarado<number> {
  readonly maximo = input(9, { alias: 'appInteiro' });

  protected exibir(valor: number): string {
    return `${valor}`;
  }

  protected maximoDigitos(): number {
    return this.maximo();
  }

  protected interpretar(digitado: string): { texto: string; valor: number | null } {
    const digitos = somenteDigitos(digitado, this.maximoDigitos());

    return { texto: digitos, valor: digitos === '' ? null : Number(digitos) };
  }
}

const ACESSOR_DIGITOS = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => Digitos),
  multi: true,
};

@Directive({
  selector: 'input[appDigitos]',
  providers: [ACESSOR_DIGITOS],
  host: { inputmode: 'numeric', autocomplete: 'off' },
})
export class Digitos extends CampoMascarado<string> {
  readonly maximo = input(20, { alias: 'appDigitos' });

  protected exibir(valor: string): string {
    return valor;
  }

  protected maximoDigitos(): number {
    return this.maximo();
  }

  protected interpretar(digitado: string): { texto: string; valor: string } {
    const digitos = somenteDigitos(digitado, this.maximo());

    return { texto: digitos, valor: digitos };
  }
}

export const MASCARAS = [Moeda, Inteiro, Digitos] as const;
