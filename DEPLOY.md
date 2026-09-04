# Desplegar en Vercel con Supabase

Local corre con SQLite y cero configuración. Producción **no puede**: el disco
de las funciones serverless de Vercel es efímero y de solo lectura, así que un
archivo `.db` se perdería en cada despliegue. Por eso Supabase.

Son 15 minutos. Sigue el orden.

---

## 1. Crear la base en Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project**.
2. Ponle nombre (`docepote`), elige una contraseña para la base y la región
   más cercana (`East US` va bien para Colombia).
3. Espera a que termine de aprovisionar.
4. Ve a **Project Settings → Database → Connection string** y copia **dos**
   cadenas, en modo URI:

   | En Supabase          | Puerto | Va en          |
   | -------------------- | ------ | -------------- |
   | *Transaction pooler* | `6543` | `DATABASE_URL` |
   | *Direct connection*  | `5432` | `DIRECT_URL`   |

   Reemplaza `[YOUR-PASSWORD]` por la contraseña del paso 2. A la del pooler
   agrégale `?pgbouncer=true` al final si no lo trae.

**Por qué dos:** la app corre en serverless y abre y cierra conexiones
constantemente — sin pooler agota el límite de Postgres. Pero el pooler no
soporta crear ni migrar tablas, y para eso Prisma necesita la conexión directa.

---

## 2. Preparar el esquema y sembrar

Desde tu máquina, con las dos cadenas ya en el `.env`:

```bash
npm run db:use-postgres     # cambia el provider y agrega directUrl
npx prisma db push          # crea las tablas en Supabase
npm run db:seed             # carga sabores, productos y el admin
```

Verifica en Supabase → **Table editor** que aparezcan `Product`, `Flavor`,
`Order`, `OrderLine`, `AdminUser` y `Session`.

> Deja el esquema en `postgresql` al hacer commit: es lo que Vercel va a
> compilar. Para volver a trabajar en local con SQLite, corre
> `npm run db:use-sqlite` (pero acuérdate de devolverlo antes de desplegar).

---

## 3. Desplegar en Vercel

1. Entra a [vercel.com/new](https://vercel.com/new) e importa el repositorio
   `jesusaguilop/docepote.web`.
2. Vercel detecta Next.js solo. No cambies nada del build.
3. En **Environment Variables**, agrega:

   | Variable                      | Valor                                              |
   | ----------------------------- | -------------------------------------------------- |
   | `DATABASE_URL`                | La del pooler (6543), con `?pgbouncer=true`         |
   | `DIRECT_URL`                  | La directa (5432)                                   |
   | `NEXT_PUBLIC_SITE_URL`        | `https://tu-dominio.vercel.app`                     |
   | `NEXT_PUBLIC_WHATSAPP_NUMBER` | `573180173770`                                      |
   | `NEXT_PUBLIC_INSTAGRAM`       | `docepotevup`                                       |
   | `SESSION_SECRET`              | Algo largo y aleatorio (ver abajo)                  |
   | `PAYMENT_GATEWAY`             | `whatsapp`                                          |
   | `DELIVERY_FEE_COP`            | `5000`                                              |
   | `FREE_DELIVERY_THRESHOLD_COP` | `60000`                                             |

   Para el secreto de sesión:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Deploy**.

El `build` del proyecto ya corre `prisma generate` antes de compilar, así que
el cliente se genera con el esquema correcto en cada despliegue.

---

## 4. Después del primer despliegue

1. Vuelve a Vercel y corrige `NEXT_PUBLIC_SITE_URL` con el dominio real que te
   asignó. Redespliega. *(Importa: es la URL de seguimiento que va dentro del
   mensaje de WhatsApp de cada pedido.)*
2. Entra a `https://tu-dominio.vercel.app/admin` y **cambia la contraseña del
   administrador**. Las credenciales del seed son públicas — están en este
   repositorio.

   Para cambiarla: ajusta `ADMIN_EMAIL` y `ADMIN_PASSWORD` en tu `.env` local
   (apuntando a la base de Supabase) y corre `npm run db:seed`. Si el correo ya
   existe el seed no lo toca, así que usa un correo distinto o borra el usuario
   anterior desde el *Table editor* de Supabase.

---

## Cuando llegue Wompi

No hay que tocar código. En las variables de entorno de Vercel:

```
PAYMENT_GATEWAY=wompi
WOMPI_PUBLIC_KEY=pub_prod_xxx
WOMPI_PRIVATE_KEY=prv_prod_xxx
WOMPI_INTEGRITY_SECRET=prod_integrity_xxx
WOMPI_EVENTS_SECRET=prod_events_xxx
WOMPI_ENVIRONMENT=production
```

Y en el panel de Wompi, registra el webhook apuntando a:

```
https://tu-dominio.vercel.app/api/webhooks/wompi
```

Redespliega y listo. El adaptador ya valida la firma de integridad al cobrar y
la firma del evento al recibir el webhook.

---

## Problemas comunes

**«Can't reach database server»** — casi siempre es la contraseña sin
reemplazar en la cadena, o caracteres especiales sin codificar. Si tu
contraseña tiene `@`, `#` o `/`, hay que escaparlos en la URL.

**«prepared statement already exists»** — le falta `?pgbouncer=true` a
`DATABASE_URL`.

**Las tablas no existen** — el `prisma db push` del paso 2 no llegó a correr, o
corrió contra la base equivocada. Revísalo en el *Table editor*.

**El catálogo sale vacío** — faltó `npm run db:seed`, o se corrió contra
SQLite. Comprueba que el `.env` local apuntaba a Supabase al ejecutarlo.
