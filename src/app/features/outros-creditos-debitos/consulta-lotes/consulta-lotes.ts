import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-consulta-lotes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p class="text-sm text-petrol-700">Consulta de lotes em construção.</p>`,
})
export class ConsultaLotes {}
