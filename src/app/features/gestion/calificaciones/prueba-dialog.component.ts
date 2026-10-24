import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { DatosPrueba } from '../../../core/services/calificaciones.service';
import { etapaPorFecha, hoyIso } from '../../../shared/notas.util';

export interface PruebaDialogData {
  titulo: string;
  prueba?: DatosPrueba;
}

@Component({
  selector: 'app-prueba-dialog',
  imports: [FormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.titulo }}</h2>
    <mat-dialog-content>
      <label class="campo">Nombre
        <input [(ngModel)]="nombre" maxlength="100" placeholder="Ej. Test Unit 3" cdkFocusInitial>
      </label>
      <label class="campo">Fecha
        <input type="date" [ngModel]="fecha" (ngModelChange)="cambiarFecha($event)">
      </label>
      <label class="campo">Etapa
        <select [(ngModel)]="etapa" (ngModelChange)="etapaManual = true">
          <option [ngValue]="1">1 — antes del Parcial</option>
          <option [ngValue]="2">2 — antes del Final</option>
        </select>
      </label>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="dialogRef.close()">Cancelar</button>
      <button mat-flat-button class="btn-ok" (click)="aceptar()" [disabled]="!nombre.trim() || !fecha">Guardar</button>
    </mat-dialog-actions>
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`
    .campo { display: flex; flex-direction: column; gap: 0.25rem; margin-bottom: 0.75rem; font-size: 0.9rem; color: #555; }
    .campo input, .campo select { padding: 0.45rem 0.6rem; border: 1px solid #ccc; border-radius: 4px; font-size: 0.95rem; }
    .btn-ok { background: #17a2b8 !important; color: white !important; }
  `]
})
export class PruebaDialogComponent {
  data = inject<PruebaDialogData>(MAT_DIALOG_DATA);
  dialogRef = inject<MatDialogRef<PruebaDialogComponent, DatosPrueba>>(MatDialogRef);

  nombre = this.data.prueba?.nombre ?? '';
  fecha = this.data.prueba?.fecha ?? hoyIso();
  etapa = this.data.prueba?.etapa ?? etapaPorFecha(this.fecha);
  /** Si la docente eligió la etapa a mano, cambiar la fecha no la pisa. */
  etapaManual = !!this.data.prueba;

  cambiarFecha(fecha: string) {
    this.fecha = fecha;
    if (!this.etapaManual && fecha) {
      this.etapa = etapaPorFecha(fecha);
    }
  }

  aceptar() {
    if (!this.nombre.trim() || !this.fecha) return;
    this.dialogRef.close({ nombre: this.nombre.trim(), fecha: this.fecha, etapa: this.etapa });
  }
}
