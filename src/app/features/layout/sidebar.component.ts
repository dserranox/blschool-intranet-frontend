import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="blschool_sidebar_logo.png" alt="British Language School" class="sidebar-logo" />
      </div>
      <nav class="sidebar-nav">
        @for (item of menuItems; track item.label) {
          @if (item.children) {
            <div class="nav-item-group">
              <button class="nav-item nav-toggle" (click)="toggleMenu(item.label)" [class.expanded]="expandedMenus().includes(item.label)">
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-label">{{ item.label }}</span>
                <span class="nav-arrow">{{ expandedMenus().includes(item.label) ? '\u25BC' : '\u25B6' }}</span>
              </button>
              @if (expandedMenus().includes(item.label)) {
                <div class="nav-submenu">
                  @for (child of item.children; track child.label) {
                    <a [routerLink]="child.route" routerLinkActive="active" class="nav-item nav-subitem">
                      <span class="nav-icon">{{ child.icon }}</span>
                      <span class="nav-label">{{ child.label }}</span>
                    </a>
                  }
                </div>
              }
            </div>
          } @else {
            <a [routerLink]="item.route" routerLinkActive="active" class="nav-item">
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label">{{ item.label }}</span>
            </a>
          }
        }
      </nav>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      background: #2c3e50;
      color: white;
      height: 100vh;
      position: fixed;
      left: 0;
      top: 0;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 1.5rem;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar-logo {
      max-width: 100px;
      height: auto;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 12px;
      padding: 8px;
    }

    .sidebar-nav {
      flex: 1;
      padding: 1rem 0;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      padding: 0.85rem 1.5rem;
      color: rgba(255, 255, 255, 0.85);
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      font-size: 0.95rem;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .nav-item.active {
      background: #17a2b8;
      color: white;
    }

    .nav-toggle {
      position: relative;
    }

    .nav-icon {
      margin-right: 0.75rem;
      font-size: 1.1rem;
    }

    .nav-label {
      flex: 1;
    }

    .nav-arrow {
      font-size: 0.7rem;
      opacity: 0.7;
    }

    .nav-submenu {
      background: rgba(0, 0, 0, 0.2);
    }

    .nav-subitem {
      padding-left: 3rem;
    }

    .nav-item-group {
      margin-bottom: 0.25rem;
    }
  `]
})
export class SidebarComponent {
  expandedMenus = signal<string[]>(['Gestión']);

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: '\uD83C\uDFE0', route: '/dashboard' },
    {
      label: 'Gestión', icon: '\uD83D\uDCCB', children: [
        { label: 'Alumnos', icon: '\uD83C\uDF93', route: '/gestion/alumnos' },
        { label: 'Docentes', icon: '\uD83D\uDC69\u200D\uD83C\uDFEB', route: '/gestion/docentes' },
        { label: 'Cursos', icon: '\uD83D\uDCDA', route: '/gestion/cursos' },
        { label: 'Comisiones', icon: '\uD83D\uDCDD', route: '/gestion/comisiones' },
      ]
    },
  ];

  toggleMenu(menuLabel: string) {
    this.expandedMenus.update(menus => {
      if (menus.includes(menuLabel)) {
        return menus.filter(m => m !== menuLabel);
      }
      return [...menus, menuLabel];
    });
  }
}
