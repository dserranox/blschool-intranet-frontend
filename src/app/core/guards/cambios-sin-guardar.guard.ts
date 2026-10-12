import { CanDeactivateFn } from '@angular/router';

export interface ConCambiosSinGuardar {
  hayCambios(): boolean;
}

/** Pide confirmación al salir de una pantalla con cambios sin guardar. */
export const cambiosSinGuardarGuard: CanDeactivateFn<ConCambiosSinGuardar> =
  (componente) => !componente.hayCambios() || confirm('Hay cambios sin guardar. ¿Salir igual?');
