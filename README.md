# Pedidos360 – frontend

Angular 21 (standalone components, signals) con login de Microsoft Entra ID (MSAL). Todas las llamadas van al BFF con el access token.

## Vistas

| Ruta | Quién | Qué hace |
|---|---|---|
| `/dashboard` | todos | resumen: pedidos por estado, notificaciones y stock bajo |
| `/catalog` | todos (editar: operador) | productos y stock |
| `/orders` | todos (cambiar estado: operador) | crear pedidos y ver su estado; el cliente solo ve los suyos |
| `/notifications` | todos | actividad generada por RabbitMQ (se refresca sola); el admin ve además los mensajes fallidos |
| `/rabbit-admin` | administrador | colas, exchanges, bindings, vaciar/eliminar y mensaje de prueba |

Los roles del token solo sirven para mostrar u ocultar botones; la autorización real la hace el BFF.

## Correr

```
npm install
ng serve
```

Configuración en `src/environments/environment.ts` (clientId, tenantId, scope de la API y `apiBaseUrl` del BFF). Los estilos globales están en `src/styles.css`.

## Estructura

```
src/app/
  core/services   auth, catalog, orders, notifications, rabbit-admin
  core/models     tipos de pedido, producto y mensajería
  dashboard · catalog · orders · notifications · rabbit-admin
```
