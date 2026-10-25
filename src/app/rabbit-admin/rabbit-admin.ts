import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RabbitAdminService } from '../core/services/rabbit-admin.service';
import { BindingInfo, ColaInfo, ExchangeInfo } from '../core/models/rabbit';

@Component({
  selector: 'app-rabbit-admin',
  imports: [CommonModule, FormsModule],
  template: `
    <section class="tarjeta">
      <h2>Administración de RabbitMQ</h2>
      <button class="secundario" (click)="cargar()">Actualizar</button>
      <p *ngIf="mensaje()" class="resumen">{{ mensaje() }}</p>
      <p *ngIf="error()" class="error">{{ error() }}</p>

      <h3>Colas</h3>
      <table *ngIf="colas().length > 0" class="tabla">
        <thead><tr><th>Nombre</th><th>Mensajes</th><th>Consumidores</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr *ngFor="let c of colas()">
            <td>{{ c.name }}</td>
            <td>{{ c.messages ?? 0 }}</td>
            <td>{{ c.consumers ?? 0 }}</td>
            <td>
              <button class="secundario" (click)="purgar(c.name)">Vaciar</button>
              <button class="peligro" (click)="eliminar(c.name)">Eliminar</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="formulario">
        <h3>Nueva cola</h3>
        <label>Nombre <input [(ngModel)]="nuevaCola" name="nuevaCola" placeholder="ej: pedidos360.demo.queue" /></label>
        <label><input type="checkbox" [(ngModel)]="conDlq" name="conDlq" /> Crear también su DLQ</label>
        <button (click)="crearCola()">Crear cola</button>
      </div>

      <h3>Exchanges</h3>
      <table *ngIf="exchanges().length > 0" class="tabla">
        <thead><tr><th>Nombre</th><th>Tipo</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr *ngFor="let e of exchanges()">
            <td>{{ e.name }}</td>
            <td>{{ e.type }}</td>
            <td><button class="peligro" (click)="eliminarExchange(e.name)">Eliminar</button></td>
          </tr>
        </tbody>
      </table>

      <div class="formulario">
        <h3>Nuevo exchange</h3>
        <label>Nombre <input [(ngModel)]="nuevoExchange" name="nuevoExchange" placeholder="ej: pedidos360.demo.exchange" /></label>
        <label>Tipo
          <select [(ngModel)]="tipoExchange" name="tipoExchange">
            <option value="direct">direct</option>
            <option value="topic">topic</option>
            <option value="fanout">fanout</option>
          </select>
        </label>
        <button (click)="crearExchange()">Crear exchange</button>
      </div>

      <h3>Bindings</h3>
      <table *ngIf="bindings().length > 0" class="tabla">
        <thead><tr><th>Exchange</th><th>Routing key</th><th>Cola</th><th>Acciones</th></tr></thead>
        <tbody>
          <tr *ngFor="let b of bindings()">
            <td>{{ b.source }}</td><td>{{ b.routingKey }}</td><td>{{ b.destination }}</td>
            <td><button class="peligro" (click)="eliminarBinding(b)">Eliminar</button></td>
          </tr>
        </tbody>
      </table>

      <div class="formulario">
        <h3>Nuevo binding</h3>
        <label>Exchange
          <select [(ngModel)]="bindExchange" name="bindExchange">
            <option *ngFor="let e of exchanges()" [value]="e.name">{{ e.name }}</option>
          </select>
        </label>
        <label>Cola
          <select [(ngModel)]="bindCola" name="bindCola">
            <option *ngFor="let c of colas()" [value]="c.name">{{ c.name }}</option>
          </select>
        </label>
        <label>Routing key <input [(ngModel)]="bindRoutingKey" name="bindRoutingKey" placeholder="ej: pedido.demo" /></label>
        <button (click)="crearBinding()">Crear binding</button>
      </div>

      <div class="formulario">
        <h3>Publicar mensaje de prueba</h3>
        <label>Exchange <input [(ngModel)]="pubExchange" name="pubExchange" /></label>
        <label>Routing key <input [(ngModel)]="pubRoutingKey" name="pubRoutingKey" /></label>
        <label>Contenido <input [(ngModel)]="pubPayload" name="pubPayload" /></label>
        <button (click)="publicar()">Publicar</button>
      </div>
    </section>
  `
})
export class RabbitAdmin implements OnInit {

