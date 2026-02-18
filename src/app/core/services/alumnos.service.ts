import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface AlumnoTelefono {
  id: number;
  numero: string;
  tipo: string;
  nota: string | null;
  principal: boolean;
}

export interface Alumno {
  id: number;
  apellidos: string;
  nombres: string;
  dni: string;
  fechaNacimiento: string;
  estado: string;
  comision: string | null;
  curso: string | null;
  telefonos: AlumnoTelefono[];
}

@Injectable({ providedIn: 'root' })
export class AlumnosService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/alumnos`;

  listar(estado?: string) {
    if (estado && estado !== 'TODOS') {
      return this.http.get<Alumno[]>(this.endpoint, { params: { estado } });
    }
    return this.http.get<Alumno[]>(this.endpoint);
  }
}
