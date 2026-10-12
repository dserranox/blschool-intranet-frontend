import { Component, HostListener, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComisionesService } from '../../../core/services/comisiones.service';
import { CalificacionesService, ComisionCalificable, TipoLogros } from '../../../core/services/calificaciones.service';
import { ConCambiosSinGuardar } from '../../../core/guards/cambios-sin-guardar.guard';
import { PlanillaLogrosComponent } from './planilla-logros.component';
import { PlanillaPruebasComponent } from './planilla-pruebas.component';

type Pestania = TipoLogros | 'PRUEBAS';

@Component({
  selector: 'app-calificaciones',
  imports: [CommonModule, FormsModule, PlanillaLogrosComponent, PlanillaPruebasComponent],
  templateUrl: './calificaciones.component.html',
  styleUrls: ['../alumnos/alumnos.component.css', './calificaciones.component.css']
})
export class CalificacionesComponent implements OnInit, ConCambiosSinGuardar {
  private comisionesService = inject(ComisionesService);
  private calificacionesService = inject(CalificacionesService);

  readonly pestanias: { id: Pestania; label: string }[] = [
    { id: 'PARCIAL', label: 'Parcial' },
    { id: 'FINAL', label: 'Final' },
    { id: 'PRUEBAS', label: 'Pruebas' }
  ];

  anios = signal<number[]>([]);
  anio = signal(new Date().getFullYear());
  comisiones = signal<ComisionCalificable[]>([]);
  comisionId = signal<number | null>(null);
  pestania = signal<Pestania>('PARCIAL');
  cargando = signal(true);

  comisionSeleccionada = computed(() => this.comisiones().find(c => c.comId === this.comisionId()) ?? null);
  tipoLogros = computed<TipoLogros>(() => this.pestania() === 'FINAL' ? 'FINAL' : 'PARCIAL');

  private planillaLogros = viewChild(PlanillaLogrosComponent);
  private planillaPruebas = viewChild(PlanillaPruebasComponent);

  ngOnInit() {
    this.comisionesService.obtenerAnios().subscribe({
      next: (anios) => {
        this.anios.set([...new Set([...anios, new Date().getFullYear()])].sort((a, b) => b - a));
        this.cargarComisiones();
      },
      error: () => {
        this.anios.set([new Date().getFullYear()]);
        this.cargarComisiones();
      }
    });
  }

  cambiarAnio(anio: number) {
    this.anio.set(Number(anio));
    this.comisionId.set(null);
    this.cargarComisiones();
  }

  private cargarComisiones() {
    this.cargando.set(true);
    this.calificacionesService.comisiones(this.anio()).subscribe({
      next: (data) => {
        this.comisiones.set(data);
        if (data.length === 1) {
          this.comisionId.set(data[0].comId);
        }
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false)
    });
  }

  hayCambios(): boolean {
    return !!(this.planillaLogros()?.hayCambios() || this.planillaPruebas()?.hayCambios());
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAlCerrar(event: BeforeUnloadEvent) {
    if (this.hayCambios()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }
}
