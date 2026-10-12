import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  CalificacionesService, GuardarFilaLogros, LogroEvaluacion, PlanillaLogros, TipoLogros
} from '../../../core/services/calificaciones.service';
import { formatNota, fueraDeRango, parseNota, parsePegado } from '../../../shared/notas.util';

interface FilaEditable {
  alumnoId: number;
  apellidos: string;
  nombres: string;
  editable: boolean;
  ausente: boolean;
  /** id de logro -> texto de la celda */
  valores: Record<number, string>;
  /** estado al cargar, para detectar cambios */
  original: string;
}

@Component({
  selector: 'app-planilla-logros',
  imports: [CommonModule, FormsModule],
  templateUrl: './planilla-logros.component.html',
  styleUrls: ['../alumnos/alumnos.component.css', './planilla.css']
})
export class PlanillaLogrosComponent {
  private calificacionesService = inject(CalificacionesService);

  comisionId = input.required<number>();
  tipo = input.required<TipoLogros>();
  curso = input<string>('');

  planilla = signal<PlanillaLogros | null>(null);
  filas: FilaEditable[] = [];
  sinLogros = signal(false);
  guardando = signal(false);
  error = signal('');
  mensaje = signal('');
  readonly formatNota = formatNota;
  private carga?: Subscription;

  constructor() {
    effect(() => {
      const comisionId = this.comisionId();
      const tipo = this.tipo();
      untracked(() => this.cargar(comisionId, tipo));
    });
  }

  private cargar(comisionId: number, tipo: TipoLogros) {
    this.carga?.unsubscribe();
    this.error.set('');
    this.mensaje.set('');
    this.sinLogros.set(false);
    this.planilla.set(null);
    this.filas = [];
    this.carga = this.calificacionesService.planillaLogros(comisionId, tipo).subscribe({
      next: (planilla) => this.aplicar(planilla),
      error: (err) => {
        if (err?.status === 409 && (err?.error?.message ?? '').startsWith('Configurá')) {
          this.sinLogros.set(true);
        } else {
          this.error.set(err?.error?.message || 'Error al cargar la planilla');
        }
      }
    });
  }

  private aplicar(planilla: PlanillaLogros) {
    this.planilla.set(planilla);
    this.filas = planilla.alumnos.map(a => {
      const fila: FilaEditable = {
        alumnoId: a.alumnoId,
        apellidos: a.apellidos,
        nombres: a.nombres,
        editable: a.editable,
        ausente: a.ausente,
        valores: Object.fromEntries(planilla.logros.map(l => [l.id, formatNota(a.valores[l.id] ?? null)])),
        original: ''
      };
      fila.original = this.serializar(fila);
      return fila;
    });
  }

  private serializar(fila: FilaEditable): string {
    const logros = this.planilla()?.logros ?? [];
    return JSON.stringify({ a: fila.ausente, v: logros.map(l => {
      if (fila.ausente) return null;
      const v = parseNota(fila.valores[l.id]);
      return v !== null && Number.isNaN(v) ? 'NaN' : v;
    }) });
  }

  descartar() {
    this.cargar(this.comisionId(), this.tipo());
  }

  modificada(fila: FilaEditable): boolean {
    return this.serializar(fila) !== fila.original;
  }

  hayCambios(): boolean {
    return this.filas.some(f => this.modificada(f));
  }

  celdaInvalida(fila: FilaEditable, logro: LogroEvaluacion): boolean {
    return !fila.ausente && fueraDeRango(parseNota(fila.valores[logro.id]), logro.peso);
  }

  hayErrores(): boolean {
    const logros = this.planilla()?.logros ?? [];
    return this.filas.some(f => logros.some(l => this.celdaInvalida(f, l)));
  }

  /** Final Mark: suma de aportes sólo si están todos cargados y son válidos. */
  notaFila(fila: FilaEditable): number | null {
    if (fila.ausente) return null;
    const logros = this.planilla()?.logros ?? [];
    let total = 0;
    for (const logro of logros) {
      const valor = parseNota(fila.valores[logro.id]);
      if (valor === null || this.celdaInvalida(fila, logro)) return null;
      total += valor;
    }
    return Math.round(total * 100) / 100;
  }

  moverAbajo(fila: number, columna: number) {
    const total = this.filas.length;
    for (let i = fila + 1; i < total; i++) {
      const el = document.getElementById(`celda-${this.tipo()}-${i}-${columna}`);
      if (el && !(el as HTMLInputElement).disabled) {
        el.focus();
        return;
      }
    }
  }

  /** Pegar una columna desde Excel: llena hacia abajo desde la celda actual. */
  pegar(event: ClipboardEvent, filaInicio: number, logroId: number) {
    const texto = event.clipboardData?.getData('text') ?? '';
    const valores = parsePegado(texto);
    if (valores.length <= 1) return; // un solo valor: pegado normal
    event.preventDefault();
    valores.forEach((valor, i) => {
      const fila = this.filas[filaInicio + i];
      if (fila && fila.editable && !fila.ausente) {
        fila.valores[logroId] = valor;
      }
    });
  }

  guardar() {
    const planilla = this.planilla();
    if (!planilla || this.hayErrores()) return;
    const filas: GuardarFilaLogros[] = this.filas
      .filter(f => f.editable && this.modificada(f))
      .map(f => ({
        alumnoId: f.alumnoId,
        ausente: f.ausente,
        valores: Object.fromEntries(planilla.logros.map(l => [l.id, f.ausente ? null : parseNota(f.valores[l.id])]))
      }));
    if (filas.length === 0) return;

    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.calificacionesService.guardarLogros(this.comisionId(), this.tipo(), filas).subscribe({
      next: (actualizada) => {
        this.aplicar(actualizada);
        this.mensaje.set(`Cambios guardados (${filas.length} alumno${filas.length === 1 ? '' : 's'}).`);
        this.guardando.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Error al guardar: no se guardó ningún cambio');
        this.guardando.set(false);
      }
    });
  }
}
