import { TestBed } from '@angular/core/testing';
import { ConsultaLotes } from './consulta-lotes';

describe('ConsultaLotes', () => {
  it('é criada dentro do cartão de conteúdo', async () => {
    await TestBed.configureTestingModule({ imports: [ConsultaLotes] }).compileComponents();
    const fixture = TestBed.createComponent(ConsultaLotes);
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
