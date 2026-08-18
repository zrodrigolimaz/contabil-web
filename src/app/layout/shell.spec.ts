import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Shell } from './shell';

describe('Shell', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Shell],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  async function renderizar(): Promise<HTMLElement> {
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  }

  it('exibe o título da tela no header', async () => {
    const el = await renderizar();
    const titulo = el.querySelector('header h1');
    expect(titulo?.textContent).toContain('Outros Créditos/Débitos');
  });

  it('exibe o breadcrumb com "Início" como link e a tela atual marcada', async () => {
    const el = await renderizar();
    const breadcrumb = el.querySelector('nav[aria-label="Trilha de navegação"]');
    const link = breadcrumb?.querySelector('a');
    const atual = breadcrumb?.querySelector('[aria-current="page"]');
    expect(link?.textContent).toContain('Início');
    expect(atual?.textContent).toContain('Outros Créditos/Débitos');
  });

  it('exibe o item "Contábil" na navegação lateral', async () => {
    const el = await renderizar();
    const sidebar = el.querySelector('nav[aria-label="Menu principal"]');
    expect(sidebar?.textContent).toContain('Contábil');
  });
});
