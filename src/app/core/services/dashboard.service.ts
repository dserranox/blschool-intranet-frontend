import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface DashboardStats {
  alumnosActivos: number;
  docentesActivos: number;
  cursosActivos: number;
  comisionesActivas: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);

  obtenerEstadisticas() {
    return this.http.get<DashboardStats>(`${environment.apiUrl}/perfil/dashboard`);
  }
}
