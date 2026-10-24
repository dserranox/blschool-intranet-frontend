import { Component, effect, inject, input, signal, untracked, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import {
  CalificacionesService, DatosPrueba, GuardarNotaPrueba, PlanillaPruebas, Prueba
} from '../../../core/services/calificaciones.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';
import { formatNota, fueraDeRango, parseNota, parsePegado } from '../../../shared/notas.util';
import { PruebaDialogComponent } from './prueba-dialog.component';
import { PlanillaLogrosComponent } from './planilla-logros.component';

interface FilaEditable {
  alumnoId: number;
  apellidos: string;
  nombres: string;
  editable: boolean;
  /** id de prueba -> texto de la celda ("75", "A" = ausente, "" = sin cargar) */
  celdas: Record<number, string>;
  originales: Record<number, string>;
}

@Component({
  selector: 'app-planilla-pruebas',
  imports: [FormsModule, PlanillaLogrosComponent],
  templateUrl: './planilla-pruebas.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['../alumnos/alumnos.component.css', './planilla.css']
})
export class PlanillaPruebasComponent {
  private calificacionesService = inject(CalificacionesService);
  private dialog = inject(MatDialog);

  comisionId = input.required<number>();
  curso = input<string>('');

  planilla = signal<PlanillaPruebas | null>(null);
  filas: FilaEditable[] = [];
  guardando = signal(false);
  error = signal('');
  mensaje = signal('');
  /** Year/First: prueba abierta en su planilla de logros */
  pruebaAbierta = signal<Prueba | null>(null);
  private planillaPrueba = viewChild(PlanillaLogrosComponent);
  private carga?: Subscription;

  constructor() {
    effect(() => {
      const comisionId = this.comisionId();
      untracked(() => {
        this.pruebaAbierta.set(null);
        this.cargar(comisionId);
      });
    });
  }

  abrirPrueba(prueba: Prueba) {
    this.pruebaAbierta.set(prueba);
  }

  /** Vuelve al resumen de pruebas y lo recarga para reflejar las notas guardadas. */
  volverAPruebas() {
    this.pruebaAbierta.set(null);
    this.cargar(this.comisionId());
  }

  private cargar(comisionId: number) {
    this.carga?.unsubscribe();
    this.error.set('');
    this.mensaje.set('');
    this.carga = this.calificacionesService.planillaPruebas(comisionId).subscribe({
      next: (planilla) => this.aplicar(planilla),
      error: (err) => this.error.set(err?.error?.message || 'Error al cargar las pruebas')
    });
  }

  private aplicar(planilla: PlanillaPruebas) {
    this.planilla.set(planilla);
    this.filas = planilla.alumnos.map(a => {
      const celdas: Record<number, string> = {};
      for (const prueba of planilla.pruebas) {
        const nota = a.notas[prueba.id];
        celdas[prueba.id] = !nota ? '' : nota.ausente ? 'A' : formatNota(nota.nota);
      }
      return { alumnoId: a.alumnoId, apellidos: a.apellidos, nombres: a.nombres, editable: a.editable,
               celdas, originales: { ...celdas } };
    });
  }

  esAusente(texto: string | undefined): boolean {
    const valor = (texto ?? '').trim().toLowerCase();
    return valor === 'a' || valor === 'ausente';
  }

  private normalizada(texto: string | undefined): string {
    return this.esAusente(texto) ? 'A' : String(parseNota(texto));
  }

  celdaModificada(fila: FilaEditable, pruebaId: number): boolean {
    return this.normalizada(fila.celdas[pruebaId]) !== this.normalizada(fila.originales[pruebaId]);
  }

  modificada(fila: FilaEditable): boolean {
    return (this.planilla()?.pruebas ?? []).some(p => this.celdaModificada(fila, p.id));
  }

  hayCambios(): boolean {
    return !!this.planillaPrueba()?.hayCambios() || this.filas.some(f => this.modificada(f));
  }

  celdaInvalida(fila: FilaEditable, pruebaId: number): boolean {
    const texto = fila.celdas[pruebaId];
    return !this.esAusente(texto) && fueraDeRango(parseNota(texto), 100);
  }

  hayErrores(): boolean {
    const pruebas = this.planilla()?.pruebas ?? [];
    return this.filas.some(f => pruebas.some(p => this.celdaInvalida(f, p.id)));
  }

  moverAbajo(fila: number, columna: number) {
    const total = this.filas.length;
    for (let i = fila + 1; i < total; i++) {
      const el = document.getElementById(`celda-prueba-${i}-${columna}`);
      if (el && !(el as HTMLInputElement).disabled) {
        el.focus();
        return;
      }
    }
  }

  pegar(event: ClipboardEvent, filaInicio: number, pruebaId: number) {
    const valores = parsePegado(event.clipboardData?.getData('text') ?? '');
    if (valores.length <= 1) return;
    event.preventDefault();
    valores.forEach((valor, i) => {
      const fila = this.filas[filaInicio + i];
      if (fila && fila.editable) {
        fila.celdas[pruebaId] = valor;
      }
    });
  }

  formatFecha(fecha: string): string {
    const [, mes, dia] = fecha.split('-');
    return `${dia}/${mes}`;
  }

  nuevaPrueba() {
    this.abrirDialogo('Nueva prueba').subscribe(datos => {
      if (!datos) return;
      this.calificacionesService.crearPrueba(this.comisionId(), datos).subscribe({
        next: () => this.cargar(this.comisionId()),
        error: (err) => this.error.set(err?.error?.message || 'Error al crear la prueba')
      });
    });
  }

  editarPrueba(prueba: Prueba) {
    this.abrirDialogo('Editar prueba', prueba).subscribe(datos => {
      if (!datos) return;
      this.calificacionesService.actualizarPrueba(prueba.id, datos).subscribe({
        next: () => this.cargar(this.comisionId()),
        error: (err) => this.error.set(err?.error?.message || 'Error al modificar la prueba')
      });
    });
  }

  eliminarPrueba(prueba: Prueba) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '420px',
      data: {
        titulo: 'Eliminar prueba',
        mensaje: `¿Eliminar "${prueba.nombre}" y todas sus notas? No se puede deshacer.`,
        botonConfirmar: 'Eliminar'
      }
    }).afterClosed().subscribe(ok => {
      if (!ok) return;
      this.calificacionesService.eliminarPrueba(prueba.id).subscribe({
        next: () => this.cargar(this.comisionId()),
        error: (err) => this.error.set(err?.error?.message || 'Error al eliminar la prueba')
      });
    });
  }

  private abrirDialogo(titulo: string, prueba?: Prueba) {
    const datos: DatosPrueba | undefined = prueba && { nombre: prueba.nombre, fecha: prueba.fecha, etapa: prueba.etapa };
    return this.dialog.open<PruebaDialogComponent, unknown, DatosPrueba>(PruebaDialogComponent, {
      width: '400px',
      data: { titulo, prueba: datos }
    }).afterClosed();
  }

  descartar() {
    this.cargar(this.comisionId());
  }

  guardar() {
    const planilla = this.planilla();
    if (!planilla || this.hayErrores()) return;
    const notas: GuardarNotaPrueba[] = [];
    for (const fila of this.filas.filter(f => f.editable)) {
      for (const prueba of planilla.pruebas) {
        if (!this.celdaModificada(fila, prueba.id)) continue;
        const texto = fila.celdas[prueba.id];
        const ausente = this.esAusente(texto);
        notas.push({ alumnoId: fila.alumnoId, evaluacionId: prueba.id, ausente, nota: ausente ? null : parseNota(texto) });
      }
    }
    if (notas.length === 0) return;

    this.guardando.set(true);
    this.error.set('');
    this.mensaje.set('');
    this.calificacionesService.guardarPruebas(this.comisionId(), notas).subscribe({
      next: (actualizada) => {
        this.aplicar(actualizada);
        this.mensaje.set(`Cambios guardados (${notas.length} nota${notas.length === 1 ? '' : 's'}).`);
        this.guardando.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message || 'Error al guardar: no se guardó ningún cambio');
        this.guardando.set(false);
      }
    });
  }
}
