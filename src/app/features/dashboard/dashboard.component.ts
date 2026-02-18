import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, DashboardStats } from '../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <h2>Bienvenido al Sistema de Gestión</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">\uD83D\uDC68\u200D\uD83C\uDF93</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats().alumnosActivos }}</span>
            <span class="stat-label">Alumnos</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">\uD83D\uDC69\u200D\uD83C\uDFEB</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats().docentesActivos }}</span>
            <span class="stat-label">Docentes</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">\uD83D\uDCDA</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats().cursosActivos }}</span>
            <span class="stat-label">Cursos</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">\uD83D\uDCDD</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats().comisionesActivas }}</span>
            <span class="stat-label">Comisiones</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard h2 {
      color: #2c3e50;
      margin-bottom: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      font-size: 2.5rem;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #17a2b8;
    }

    .stat-label {
      color: #666;
      font-size: 0.95rem;
    }
  `]
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  stats = signal<DashboardStats>({
    alumnosActivos: 0,
    docentesActivos: 0,
    cursosActivos: 0,
    comisionesActivas: 0
  });

  ngOnInit() {
    this.dashboardService.obtenerEstadisticas().subscribe({
      next: (data) => this.stats.set(data)
    });
  }
}
