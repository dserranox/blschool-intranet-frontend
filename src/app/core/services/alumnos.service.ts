import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Preinscripcion } from './preinscripciones.service';

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
  problemaSalud: string | null;
  comisionId: number | null;
  comision: string | null;
  comisionAnio: number | null;
  curso: string | null;
  telefonos: AlumnoTelefono[];
}

export interface InscripcionHistorial {
  id: number;
  anio: number;
  comisionId: number;
  comision: string;
  curso: string;
  estado: string;
  fecha: string;
}

export interface AlumnoHistorial {
  inscripciones: InscripcionHistorial[];
  preinscripciones: Preinscripcion[];
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

  listarPorComision(comisionId: number) {
    return this.http.get<Alumno[]>(`${this.endpoint}/comision/${comisionId}`);
  }

  obtenerPorId(id: number) {
    return this.http.get<Alumno>(`${this.endpoint}/${id}`);
  }

  obtenerHistorial(id: number) {
    return this.http.get<AlumnoHistorial>(`${this.endpoint}/${id}/historial`);
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
