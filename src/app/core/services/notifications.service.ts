import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DeadLetter, Notificacion } from '../models/rabbit';

@Injectable({ providedIn: 'root' })
export class NotificationsService {

  private readonly baseUrl = `${environment.apiBaseUrl}/api/notifications`;

  constructor(private http: HttpClient) {}

  /** Una sola ruta: el BFF filtra por el token (el cliente solo ve lo suyo). */
  listar(): Observable<Notificacion[]> {
    return this.http.get<Notificacion[]>(this.baseUrl);
  }

  /** Solo ADMINISTRADOR (el BFF responde 403 al resto). */
  deadLetters(): Observable<DeadLetter[]> {
    return this.http.get<DeadLetter[]>(`${this.baseUrl}/dead-letters`);
  }
}
