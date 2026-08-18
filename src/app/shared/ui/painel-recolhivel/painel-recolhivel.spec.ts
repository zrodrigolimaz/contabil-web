import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PainelRecolhivel } from './painel-recolhivel';

@Component({
  imports: [PainelRecolhivel],
  template: `
    <app-painel-recolhivel titulo="Filtros">
      <button type="button" id="dentro">Pesquisar</button>
    </app-painel-recolhivel>
  `,
})
class Hospedeiro {}

describe('PainelRecolhivel', () => {
  let fixture: ComponentFixture<Hospedeiro>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Hospedeiro);
    await fixture.whenStable();
  });

  function alternador(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('button[aria-controls]');
  }

  function conteudo(): HTMLElement {
    return fixture.nativeElement.querySelector(`#${alternador().getAttribute('aria-controls')}`);
  }

  it('começa expandido e com o conteúdo acessível', () => {
    expect(alternador().getAttribute('aria-expanded')).toBe('true');
    expect(conteudo().hasAttribute('inert')).toBe(false);
    expect(fixture.nativeElement.querySelector('#dentro')).not.toBeNull();
  });

  it('recolhe ao acionar o botão, tirando o conteúdo da navegação por teclado', async () => {
    alternador().click();
    await fixture.whenStable();

    expect(alternador().getAttribute('aria-expanded')).toBe('false');
    expect(conteudo().hasAttribute('inert')).toBe(true);
  });

  it('mantém o conteúdo no DOM quando recolhido', async () => {
    alternador().click();
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('#dentro')).not.toBeNull();
  });

  it('expande de novo ao acionar outra vez', async () => {
    alternador().click();
    await fixture.whenStable();
    alternador().click();
    await fixture.whenStable();

    expect(alternador().getAttribute('aria-expanded')).toBe('true');
    expect(conteudo().hasAttribute('inert')).toBe(false);
  });

  it('descreve a ação no rótulo acessível do botão', async () => {
    expect(alternador().getAttribute('aria-label')).toBe('Recolher Filtros');

    alternador().click();
    await fixture.whenStable();

    expect(alternador().getAttribute('aria-label')).toBe('Expandir Filtros');
  });
});
