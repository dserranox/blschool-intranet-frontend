import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ComisionesService } from '../../../core/services/comisiones.service';
import { CursosService, Curso } from '../../../core/services/cursos.service';
import { DocentesService, Docente } from '../../../core/services/docentes.service';

@Component({
  selector: 'app-comision-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatButtonToggleModule
  ],
  templateUrl: './comision-form.component.html',
  styleUrl: './comision-form.component.css'
})
export class ComisionFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private comisionesService = inject(ComisionesService);
  private cursosService = inject(CursosService);
  private docentesService = inject(DocentesService);

  form!: FormGroup;
  esNuevo = true;
  esVisualizacion = false;
  comisionId: number | null = null;
  loading = signal(false);
  errorMessage = signal('');

  anios: number[] = [];
  cursos = signal<Curso[]>([]);
  docentes = signal<Docente[]>([]);

  diasSemana = [
    { valor: 1, nombre: 'LUNES' },
    { valor: 2, nombre: 'MARTES' },
    { valor: 3, nombre: 'MIÉRCOLES' },
    { valor: 4, nombre: 'JUEVES' },
    { valor: 5, nombre: 'VIERNES' },
    { valor: 6, nombre: 'SÁBADO' }
  ];

  horas = Array.from({ length: 16 }, (_, i) => i + 8); // 8 a 23
  minutos = [0, 15, 30, 45];

  get clases(): FormArray {
    return this.form.get('clases') as FormArray;
  }

  constructor() {
    const anioActual = new Date().getFullYear();
    this.anios = [anioActual, anioActual + 1];
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const modo = this.route.snapshot.data['modo'];

    if (id) {
      this.comisionId = Number(id);
      this.esNuevo = false;
      this.esVisualizacion = modo === 'ver';
    }

    this.buildForm();
    this.cargarCursos();
    this.cargarDocentes();

    if (!this.esNuevo) {
      this.cargarComision();
    }
  }

  private buildForm() {
    const anioActual = new Date().getFullYear();
    this.form = this.fb.group({
      anio: [anioActual, Validators.required],
      cursoId: [null, Validators.required],
      nombre: ['', Validators.required],
      cupo: [null, [Validators.required, Validators.min(1)]],
      activa: [true],
      clases: this.fb.array([])
    });
  }

  private cargarCursos() {
    this.cursosService.buscar('').subscribe({
      next: (data) => this.cursos.set(data)
    });
  }

  private cargarDocentes() {
    this.docentesService.listar().subscribe({
      next: (data) => this.docentes.set(data)
    });
  }

  private cargarComision() {
    this.loading.set(true);
    this.comisionesService.obtenerPorId(this.comisionId!).subscribe({
      next: (comision) => {
        this.form.patchValue({
          anio: comision.anio,
          cursoId: comision.curso_id,
          nombre: comision.nombre,
          cupo: comision.cupo,
          activa: comision.activa
        });

        if (comision.clases && comision.clases.length > 0) {
          comision.clases.forEach(clase => {
            const desde = this.parseHora(clase.hora_desde);
            const hasta = this.parseHora(clase.hora_hasta);
            this.clases.push(this.crearClaseGroup({
              id: clase.id,
              dia: clase.dia,
              horaDesdeH: desde.hora,
              horaDesdeM: desde.minuto,
              horaHastaH: hasta.hora,
              horaHastaM: hasta.minuto,
              docente: clase.docente,
              docenteSuplente: clase.docente_suplente
            }));
          });
        }

        if (this.esVisualizacion) {
          this.form.disable();
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar la comisión');
        this.loading.set(false);
      }
    });
  }

  private parseHora(hora: string): { hora: number; minuto: number } {
    if (!hora) return { hora: 8, minuto: 0 };
    const parts = hora.split(':');
    return { hora: Number(parts[0]), minuto: Number(parts[1]) };
  }

  crearClaseGroup(data?: {
    id?: number; dia?: number;
    horaDesdeH?: number; horaDesdeM?: number;
    horaHastaH?: number; horaHastaM?: number;
    docente?: number | null; docenteSuplente?: number | null;
  }): FormGroup {
    return this.fb.group({
      id: [data?.id || null],
      dia: [data?.dia || 1, Validators.required],
      horaDesdeH: [data?.horaDesdeH ?? 8, Validators.required],
      horaDesdeM: [data?.horaDesdeM ?? 0, Validators.required],
      horaHastaH: [data?.horaHastaH ?? 9, Validators.required],
      horaHastaM: [data?.horaHastaM ?? 0, Validators.required],
      docente: [data?.docente || null],
      docenteSuplente: [data?.docenteSuplente || null]
    });
  }

  agregarClase() {
    this.clases.push(this.crearClaseGroup());
  }

  eliminarClase(index: number) {
    this.clases.removeAt(index);
  }

  onlyNumbers(event: KeyboardEvent) {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'];
    if (allowed.includes(event.key)) return;
    if (!/^\d$/.test(event.key)) {
      event.preventDefault();
    }
  }

  guardar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const raw = this.form.getRawValue();
    const data: any = {
      anio: raw.anio,
      curso_id: raw.cursoId,
      nombre: raw.nombre,
      cupo: raw.cupo,
      activa: raw.activa,
      clases: raw.clases.map((c: any) => ({
        id: c.id,
        dia: c.dia,
        hora_desde: `${String(c.horaDesdeH).padStart(2, '0')}:${String(c.horaDesdeM).padStart(2, '0')}`,
        hora_hasta: `${String(c.horaHastaH).padStart(2, '0')}:${String(c.horaHastaM).padStart(2, '0')}`,
        docente: c.docente,
        docente_suplente: c.docenteSuplente
      }))
    };

    const request$ = this.esNuevo
      ? this.comisionesService.crear(data)
      : this.comisionesService.modificar(this.comisionId!, data);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/gestion/comisiones']);
      },
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Error al guardar la comisión');
        this.loading.set(false);
      }
    });
  }

  volver() {
    this.router.navigate(['/gestion/comisiones']);
  }
}