  readonly colas = signal<ColaInfo[]>([]);
  readonly exchanges = signal<ExchangeInfo[]>([]);
  readonly bindings = signal<BindingInfo[]>([]);
  readonly mensaje = signal('');
  readonly error = signal('');

  nuevaCola = '';
  conDlq = true;
  nuevoExchange = '';
  tipoExchange = 'direct';
  bindExchange = '';
  bindCola = '';
  bindRoutingKey = '';
  pubExchange = 'pedidos360.direct.exchange';
  pubRoutingKey = 'pedido.creado';
  pubPayload = 'mensaje de prueba (no es JSON valido)';

  constructor(private service: RabbitAdminService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.service.colas().subscribe({
      next: (c) => { this.colas.set(c); if (!this.bindCola && c.length) this.bindCola = c[0].name; },
      error: (e) => this.fallo(e)
    });
    this.service.exchanges().subscribe({
      next: (x) => { this.exchanges.set(x); if (!this.bindExchange && x.length) this.bindExchange = x[0].name; },
      error: (e) => this.fallo(e)
    });
    this.service.bindings().subscribe({ next: (b) => this.bindings.set(b), error: (e) => this.fallo(e) });
  }

  crearCola(): void {
    if (!this.nuevaCola.trim()) return;
    this.service.crearCola(this.nuevaCola.trim(), this.conDlq).subscribe({
      next: () => { this.ok(`Cola ${this.nuevaCola} creada`); this.nuevaCola = ''; this.cargar(); },
      error: (e) => this.fallo(e)
    });
  }

  crearExchange(): void {
    if (!this.nuevoExchange.trim()) return;
    this.service.crearExchange(this.nuevoExchange.trim(), this.tipoExchange).subscribe({
      next: () => { this.ok(`Exchange ${this.nuevoExchange} creado`); this.nuevoExchange = ''; this.cargar(); },
      error: (e) => this.fallo(e)
    });
  }

  eliminarExchange(nombre: string): void {
    this.service.eliminarExchange(nombre).subscribe({
      next: () => { this.ok(`Exchange ${nombre} eliminado`); this.cargar(); },
      error: (e) => this.fallo(e)
    });
  }

  crearBinding(): void {
    this.service.crearBinding(this.bindCola, this.bindExchange, this.bindRoutingKey).subscribe({
      next: () => { this.ok(`Binding ${this.bindExchange} -> ${this.bindCola} creado`); this.cargar(); },
      error: (e) => this.fallo(e)
    });
  }

  eliminarBinding(b: BindingInfo): void {
    this.service.eliminarBinding(b.destination, b.source, b.routingKey).subscribe({
      next: () => { this.ok('Binding eliminado'); this.cargar(); },
      error: (e) => this.fallo(e)
    });
  }

  eliminar(nombre: string): void {
    this.service.eliminarCola(nombre).subscribe({
      next: () => { this.ok(`Cola ${nombre} eliminada`); this.cargar(); },
      error: (e) => this.fallo(e)
    });
  }

  purgar(nombre: string): void {
    this.service.purgarCola(nombre).subscribe({
      next: (r) => { this.ok(`${r.mensajesEliminados} mensajes eliminados de ${nombre}`); this.cargar(); },
      error: (e) => this.fallo(e)
    });
  }

  publicar(): void {
    this.service.publicarPrueba(this.pubExchange, this.pubRoutingKey, this.pubPayload).subscribe({
      next: () => { this.ok('Mensaje publicado'); setTimeout(() => this.cargar(), 1500); },
      error: (e) => this.fallo(e)
    });
  }

  private ok(texto: string): void {
    this.error.set('');
    this.mensaje.set(texto);
  }

  private fallo(e: HttpErrorResponse): void {
    this.mensaje.set('');
    const detalle = e.error?.campos ? JSON.stringify(e.error.campos) : null;
    this.error.set(`Error ${e.status}: ${e.error?.error ?? detalle ?? 'operación rechazada'}`);
  }
}
