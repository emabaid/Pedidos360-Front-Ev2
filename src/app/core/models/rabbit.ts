export interface Notificacion {
  id: number;
  pedidoId: number;
  tipo: string;
  destinatario: string;
  mensaje: string;
  fecha: string;
}

export interface DeadLetter {
  id: number;
  colaOrigen: string;
  motivo: string;
  intentos: number;
  payload: string;
  fecha: string;
}

export interface ColaInfo {
  name: string;
  vhost?: string;
  durable?: boolean;
  messages?: number;
  consumers?: number;
  state?: string;
}

export interface ExchangeInfo {
  name: string;
  type: string;
  durable?: boolean;
}

export interface BindingInfo {
  source: string;
  destination: string;
  destinationType: string;
  routingKey: string;
}
