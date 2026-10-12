import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { ComisionesService, Comision, ComisionClase } from '../../../core/services/comisiones.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../../../shared/confirm-dialog.component';

@Component({
  selector: 'app-comisiones',
  imports: [CommonModule, FormsModule, MatMenuModule, MatIconModule],
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
  mensaje = signal('');
  mensajeError = signal(false);

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
    this.mensaje.set('');
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

  darDeAltaTodas() {
    const anio = Number(this.anioSeleccionado);
    this.confirmar('Dar de alta todas', `¿Dar de alta todas las comisiones de ${anio}?`, 'Dar de alta', () =>
      this.comisionesService.activarPorAnio(anio).subscribe({
        next: (cantidad) => this.terminarAccion(`${cantidad} comisiones de ${anio} dadas de alta.`),
        error: (err) => this.mostrarError(err, 'Error al dar de alta las comisiones')
      })
    );
  }

  darDeBajaTodas() {
    const anio = Number(this.anioSeleccionado);
    this.confirmar('Dar de baja todas', `¿Dar de baja todas las comisiones de ${anio}?`, 'Dar de baja', () =>
      this.comisionesService.desactivarPorAnio(anio).subscribe({
        next: (cantidad) => this.terminarAccion(`${cantidad} comisiones de ${anio} dadas de baja.`),
        error: (err) => this.mostrarError(err, 'Error al dar de baja las comisiones')
      })
    );
  }

  eliminarTodas() {
    const anio = Number(this.anioSeleccionado);
    const cantidad = this.todasComisiones().length;
    this.confirmar(
      'Eliminar comisiones',
      `Se van a ELIMINAR definitivamente las ${cantidad} comisiones de ${anio} con sus horarios. ` +
      `Esta acción no se puede deshacer. Sólo es posible si ninguna tiene inscripciones.`,
      'Eliminar',
      () => this.comisionesService.eliminarPorAnio(anio).subscribe({
        next: (eliminadas) => {
          this.mostrarMensaje(`${eliminadas} comisiones de ${anio} eliminadas.`);
          this.comisionesService.obtenerAnios().subscribe({
            next: (anios) => {
              this.anios.set(anios.sort((a, b) => b - a));
              this.anioSeleccionado = anios.length > 0 ? anios[0] : 0;
              if (anios.length > 0) {
                this.cargarComisiones();
              } else {
                this.todasComisiones.set([]);
                this.filtrar();
              }
            }
          });
        },
        error: (err) => this.mostrarError(err, err?.status === 409
          ? `No se pueden eliminar las comisiones de ${anio} porque tienen inscripciones o calificaciones. Podés darlas de baja.`
          : 'Error al eliminar las comisiones')
      })
    );
  }

  private confirmar(titulo: string, mensaje: string, botonConfirmar: string, accion: () => void) {
    this.dialog.open(ConfirmDialogComponent, {
      width: '450px',
      data: { titulo, mensaje, botonConfirmar }
    }).afterClosed().subscribe(result => {
      if (result) {
        accion();
      }
    });
  }

  private terminarAccion(texto: string) {
    this.mostrarMensaje(texto);
    this.cargarComisiones();
  }

  private mostrarMensaje(texto: string) {
    this.mensajeError.set(false);
    this.mensaje.set(texto);
  }

  private mostrarError(err: any, porDefecto: string) {
    this.mensajeError.set(true);
    this.mensaje.set(err?.status === 409 ? porDefecto : (err?.error?.message || porDefecto));
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
