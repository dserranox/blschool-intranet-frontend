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
  email: string;
  emailAlternativo: string | null;
  direccion: string;
  escuela: string | null;
  gradoCurso: string | null;
  estado: string;
  comisionId: number | null;
  comision: string | null;
  curso: string | null;
  telefonos: AlumnoTelefono[];
}

@Injectable({ providedIn: 'root' })
export class AlumnosService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiUrl}/alumnos`;

  ultimoEstado = 'INSCRIPTO';

  listar(estado?: string) {
    if (estado && estado !== 'TODOS') {
      return this.http.get<Alumno[]>(this.endpoint, { params: { estado } });
    }
    return this.http.get<Alumno[]>(this.endpoint);
  }

  obtenerPorId(id: number) {
    return this.http.get<Alumno>(`${this.endpoint}/${id}`);
  }

  crear(data: any) {
    return this.http.post<Alumno>(this.endpoint, data);
  }

  modificar(id: number, data: any) {
    return this.http.put<Alumno>(`${this.endpoint}/${id}`, data);
  }

  darDeBaja(id: number) {
    return this.http.put<void>(`${this.endpoint}/${id}/baja`, {});
  }
}
