import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CalificacionesComision, CalificacionesService, ResultadoEvaluacion, ResultadoPrueba
} from '../../../core/services/calificaciones.service';
import { formatNota } from '../../../shared/notas.util';

@Component({
  selector: 'app-historial-calificaciones',
  imports: [CommonModule],
  templateUrl: './historial-calificaciones.component.html',
  styleUrl: './historial-calificaciones.component.css'
})
export class HistorialCalificacionesComponent {
  private calificacionesService = inject(CalificacionesService);

  alumnoId = input.required<number>();
  historial = signal<CalificacionesComision[]>([]);
  cargando = signal(true);
  error = signal('');
  readonly formatNota = formatNota;

  constructor() {
    effect(() => {
      const alumnoId = this.alumnoId();
      untracked(() => {
        this.cargando.set(true);
        this.error.set('');
        this.calificacionesService.historial(alumnoId).subscribe({
          next: (data) => {
            this.historial.set(data);
            this.cargando.set(false);
          },
          error: () => {
            this.error.set('No se pudieron cargar las calificaciones');
            this.cargando.set(false);
          }
        });
      });
    });
  }

  resumen(resultado: ResultadoEvaluacion | null): string {
    if (!resultado) return '-';
    if (resultado.ausente) return 'Ausente';
    return resultado.nota !== null ? formatNota(resultado.nota) : 'Incompleta';
  }

  pruebasDeEtapa(pruebas: ResultadoPrueba[], etapa: number): ResultadoPrueba[] {
    return pruebas.filter(p => p.etapa === etapa);
  }

  formatFecha(fecha: string): string {
    const [, mes, dia] = fecha.split('-');
    return `${dia}/${mes}`;
  }
}
