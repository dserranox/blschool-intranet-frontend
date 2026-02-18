import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Docente {
  id: number;
  nombres: string;
  apellidos: string;
  dni: string;
  fechaNacimiento: string | null;
  telefono: string;
  direccion: string;
  email: string;
  usuario: string;
  roles: string[];
  activo: boolean;
  comisiones: number;
}

@Injectable({ providedIn: 'root' })
export class DocentesService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/docentes`;

  listar() {
    return this.http.get<Docente[]>(this.endpoint);
  }

  obtenerPorId(id: number) {
    return this.http.get<Docente>(`${this.endpoint}/${id}`);
  }

  crear(data: any) {
    return this.http.post<Docente>(this.endpoint, data);
  }

  modificar(id: number, data: any) {
    return this.http.put<Docente>(`${this.endpoint}/${id}`, data);
  }

  activar(id: number) {
    return this.http.patch<void>(`${this.endpoint}/${id}/activar`, {});
  }

  desactivar(id: number) {
    return this.http.patch<void>(`${this.endpoint}/${id}/desactivar`, {});
  }
}
