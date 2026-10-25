import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { AuthService } from '../core/services/auth.service';
import { NotificationsService } from '../core/services/notifications.service';
import { DeadLetter, Notificacion } from '../core/models/rabbit';

@Component({
  selector: 'app-notifications',
  imports: [CommonModule],
  template: `
    <section class="tarjeta">
      <h2>Actividad de pedidos</h2>
      <p>Notificaciones generadas por RabbitMQ cuando un pedido cambia de estado.</p>

      <button class="secundario" (click)="cargar()">Actualizar</button>
      <span class="vacio"> se refresca solo cada 5 segundos</span>
      <p *ngIf="error()" class="error">{{ error() }}</p>

      <table *ngIf="notificaciones().length > 0" class="tabla">
        <thead>
          <tr><th>Fecha</th><th>Pedido</th><th>Tipo</th><th *ngIf="esGestor()">Cliente</th><th>Mensaje</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let n of notificaciones()">
            <td>{{ n.fecha | date: 'dd/MM HH:mm:ss' }}</td>
            <td>#{{ n.pedidoId }}</td>
            <td><span [class]="'badge ' + n.tipo">{{ n.tipo }}</span></td>
            <td *ngIf="esGestor()">{{ n.destinatario }}</td>
            <td>{{ n.mensaje }}</td>
          </tr>
        </tbody>
      </table>
      <p class="vacio" *ngIf="!cargando() && notificaciones().length === 0">Aún no hay actividad.</p>
    </section>

    <section class="tarjeta" *ngIf="esAdmin()">
      <h2>Mensajes fallidos (Dead Letter)</h2>
      <p>Mensajes que agotaron los reintentos o llegaron malformados.</p>

      <table *ngIf="deadLetters().length > 0" class="tabla">
        <thead>
          <tr><th>Fecha</th><th>Cola origen</th><th>Motivo</th><th>Intentos</th><th>Contenido</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let d of deadLetters()">
            <td>{{ d.fecha | date: 'dd/MM HH:mm:ss' }}</td>
            <td>{{ d.colaOrigen }}</td>
            <td>{{ d.motivo }}</td>
            <td>{{ d.intentos }}</td>
            <td><code>{{ d.payload }}</code></td>
          </tr>
        </tbody>
      </table>
      <p class="vacio" *ngIf="deadLetters().length === 0">Sin mensajes fallidos.</p>
    </section>
  `
})
export class Notifications implements OnInit, OnDestroy {

  readonly notificaciones = signal<Notificacion[]>([]);
  readonly deadLetters = signal<DeadLetter[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  constructor(private service: NotificationsService, private auth: AuthService) {}

  private timer?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.cargar();
    this.timer = setInterval(() => this.cargar(), 5000);
  }

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }

  esAdmin(): boolean {
    return this.auth.tieneRol('ADMINISTRADOR');
  }

  esGestor(): boolean {
    return this.auth.tieneAlgunRol(['ADMINISTRADOR', 'OPERADOR']);
  }

  cargar(): void {
    this.error.set('');
    this.service.listar().subscribe({
      next: (n) => { this.notificaciones.set(n); this.cargando.set(false); },
      error: () => { this.error.set('No se pudo cargar la actividad.'); this.cargando.set(false); }
    });
    if (this.esAdmin()) {
      this.service.deadLetters().subscribe({
        next: (d) => this.deadLetters.set(d),
        error: () => this.error.set('No se pudieron cargar los mensajes fallidos.')
      });
    }
  }
}
