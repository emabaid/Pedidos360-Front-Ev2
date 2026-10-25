import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import { AuthService, Rol } from '../core/services/auth.service';
import { CatalogService } from '../core/services/catalog.service';
import { NotificationsService } from '../core/services/notifications.service';
import { OrdersService } from '../core/services/orders.service';

const UMBRAL_STOCK_BAJO = 5;

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  template: `
    <section class="tarjeta">
      <h2>Hola, {{ nombre() }}</h2>

      <p *ngIf="roles().length === 0">
        No se encontraron App Roles asignados para tu usuario en Entra ID.
        Pide a un administrador que te asigne ROLE_ADMINISTRADOR, ROLE_OPERADOR
        o ROLE_CLIENTE en la Enterprise Application de la API.
      </p>

      <p *ngIf="roles().length > 0">
        Tu rol: <span class="badge CREADO" *ngFor="let rol of roles()">{{ rol }}</span>
      </p>

      <div class="estadisticas">
        <div class="estadistica">
          <span class="numero">{{ total() ?? '–' }}</span>
          <span class="texto">{{ esGestor() ? 'Pedidos en total' : 'Mis pedidos' }}</span>
        </div>
        <div class="estadistica">
          <span class="numero">{{ pendientes() ?? '–' }}</span>
          <span class="texto">Por aceptar</span>
        </div>
        <div class="estadistica">
          <span class="numero">{{ enCurso() ?? '–' }}</span>
          <span class="texto">En curso</span>
        </div>
        <div class="estadistica ok">
          <span class="numero">{{ cerrados() ?? '–' }}</span>
          <span class="texto">Despachados o entregados</span>
        </div>
        <div class="estadistica" *ngIf="notificaciones() !== null">
          <span class="numero">{{ notificaciones() }}</span>
          <span class="texto">Notificaciones</span>
        </div>
        <div class="estadistica alerta" *ngIf="esGestor() && stockBajo() !== null">
          <span class="numero">{{ stockBajo() }}</span>
          <span class="texto">Productos con stock bajo</span>
        </div>
      </div>

      <div class="acciones">
        <a class="boton" routerLink="/catalog">Ver catálogo</a>
        <a class="boton" routerLink="/orders">Ver pedidos</a>
        <a class="boton secundario" routerLink="/notifications">Ver actividad</a>
      </div>

      <div class="resumen" *ngIf="tieneRol('OPERADOR')">
        Como Operador puedes administrar productos y stock, y cambiar el estado de los pedidos.
      </div>
      <div class="resumen" *ngIf="tieneRol('ADMINISTRADOR')">
        Como Administrador ves todos los pedidos, los mensajes fallidos y el panel de RabbitMQ.
      </div>
      <div class="resumen" *ngIf="tieneRol('CLIENTE')">
        Como Cliente puedes crear pedidos y seguir el estado de los tuyos.
      </div>
    </section>
  `
})
export class Dashboard implements OnInit {

  readonly roles = signal<Rol[]>([]);
  readonly nombre = signal<string>('');

  // null = todavia no carga (o fallo): se muestra un guion
  readonly total = signal<number | null>(null);
  readonly pendientes = signal<number | null>(null);
  readonly enCurso = signal<number | null>(null);
  readonly cerrados = signal<number | null>(null);
  readonly notificaciones = signal<number | null>(null);
  readonly stockBajo = signal<number | null>(null);

  constructor(
    private authService: AuthService,
    private msalService: MsalService,
    private ordersService: OrdersService,
    private catalogService: CatalogService,
    private notificationsService: NotificationsService
  ) {}

  async ngOnInit(): Promise<void> {
    const account = this.msalService.instance.getActiveAccount();
    this.nombre.set(account?.name ?? account?.username ?? 'usuario');

    const roles = await this.authService.refrescarRoles();
    this.roles.set(roles);
    this.cargarResumen();
  }

  tieneRol(rol: Rol): boolean {
    return this.roles().includes(rol);
  }

  esGestor(): boolean {
    return this.tieneRol('OPERADOR') || this.tieneRol('ADMINISTRADOR');
  }

  private cargarResumen(): void {
    this.ordersService.listar().subscribe({
      next: (pedidos) => {
        this.total.set(pedidos.length);
        this.pendientes.set(pedidos.filter(p => p.estado === 'CREADO').length);
        this.enCurso.set(pedidos.filter(p => p.estado === 'ACEPTADO' || p.estado === 'EN_PREPARACION').length);
        this.cerrados.set(pedidos.filter(p => p.estado === 'DESPACHADO' || p.estado === 'ENTREGADO').length);
      },
      error: () => {}
    });

    this.notificationsService.listar().subscribe({
      next: (n) => this.notificaciones.set(n.length),
      error: () => {}
    });

    if (this.esGestor()) {
      this.catalogService.listar().subscribe({
        next: (productos) => this.stockBajo.set(productos.filter(p => p.stock <= UMBRAL_STOCK_BAJO).length),
        error: () => {}
      });
    }
  }
}
