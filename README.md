# DOCEPOTE — tienda online

Bolo no pote artesanal en Valledupar: capas de bizcocho y brigadeiro montadas a
mano dentro de un potecito. Esta es la tienda completa — catálogo, carrito,
checkout y panel de administración.

## Arrancar

Necesitas Node 20 o superior.

El repositorio viene configurado para **PostgreSQL**, que es lo que usa el
despliegue en Vercel + Supabase. Elige cómo quieres trabajar en local:

### Opción A — apuntando a Supabase (lo mismo que producción)

```bash
npm install
cp .env.example .env
# pon DATABASE_URL y DIRECT_URL de tu proyecto de Supabase en el .env
npm run setup             # genera el cliente, crea las tablas y siembra
npm run dev
```

### Opción B — SQLite local, sin cuentas ni conexión

```bash
npm install
cp .env.example .env
npm run db:use-sqlite     # cambia el motor en el esquema
npm run setup
npm run dev
```

> Si usas la opción B, acuérdate de correr `npm run db:use-postgres` antes de
> hacer commit: Vercel compila el esquema tal como esté en el repositorio.

Abre <http://localhost:3000>.

Para desplegar, sigue [`DEPLOY.md`](./DEPLOY.md).

El panel está en <http://localhost:3000/admin>. Las credenciales que crea el
seed salen del `.env`:

```
hola@docepote.com / docepote2026
```

> **Cámbialas antes de publicar.** Edita `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el
> `.env` y vuelve a correr `npm run db:seed`.

## Comandos

| Comando             | Qué hace                                             |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Servidor de desarrollo                               |
| `npm run build`     | Compilación de producción                            |
| `npm start`         | Sirve la compilación                                 |
| `npm test`          | Pruebas de dominio y casos de uso (sin BD, ~1 s)     |
| `npm run typecheck` | TypeScript en modo estricto                          |
| `npm run setup`     | Generar cliente + crear BD + sembrar                 |
| `npm run db:seed`   | Recargar el catálogo (respeta stock y visibilidad)   |
| `npm run db:studio` | Explorar la base de datos en el navegador            |
| `npm run db:reset`  | Borrar todo y volver a sembrar                       |
| `npm run db:use-postgres` | Configurar el esquema para Supabase/Postgres   |
| `npm run db:use-sqlite`   | Configurar el esquema para SQLite local        |

## Qué incluye

**Tienda**

- Catálogo con filtro por categoría, búsqueda por nombre o sabor, y precios en
  oferta con el anterior tachado.
- Ficha de producto con el sabor, su composición capa por capa, tamaño y
  precio por unidad en los combos.
- Carrito persistente con cajón lateral, valorado siempre en el servidor.
- Checkout con recogida o domicilio, cálculo de envío y envío gratis sobre un
  umbral configurable.
- Página de seguimiento por código de pedido (`/pedido/DP-XXXX`).

**Panel** (`/admin`)

- Tablero con pedidos del día, vendido, pendientes por confirmar y ranking de
  30 días.
- Bandeja de pedidos con filtros por estado y búsqueda por código, nombre o
  celular. Cada pedido solo avanza por los pasos que su estado permite.
- Catálogo: ajuste de inventario en un clic, publicar/ocultar, y formulario
  completo con vista previa del pote en vivo.

## Cómo se cierra un pedido

Hoy: se crea la orden, se descuenta el inventario dentro de una transacción y
se abre WhatsApp con el resumen ya escrito para que el cliente lo envíe. El
pago se coordina por ahí.

Cuando tengas las llaves de Wompi, pon `PAYMENT_GATEWAY="wompi"` en el `.env`
y listo — el adaptador ya está escrito, con firma de integridad y verificación
del webhook. No hay que tocar código. Los detalles están en
[`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Inventario

Los productos se siembran **sin control de inventario** (`stock` vacío), porque
el catálogo original no declara existencias: se venden por encargo y nunca se
marcan como agotados.

Para llevar la cuenta de un producto, entra al panel → Catálogo → *Editar* y
activa «Controlar inventario». A partir de ahí el pote se descuenta con cada
pedido, la tienda avisa «últimas N unidades» y se bloquea solo al llegar a
cero.

## Configuración

Todo se controla desde el `.env` (ver `.env.example`). Lo más útil:

| Variable                      | Para qué                                    |
| ----------------------------- | ------------------------------------------- |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Número que recibe los pedidos               |
| `DELIVERY_FEE_COP`            | Costo del domicilio                         |
| `FREE_DELIVERY_THRESHOLD_COP` | Desde cuánto el domicilio va gratis         |
| `PAYMENT_GATEWAY`             | `whatsapp` o `wompi`                        |
| `SESSION_SECRET`              | Secreto de las sesiones del panel           |

La configuración se valida al arrancar: si falta algo o viene mal, el proceso
falla de inmediato con un mensaje claro en vez de romperse cuando un cliente
intente pagar.

## Stack

Next.js 15 (App Router) · TypeScript estricto · Prisma (PostgreSQL en
producción, SQLite en local) · Tailwind v4 · Motion · Vitest.

Desplegado en Vercel con Supabase.

La organización del código y el porqué de cada decisión están en
[`ARCHITECTURE.md`](./ARCHITECTURE.md).
