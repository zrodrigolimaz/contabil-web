import { Directive, ElementRef, forwardRef, HostListener, inject, input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

function ignorar(): void {
  return undefined;
}

function somenteDigitos(texto: string, maximo: number): string {
  return texto.replace(/\D/g, '').slice(0, maximo);
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

  @HostListener('input')
  protected aoDigitar(): void {
    const campo = this.elemento.nativeElement;
    const { texto, valor } = this.interpretar(campo.value);

    campo.value = texto;
    campo.setSelectionRange?.(texto.length, texto.length);

    this.aoMudar(valor);
  }

  @HostListener('blur')
  protected aoSair(): void {
    this.aoTocar();
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

  protected interpretar(digitado: string): { texto: string; valor: number | null } {
    const digitos = somenteDigitos(digitado, 13);

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

  protected interpretar(digitado: string): { texto: string; valor: number | null } {
    const digitos = somenteDigitos(digitado, this.maximo());

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

  protected interpretar(digitado: string): { texto: string; valor: string } {
    const digitos = somenteDigitos(digitado, this.maximo());

    return { texto: digitos, valor: digitos };
  }
}

export const MASCARAS = [Moeda, Inteiro, Digitos] as const;
