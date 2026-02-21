import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { ComisionesService, ComisionActiva } from '../../../core/services/comisiones.service';

@Component({
  selector: 'app-alumno-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatCheckboxModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
    provideNativeDateAdapter()
  ],
  templateUrl: './alumno-form.component.html',
  styleUrl: './alumno-form.component.css'
})
export class AlumnoFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private alumnosService = inject(AlumnosService);
  private comisionesService = inject(ComisionesService);

  form!: FormGroup;
  esNuevo = true;
  esVisualizacion = false;
  alumnoId: number | null = null;
  loading = signal(false);
  errorMessage = signal('');
  maxFechaNacimiento: Date;

  estados = ['INSCRIPTO', 'INACTIVO', 'PREINSCRIPTO'];
  tiposTelefono = ['MAMA', 'PAPA', 'ALUMNO', 'TUTOR'];
  comisiones = signal<ComisionActiva[]>([]);

  get telefonos(): FormArray {
    return this.form.get('telefonos') as FormArray;
  }

  constructor() {
    const hoy = new Date();
    this.maxFechaNacimiento = new Date(hoy.getFullYear() - 3, hoy.getMonth(), hoy.getDate());
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const modo = this.route.snapshot.data['modo'];

    if (id) {
      this.alumnoId = Number(id);
      this.esNuevo = false;
      this.esVisualizacion = modo === 'ver';
    }

    this.buildForm();
    this.cargarComisiones();

    if (!this.esNuevo) {
      this.cargarAlumno();
    }
  }

  private cargarComisiones() {
    this.comisionesService.listarActivas().subscribe({
      next: (data) => this.comisiones.set(data)
    });
  }

  private buildForm() {
    this.form = this.fb.group({
      apellidos: ['', Validators.required],
      nombres: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,9}$/)]],
      fechaNacimiento: [null, Validators.required],
      email: ['', [Validators.required, Validators.email]],
      emailAlternativo: ['', Validators.email],
      direccion: ['', Validators.required],
      escuela: [''],
      gradoCurso: [''],
      estado: ['INSCRIPTO', Validators.required],
      comisionId: [null],
      telefonos: this.fb.array([])
    });
  }

  crearTelefonoGroup(data?: { id?: number; numero?: string; tipo?: string; nota?: string; principal?: boolean }): FormGroup {
    return this.fb.group({
      id: [data?.id || null],
      numero: [data?.numero || '', Validators.required],
      tipo: [data?.tipo || 'MAMA', Validators.required],
      nota: [data?.nota || ''],
      principal: [data?.principal || false]
    });
  }

  agregarTelefono() {
    this.telefonos.push(this.crearTelefonoGroup());
  }

  eliminarTelefono(index: number) {
    this.telefonos.removeAt(index);
  }

  private cargarAlumno() {
    this.loading.set(true);
    this.alumnosService.obtenerPorId(this.alumnoId!).subscribe({
      next: (alumno) => {
        this.form.patchValue({
          apellidos: alumno.apellidos,
          nombres: alumno.nombres,
          dni: alumno.dni,
          fechaNacimiento: alumno.fechaNacimiento ? new Date(alumno.fechaNacimiento + 'T00:00:00') : null,
          email: alumno.email,
          emailAlternativo: alumno.emailAlternativo,
          direccion: alumno.direccion,
          escuela: alumno.escuela,
          gradoCurso: alumno.gradoCurso,
          estado: alumno.estado,
          comisionId: alumno.comisionId
        });
        // Cargar teléfonos
        if (alumno.telefonos && alumno.telefonos.length > 0) {
          alumno.telefonos.forEach(tel => {
            this.telefonos.push(this.crearTelefonoGroup({
              id: tel.id,
              numero: tel.numero,
              tipo: tel.tipo,
              nota: tel.nota || '',
              principal: tel.principal
            }));
          });
        }
        if (this.esVisualizacion) {
          this.form.disable();
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar el alumno');
        this.loading.set(false);
      }
    });
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

    const data = { ...this.form.getRawValue() };
    if (data.fechaNacimiento instanceof Date) {
      const d = data.fechaNacimiento;
      data.fechaNacimiento = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    const request$ = this.esNuevo
      ? this.alumnosService.crear(data)
      : this.alumnosService.modificar(this.alumnoId!, data);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/gestion/alumnos']);
      },
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Error al guardar el alumno');
        this.loading.set(false);
      }
    });
  }

  volver() {
    this.router.navigate(['/gestion/alumnos']);
  }
}
