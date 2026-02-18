import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { DocentesService } from '../../../core/services/docentes.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-docente-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'es-AR' },
    provideNativeDateAdapter()
  ],
  templateUrl: './docente-form.component.html',
  styleUrl: './docente-form.component.css'
})
export class DocenteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private docentesService = inject(DocentesService);
  private authService = inject(AuthService);

  form!: FormGroup;
  esNuevo = true;
  esVisualizacion = false;
  docenteId: number | null = null;
  loading = signal(false);
  errorMessage = signal('');
  maxFechaNacimiento: Date;

  constructor() {
    const hoy = new Date();
    this.maxFechaNacimiento = new Date(hoy.getFullYear() - 16, hoy.getMonth(), hoy.getDate());
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const modo = this.route.snapshot.data['modo'];

    if (id) {
      this.docenteId = Number(id);
      this.esNuevo = false;
      this.esVisualizacion = modo === 'ver';
    }

    this.buildForm();

    if (!this.esNuevo) {
      this.cargarDocente();
    }
  }

  private buildForm() {
    this.form = this.fb.group({
      nombres: ['', Validators.required],
      apellidos: ['', Validators.required],
      dni: ['', [Validators.required, Validators.pattern(/^\d{7,9}$/)]],
      fechaNacimiento: [null, Validators.required],
      telefono: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      direccion: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      usuario: ['', Validators.required],
      password: ['', this.esNuevo ? Validators.required : Validators.nullValidator],
      roles: [['DOCENTE'], Validators.required]
    });
  }

  private cargarDocente() {
    this.loading.set(true);
    this.docentesService.obtenerPorId(this.docenteId!).subscribe({
      next: (docente) => {
        this.form.patchValue({
          nombres: docente.nombres,
          apellidos: docente.apellidos,
          dni: docente.dni,
          fechaNacimiento: docente.fechaNacimiento ? new Date(docente.fechaNacimiento + 'T00:00:00') : null,
          telefono: docente.telefono,
          direccion: docente.direccion,
          email: docente.email,
          usuario: docente.usuario,
          roles: docente.roles
        });
        if (this.esVisualizacion) {
          this.form.disable();
        } else if (!this.authService.isAdmin()) {
          this.form.get('roles')?.disable();
        }
        this.loading.set(false);
      },
      error: () => {
        this.errorMessage.set('Error al cargar el docente');
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
    if (!this.esNuevo && (!data.password || data.password.trim() === '')) {
      delete data.password;
    }

    const request$ = this.esNuevo
      ? this.docentesService.crear(data)
      : this.docentesService.modificar(this.docenteId!, data);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/gestion/docentes']);
      },
      error: (err: any) => {
        this.errorMessage.set(err?.error?.message || 'Error al guardar el docente');
        this.loading.set(false);
      }
    });
  }

  volver() {
    this.router.navigate(['/gestion/docentes']);
  }
}
