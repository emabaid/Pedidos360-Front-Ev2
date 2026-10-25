import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BindingInfo, ColaInfo, ExchangeInfo } from '../models/rabbit';

@Injectable({ providedIn: 'root' })
export class RabbitAdminService {

  private readonly baseUrl = `${environment.apiBaseUrl}/api/admin/rabbit`;

  constructor(private http: HttpClient) {}

  colas(): Observable<ColaInfo[]> {
    return this.http.get<ColaInfo[]>(`${this.baseUrl}/queues`);
  }

  crearCola(nombre: string, conDlq: boolean): Observable<ColaInfo> {
    return this.http.post<ColaInfo>(`${this.baseUrl}/queues`, { nombre, durable: true, conDlq });
  }

  eliminarCola(nombre: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/queues/${encodeURIComponent(nombre)}`);
  }

  purgarCola(nombre: string): Observable<{ cola: string; mensajesEliminados: number }> {
    return this.http.delete<{ cola: string; mensajesEliminados: number }>(
      `${this.baseUrl}/queues/${encodeURIComponent(nombre)}/messages`);
  }

  exchanges(): Observable<ExchangeInfo[]> {
    return this.http.get<ExchangeInfo[]>(`${this.baseUrl}/exchanges`);
  }

  crearExchange(nombre: string, tipo: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/exchanges`, { nombre, tipo, durable: true });
  }

  eliminarExchange(nombre: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/exchanges/${encodeURIComponent(nombre)}`);
  }

  eliminarBinding(cola: string, exchange: string, routingKey: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/bindings`, { body: { cola, exchange, routingKey } });
  }

  bindings(): Observable<BindingInfo[]> {
    return this.http.get<BindingInfo[]>(`${this.baseUrl}/bindings`);
  }

  crearBinding(cola: string, exchange: string, routingKey: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/bindings`, { cola, exchange, routingKey });
  }

  publicarPrueba(exchange: string, routingKey: string, payload: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/messages`, { exchange, routingKey, payload });
  }
}
