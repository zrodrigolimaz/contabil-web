import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-consulta-lotes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-col items-center gap-3 py-24 text-center">
      <div class="grid size-12 place-items-center rounded-full bg-primary-50 text-primary-600">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="size-6"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </div>
      <h2 class="text-base font-semibold text-petrol-900">Consulta de lotes</h2>
      <p class="max-w-xs text-sm text-petrol-700/70">
        Os filtros de pesquisa e a tabela de resultados de lotes serão exibidos aqui.
      </p>
    </div>
  `,
})
export class ConsultaLotes {}
