import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { PreinscripcionesService, Preinscripcion } from '../../../core/services/preinscripciones.service';
import { ComisionesService, Comision } from '../../../core/services/comisiones.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';

@Component({
  selector: 'app-preinscripciones',
  imports: [CommonModule, FormsModule],
  templateUrl: './preinscripciones.component.html',
  styleUrls: ['../alumnos/alumnos.component.css', './preinscripciones.component.css']
})
export class PreinscripcionesComponent implements OnInit {
  private preinscripcionesService = inject(PreinscripcionesService);
  private comisionesService = inject(ComisionesService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  authService = inject(AuthService);

  estados = ['PENDIENTE', 'ASIGNADA', 'DESCARTADA', 'TODOS'];
  estadoSeleccionado = 'PENDIENTE';
  anios = signal<number[]>([]);
  anioSeleccionado = new Date().getFullYear() + 1;
  searchTerm = '';

  todas = signal<Preinscripcion[]>([]);
  preinscripciones = signal<Preinscripcion[]>([]);
  comisiones = signal<Comision[]>([]);
  /** Comisión elegida en el combo de cada fila (id preinscripción -> id comisión) */
  seleccion: Record<number, number | null> = {};
  errorMessage = signal('');

  pageSizes = [10, 20, 50, 100];
  pageSize = signal(20);
  currentPage = signal(0);
  paginadas = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.preinscripciones().slice(start, start + this.pageSize());
  });
  totalPages = computed(() => Math.ceil(this.preinscripciones().length / this.pageSize()));

  ngOnInit() {
    this.preinscripcionesService.obtenerAnios().subscribe({
      next: (data) => {
        const anios = new Set([...data, this.anioSeleccionado]);
        this.anios.set([...anios].sort((a, b) => b - a));
      }
    });
    this.cargar();
  }

  onAnioChange() {
    this.cargar();
  }

  cargar() {
    this.errorMessage.set('');
    this.preinscripcionesService.listar(this.anioSeleccionado, this.estadoSeleccionado).subscribe({
      next: (data) => {
        this.todas.set(data);
        this.seleccion = {};
        data.forEach(p => this.seleccion[p.id] = p.comisionId);
        this.filtrar();
      }
    });
    this.comisionesService.buscarPorAnio(this.anioSeleccionado).subscribe({
      next: (data) => this.comisiones.set(data.filter(c => c.activa))
    });
  }

  filtrar() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.preinscripciones.set(this.todas());
    } else {
      this.preinscripciones.set(
        this.todas().filter(p =>
          p.apellidos?.toLowerCase().includes(term) ||
          p.nombres?.toLowerCase().includes(term) ||
          p.dni?.includes(term) ||
          p.escuelaCursoTurno?.toLowerCase().includes(term) ||
          p.cursoAnterior?.toLowerCase().includes(term)
        )
      );
    }
    this.currentPage.set(0);
  }

  asignar(p: Preinscripcion) {
    const comisionId = this.seleccion[p.id];
    if (!comisionId) {
      return;
    }
    this.errorMessage.set('');
    this.preinscripcionesService.asignar(p.id, comisionId).subscribe({
      next: () => this.cargar(),
      error: (err: any) => this.errorMessage.set(err?.error?.message || 'Error al asignar la comisión')
    });
  }

  descartar(p: Preinscripcion) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Descartar preinscripción',
        mensaje: `¿Descartar la preinscripción ${p.anio} de ${p.apellidos}, ${p.nombres}?` +
          (p.comisionId ? ' La inscripción a la comisión asignada quedará inactiva.' : '')
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.preinscripcionesService.descartar(p.id).subscribe({
          next: () => this.cargar(),
          error: (err: any) => this.errorMessage.set(err?.error?.message || 'Error al descartar')
        });
      }
    });
  }

  verAlumno(p: Preinscripcion) {
    this.router.navigate(['/gestion/alumnos/ver', p.alumnoId]);
  }

  editarAlumno(p: Preinscripcion) {
    this.router.navigate(['/gestion/alumnos/editar', p.alumnoId]);
  }

  formatFecha(fecha: string | null): string {
    if (!fecha) return '-';
    const [d] = fecha.split('T');
    const parts = d.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  onPageSizeChange() {
    this.currentPage.set(0);
  }

  paginaAnterior() {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
    }
  }

  paginaSiguiente() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
    }
  }
}
