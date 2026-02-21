import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { ComisionesService, Comision, ComisionClase } from '../../../core/services/comisiones.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';

@Component({
  selector: 'app-comisiones',
  imports: [CommonModule, FormsModule],
  templateUrl: './comisiones.component.html',
  styleUrl: './comisiones.component.css'
})
export class ComisionesComponent implements OnInit {
  private comisionesService = inject(ComisionesService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  authService = inject(AuthService);

  anios = signal<number[]>([]);
  anioSeleccionado = 0;
  searchTerm = '';
  todasComisiones = signal<Comision[]>([]);
  comisiones = signal<Comision[]>([]);

  private diasSemana: Record<number, string> = {
    1: 'LUNES',
    2: 'MARTES',
    3: 'MIÉRCOLES',
    4: 'JUEVES',
    5: 'VIERNES',
    6: 'SÁBADO',
    7: 'DOMINGO'
  };

  ngOnInit() {
    this.comisionesService.obtenerAnios().subscribe({
      next: (anios) => {
        this.anios.set(anios.sort((a, b) => b - a));
        if (anios.length > 0) {
          this.anioSeleccionado = anios[0];
          this.cargarComisiones();
        }
      }
    });
  }

  cargarComisiones() {
    this.comisionesService.buscarPorAnio(this.anioSeleccionado).subscribe({
      next: (data) => {
        this.todasComisiones.set(data);
        this.filtrar();
      }
    });
  }

  onAnioChange() {
    this.searchTerm = '';
    this.cargarComisiones();
  }

  filtrar() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.comisiones.set(this.todasComisiones());
    } else {
      this.comisiones.set(
        this.todasComisiones().filter(c => c.cursoNombre.toLowerCase().includes(term))
      );
    }
  }

  formatClase(clase: ComisionClase): string {
    const dia = this.diasSemana[clase.dia] || `DÍA ${clase.dia}`;
    const desde = this.formatHora(clase.hora_desde);
    const hasta = this.formatHora(clase.hora_hasta);
    return `${dia} - ${desde} a ${hasta}`;
  }

  private formatHora(hora: string): string {
    if (!hora) return '';
    // hora viene como "HH:mm:ss" o "HH:mm"
    const parts = hora.split(':');
    return `${parts[0]}:${parts[1]}`;
  }

  nuevo() {
    this.router.navigate(['/gestion/comisiones/nuevo']);
  }

  ver(comision: Comision) {
    this.router.navigate(['/gestion/comisiones/ver', comision.comId]);
  }

  editar(comision: Comision) {
    this.router.navigate(['/gestion/comisiones/editar', comision.comId]);
  }

  duplicar() {
    const anios = this.anios();
    if (anios.length === 0) return;

    const anioDesde = anios[0];
    const anioHasta = anioDesde + 1;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: {
        titulo: 'Duplicar comisiones',
        mensaje: `¿Desea duplicar las comisiones del año ${anioDesde} al ${anioHasta}?`,
        botonConfirmar: 'Duplicar'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.comisionesService.duplicar(anioDesde, anioHasta).subscribe({
          next: () => {
            this.comisionesService.obtenerAnios().subscribe({
              next: (anios) => {
                this.anios.set(anios.sort((a, b) => b - a));
                this.anioSeleccionado = anioHasta;
                this.cargarComisiones();
              }
            });
          }
        });
      }
    });
  }

  darDeBaja(comision: Comision) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Dar de baja',
        mensaje: `¿Está seguro de dar de baja la comisión "${comision.nombre}"?`
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.comisionesService.desactivar(comision.comId).subscribe({
          next: () => this.cargarComisiones()
        });
      }
    });
  }

  darDeAlta(comision: Comision) {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        titulo: 'Dar de alta',
        mensaje: `¿Está seguro de dar de alta la comisión "${comision.nombre}"?`,
        botonConfirmar: 'Dar de alta'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.comisionesService.activar(comision.comId).subscribe({
          next: () => this.cargarComisiones()
        });
      }
    });
  }
}
